import {
  ICollectionProvider,
  CollectionMetrics,
  CollectionRawData,
} from './ICollectionProvider';
import {
  CollectionSourceConfig,
  DriveFolderItem,
  DriveSourceCandidate,
  GoogleWorkspaceBinding,
} from '../../domain/types';

/**
 * Implementação simulada da integração com Google Workspace & Google Drive.
 * Permite navegar na estrutura de pastas corporativas, localizar formulários e planilhas,
 * e ler respostas de clima organizacional sem requisições OAuth externas durante testes de UI.
 */
export class MockGoogleWorkspaceProvider implements ICollectionProvider {
  public readonly providerId = 'GOOGLE_WORKSPACE';
  public readonly providerName = 'Google Workspace (Drive & Sheets)';

  private mockFolders: Record<string, DriveFolderItem[]> = {
    root: [
      { id: 'f-2026', name: 'Pesquisas de Clima & GRO 2026', parentId: 'root', path: '/Pesquisas de Clima & GRO 2026' },
      { id: 'f-2025', name: 'Pesquisas de Clima 2025 (Histórico)', parentId: 'root', path: '/Pesquisas de Clima 2025 (Histórico)' },
      { id: 'f-ops', name: 'Formulários Operacionais e Checklist', parentId: 'root', path: '/Formulários Operacionais e Checklist' },
    ],
    'f-2026': [
      { id: 'f-2026-matriz', name: '01. Matriz - São Paulo (Clima 2026)', parentId: 'f-2026', path: '/Pesquisas de Clima & GRO 2026/01. Matriz - São Paulo' },
      { id: 'f-2026-filial', name: '02. Filial - Campinas (Clima 2026)', parentId: 'f-2026', path: '/Pesquisas de Clima & GRO 2026/02. Filial - Campinas' },
      { id: 'f-2026-logistica', name: '03. CD Logística (Clima 2026)', parentId: 'f-2026', path: '/Pesquisas de Clima & GRO 2026/03. CD Logística' },
    ],
  };

  private mockFiles: Record<string, DriveSourceCandidate[]> = {
    'f-2026-matriz': [
      {
        fileId: 'form-colab-matriz',
        fileName: 'Pesquisa com COLABORADORES 2026 - Matriz SP',
        fileType: 'GOOGLE_FORM',
        suggestedTarget: 'COLABORADOR',
        linkedSheetId: 'sheet-colab-matriz',
        linkedSheetName: 'Respostas - Colaboradores Matriz SP (Google Sheets)',
      },
      {
        fileId: 'form-gestor-matriz',
        fileName: 'Avaliação da LIDERANÇA e GESTORES 2026 - Matriz SP',
        fileType: 'GOOGLE_FORM',
        suggestedTarget: 'GESTOR',
        linkedSheetId: 'sheet-gestor-matriz',
        linkedSheetName: 'Respostas - Gestores Matriz SP (Google Sheets)',
      },
    ],
    'f-2026-filial': [
      {
        fileId: 'form-colab-filial',
        fileName: 'Clima Organizacional - Colaboradores Filial',
        fileType: 'GOOGLE_FORM',
        suggestedTarget: 'COLABORADOR',
        linkedSheetId: 'sheet-colab-filial',
        linkedSheetName: 'Respostas - Colaboradores Filial (Google Sheets)',
      },
      {
        fileId: 'form-gestor-filial',
        fileName: 'Questionário Gestores - Filial Campinas',
        fileType: 'GOOGLE_FORM',
        suggestedTarget: 'GESTOR',
        linkedSheetId: 'sheet-gestor-filial',
        linkedSheetName: 'Respostas - Gestores Filial (Google Sheets)',
      },
    ],
    'f-2026-logistica': [
      {
        fileId: 'form-colab-log',
        fileName: 'Pesquisa Colaboradores - Operacional Logística',
        fileType: 'GOOGLE_FORM',
        suggestedTarget: 'COLABORADOR',
        linkedSheetId: 'sheet-colab-log',
        linkedSheetName: 'Respostas - CD Logística (Google Sheets)',
      },
    ],
  };

  public async listFolders(parentFolderId = 'root'): Promise<DriveFolderItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 350)); // Simula latência de rede Google API
    return this.mockFolders[parentFolderId] || [];
  }

  public async discoverSources(folderId: string): Promise<DriveSourceCandidate[]> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const files = this.mockFiles[folderId] || [
      {
        fileId: `form-colab-${folderId}`,
        fileName: 'Pesquisa de Clima - Colaboradores (Detectado)',
        fileType: 'GOOGLE_FORM',
        suggestedTarget: 'COLABORADOR',
        linkedSheetId: `sheet-colab-${folderId}`,
        linkedSheetName: 'Planilha de Respostas - Colaboradores',
      },
      {
        fileId: `form-gestor-${folderId}`,
        fileName: 'Pesquisa de Clima - Gestores e Liderança (Detectado)',
        fileType: 'GOOGLE_FORM',
        suggestedTarget: 'GESTOR',
        linkedSheetId: `sheet-gestor-${folderId}`,
        linkedSheetName: 'Planilha de Respostas - Gestores',
      },
    ];

    return files.map((file) => {
      const lower = file.fileName.toLowerCase();
      let suggestedTarget: 'COLABORADOR' | 'GESTOR' | 'UNKNOWN' = file.suggestedTarget;
      if (
        lower.includes('colab') ||
        lower.includes('geral') ||
        lower.includes('operacion') ||
        lower.includes('funcion')
      ) {
        suggestedTarget = 'COLABORADOR';
      } else if (
        lower.includes('gestor') ||
        lower.includes('lideran') ||
        lower.includes('chef') ||
        lower.includes('geren')
      ) {
        suggestedTarget = 'GESTOR';
      }
      return { ...file, suggestedTarget };
    });
  }

  public async fetchMetrics(
    binding: GoogleWorkspaceBinding | undefined,
    sources: CollectionSourceConfig[],
    currentEmployeeTarget: number
  ): Promise<CollectionMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    let collabResponses = 0;
    let managerResponses = 0;
    let lastDate: string | null = null;

    if (binding) {
      // Simula contagem com base em binding do Google Drive (Sheets API mock)
      collabResponses = binding.collabSheetId
        ? Math.min(Math.floor(currentEmployeeTarget * 0.85), currentEmployeeTarget)
        : 0;
      managerResponses = binding.managerSheetId ? 3 : 0;
      lastDate = binding.lastSyncedAt || new Date().toLocaleDateString('pt-BR');
    } else if (sources && sources.length > 0) {
      const collabSource = sources.find((s) => s.formType === 'COLABORADOR');
      const managerSource = sources.find((s) => s.formType === 'GESTOR');
      collabResponses = collabSource?.responseCount || 0;
      managerResponses = managerSource?.responseCount || 0;
      lastDate = collabSource?.lastResponseDate || new Date().toLocaleDateString('pt-BR');
    }

    const target = currentEmployeeTarget > 0 ? currentEmployeeTarget : 1;
    const participationRate = Math.min(100, Math.round((collabResponses / target) * 100));
    const hasManagerResponse = managerResponses >= 1;
    const isReadyForTabulation = participationRate >= 70 && hasManagerResponse;

    return {
      totalResponses: collabResponses + managerResponses,
      lastResponseDate: lastDate,
      collabResponses,
      managerResponses,
      participationRate,
      hasManagerResponse,
      isReadyForTabulation,
    };
  }

  public async fetchRawData(
    sources: CollectionSourceConfig[],
    binding?: GoogleWorkspaceBinding
  ): Promise<CollectionRawData> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simula download via Google Sheets API

    let collabCount = 22;
    let managerCount = 3;

    if (sources && sources.length > 0) {
      const c = sources.find((s) => s.formType === 'COLABORADOR')?.responseCount;
      if (c && c > 0) collabCount = c;
      const m = sources.find((s) => s.formType === 'GESTOR')?.responseCount;
      if (m !== undefined) managerCount = m;
    }

    const collabRows: Array<Record<string, any>> = Array.from({ length: collabCount }, (_, idx) => ({
      Carimbo: new Date(Date.now() - idx * 3600000).toISOString(),
      Setor: idx % 3 === 0 ? 'Operacional' : idx % 3 === 1 ? 'Administrativo' : 'Comercial',
      'Q1 - Clima de Trabalho': ((idx + 1) % 5) + 1,
      'Q2 - Carga de Trabalho': ((idx + 2) % 5) + 1,
      'Q3 - Suporte da Liderança': ((idx + 3) % 5) + 1,
      'Q4 - Comunicação e Justiça': ((idx + 4) % 5) + 1,
      'Q5 - Reconhecimento e Crescimento': (idx % 5) + 1,
    }));

    const managerRows: Array<Record<string, any>> = Array.from(
      { length: managerCount },
      (_, idx) => ({
        Carimbo: new Date(Date.now() - idx * 7200000).toISOString(),
        Cargo: idx === 0 ? 'Gerente Geral' : 'Coordenador de Setor',
        'Q1 - Clima de Trabalho': 4,
        'Q2 - Carga de Trabalho': 3,
        'Q3 - Suporte da Liderança': 5,
        'Q4 - Comunicação e Justiça': 4,
        'Q5 - Reconhecimento e Crescimento': 4,
      })
    );

    return { collabRows, managerRows };
  }
}

export const mockGoogleWorkspaceProvider = new MockGoogleWorkspaceProvider();
