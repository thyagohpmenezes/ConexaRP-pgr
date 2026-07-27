import { fetchSheetMetrics } from './sheetsMetrics';
import { CompanySurveyMetric, SurveyStatus } from '../../types/survey';

export function extractFolderId(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }
  return trimmed;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

/**
 * Executes Google Drive v3 API file list query.
 */
async function listFiles(query: string, accessToken: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, mimeType, parents)',
    pageSize: '1000',
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Token de acesso do Google inválido ou expirado. Por favor, autentique-se novamente.');
    }
    throw new Error(`Erro no Google Drive API: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Calculates survey status based on business rules:
 * - 🔴 NONE: 0 collab AND 0 managers
 * - 🟢 READY: % >= 70% AND >= 1 manager
 * - 🟡 WAITING_MANAGER: % >= 70% AND 0 managers
 * - 🟠 IN_PROGRESS: % < 70%
 */
export function calculateSurveyStatus(
  collabResponses: number,
  managerResponses: number,
  employeeCount: number
): SurveyStatus {
  const total = collabResponses + managerResponses;

  if (collabResponses === 0 && managerResponses === 0) {
    return 'NONE';
  }

  if (employeeCount <= 0) {
    return 'IN_PROGRESS';
  }

  const percentage = (total / employeeCount) * 100;

  if (percentage >= 70) {
    if (managerResponses >= 1) {
      return 'READY';
    } else {
      return 'WAITING_MANAGER';
    }
  }

  return 'IN_PROGRESS';
}

/**
 * Main traversal function for Google Drive folder hierarchy.
 */
export async function traverseClientDriveFolder(
  rootFolderId: string,
  accessToken: string,
  storedEmployeeCounts: Record<string, number> = {}
): Promise<{ clientName: string; metrics: CompanySurveyMetric[] }> {
  const cleanedId = extractFolderId(rootFolderId);

  // 1. Get root folder details
  const rootRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${cleanedId}?fields=id,name,mimeType`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  let clientName = 'Cliente';
  if (rootRes.ok) {
    const rootData = await rootRes.json();
    clientName = rootData.name || 'Cliente';
  }

  // 2. List direct children of root folder (folders & spreadsheets)
  const rootChildren = await listFiles(
    `'${cleanedId}' in parents and trashed = false`,
    accessToken
  );

  const metrics: CompanySurveyMetric[] = [];

  // Group child folders and standalone files
  const childFolders = rootChildren.filter(
    (f) => f.mimeType === 'application/vnd.google-apps.folder'
  );

  for (const folder of childFolders) {
    // Check files inside this child folder
    const contents = await listFiles(
      `'${folder.id}' in parents and trashed = false`,
      accessToken
    );

    const subFolders = contents.filter(
      (f) => f.mimeType === 'application/vnd.google-apps.folder'
    );
    const spreadsheets = contents.filter(
      (f) => f.mimeType === 'application/vnd.google-apps.spreadsheet'
    );

    if (subFolders.length > 0) {
      // It's an Economic Group folder!
      const economicGroupName = folder.name;

      for (const compFolder of subFolders) {
        const compContents = await listFiles(
          `'${compFolder.id}' in parents and trashed = false`,
          accessToken
        );
        const compSheets = compContents.filter(
          (f) => f.mimeType === 'application/vnd.google-apps.spreadsheet'
        );

        const metric = await processCompanyFolder(
          compFolder.name,
          clientName,
          economicGroupName,
          compFolder.id,
          compSheets,
          accessToken,
          storedEmployeeCounts
        );
        if (metric) metrics.push(metric);
      }
    } else {
      // It's a Direct Company folder directly under Client
      const metric = await processCompanyFolder(
        folder.name,
        clientName,
        undefined,
        folder.id,
        spreadsheets,
        accessToken,
        storedEmployeeCounts
      );
      if (metric) metrics.push(metric);
    }
  }

  return { clientName, metrics };
}

/**
 * Process a single Company folder: identify Collab & Manager spreadsheets, fetch metrics.
 */
async function processCompanyFolder(
  companyName: string,
  clientName: string,
  economicGroup: string | undefined,
  companyFolderId: string,
  spreadsheets: DriveFile[],
  accessToken: string,
  storedEmployeeCounts: Record<string, number>
): Promise<CompanySurveyMetric | null> {
  // Flexible regex pattern for Collab and Manager sheets
  const collabSheet = spreadsheets.find(
    (s) => /COLABORADOR/i.test(s.name) || /COLABORADORES/i.test(s.name)
  );
  const managerSheet = spreadsheets.find(
    (s) => /GESTOR/i.test(s.name) || /GESTORES/i.test(s.name)
  );

  let collabResponses = 0;
  let managerResponses = 0;
  let collabLastDate: string | null = null;
  let managerLastDate: string | null = null;

  if (collabSheet) {
    const collabMetrics = await fetchSheetMetrics(collabSheet.id, accessToken);
    collabResponses = collabMetrics.responseCount;
    collabLastDate = collabMetrics.lastResponseDate;
  }

  if (managerSheet) {
    const managerMetrics = await fetchSheetMetrics(managerSheet.id, accessToken);
    managerResponses = managerMetrics.responseCount;
    managerLastDate = managerMetrics.lastResponseDate;
  }

  // Determine latest timestamp
  let lastUpdated: string | null = null;
  if (collabLastDate && managerLastDate) {
    lastUpdated = new Date(collabLastDate) > new Date(managerLastDate) ? collabLastDate : managerLastDate;
  } else {
    lastUpdated = collabLastDate || managerLastDate;
  }

  const employeeCount = storedEmployeeCounts[companyFolderId] || storedEmployeeCounts[companyName] || 0;
  const totalResponses = collabResponses + managerResponses;
  const participationPercentage = employeeCount > 0 ? (totalResponses / employeeCount) * 100 : 0;
  const missingResponses = Math.max(0, employeeCount - totalResponses);
  const status = calculateSurveyStatus(collabResponses, managerResponses, employeeCount);

  return {
    id: companyFolderId,
    clientName,
    economicGroup,
    companyName,
    employeeCount,
    collabResponses,
    managerResponses,
    totalResponses,
    participationPercentage,
    missingResponses,
    status,
    lastUpdated,
    hasCollabForm: Boolean(collabSheet),
    hasManagerForm: Boolean(managerSheet),
    collabFormUrl: collabSheet ? `https://docs.google.com/forms/d/${collabSheet.id}` : undefined,
    managerFormUrl: managerSheet ? `https://docs.google.com/forms/d/${managerSheet.id}` : undefined,
    collabSheetUrl: collabSheet ? `https://docs.google.com/spreadsheets/d/${collabSheet.id}` : undefined,
    managerSheetUrl: managerSheet ? `https://docs.google.com/spreadsheets/d/${managerSheet.id}` : undefined,
  };
}

/**
 * Demo Mock Traversal Generator (for testing without live Google API keys).
 */
export function getMockSurveyData(
  storedEmployeeCounts: Record<string, number> = {}
): { clientName: string; metrics: CompanySurveyMetric[] } {
  const clientName = 'Grupo Industrial Sertão & Co';

  const rawData = [
    {
      id: 'comp-1',
      economicGroup: 'Grupo Metalúrgico Alfa',
      companyName: 'Metalúrgica Sertão - Matriz',
      defaultEmployees: 120,
      collab: 85,
      manager: 4,
      lastUpdated: '2026-07-27 11:45:00',
    },
    {
      id: 'comp-2',
      economicGroup: 'Grupo Metalúrgico Alfa',
      companyName: 'Metalúrgica Sertão - Filial Recife',
      defaultEmployees: 50,
      collab: 42,
      manager: 0,
      lastUpdated: '2026-07-27 09:12:00',
    },
    {
      id: 'comp-3',
      economicGroup: 'Grupo Metalúrgico Alfa',
      companyName: 'Fundição Sertão',
      defaultEmployees: 80,
      collab: 30,
      manager: 1,
      lastUpdated: '2026-07-26 18:30:00',
    },
    {
      id: 'comp-4',
      economicGroup: 'Varejo & Distribuição',
      companyName: 'Sertão Logística & Transportes',
      defaultEmployees: 200,
      collab: 150,
      manager: 8,
      lastUpdated: '2026-07-27 13:05:00',
    },
    {
      id: 'comp-5',
      economicGroup: 'Varejo & Distribuição',
      companyName: 'Comércio de Peças Sertão',
      defaultEmployees: 45,
      collab: 0,
      manager: 0,
      lastUpdated: null,
    },
    {
      id: 'comp-6',
      economicGroup: undefined,
      companyName: 'Sertão Tecnologia & Serviços',
      defaultEmployees: 35,
      collab: 28,
      manager: 3,
      lastUpdated: '2026-07-27 10:00:00',
    },
  ];

  const metrics: CompanySurveyMetric[] = rawData.map((item) => {
    const employeeCount = storedEmployeeCounts[item.id] ?? item.defaultEmployees;
    const totalResponses = item.collab + item.manager;
    const participationPercentage = employeeCount > 0 ? (totalResponses / employeeCount) * 100 : 0;
    const missingResponses = Math.max(0, employeeCount - totalResponses);
    const status = calculateSurveyStatus(item.collab, item.manager, employeeCount);

    return {
      id: item.id,
      clientName,
      economicGroup: item.economicGroup,
      companyName: item.companyName,
      employeeCount,
      collabResponses: item.collab,
      managerResponses: item.manager,
      totalResponses,
      participationPercentage,
      missingResponses,
      status,
      lastUpdated: item.lastUpdated,
      hasCollabForm: true,
      hasManagerForm: true,
    };
  });

  return { clientName, metrics };
}
