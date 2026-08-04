export type SurveyStatus = 'NONE' | 'IN_PROGRESS' | 'WAITING_MANAGER' | 'READY';

export type FormType = 'COLABORADOR' | 'GESTOR';

export type CollectionSourceType = 'GOOGLE_WORKSPACE' | 'GOOGLE_FORMS' | 'TYPEFORM' | 'MICROSOFT_FORMS' | 'INTERNAL_FORM';

export interface DriveFolderItem {
  id: string;
  name: string;
  parentId?: string;
  path?: string;
}

export interface DriveSourceCandidate {
  fileId: string;
  fileName: string;
  fileType: 'GOOGLE_FORM' | 'GOOGLE_SHEET' | 'OTHER';
  suggestedTarget: FormType | 'UNKNOWN';
  linkedSheetId?: string;
  linkedSheetName?: string;
}

export interface GoogleWorkspaceBinding {
  folderId: string;
  folderName: string;
  collabFormId?: string;
  collabFormName?: string;
  collabSheetId?: string;
  managerFormId?: string;
  managerFormName?: string;
  managerSheetId?: string;
  lastSyncedAt?: string;
}

/**
 * Interface estrita para as colunas exatas da Planilha de Monitoramento Mestra (A2:F)
 * Coluna A: empresa (string)
 * Coluna B: colab (number - Respostas de Colaboradores)
 * Coluna C: gestor (number - Respostas de Gestores)
 * Coluna D: totalColaboradores (number - Quadro de funcionários)
 * Coluna E: percentual (number - Progresso %)
 * Coluna F: ultimaResposta (string - Data/Hora)
 */
export interface MonitoringSheetRow {
  empresa: string;
  colab: number;
  gestor: number;
  totalColaboradores: number;
  percentual: number;
  ultimaResposta: string;
}

/**
 * Estrutura estrita de linha da Planilha Automática Mestra de Monitoramento (Single Source of Truth)
 */
export interface MasterSheetRow {
  carimbo: string;
  empresa: string;
  grupoEconomico?: string;
  tipoFormulario: 'COLABORADOR' | 'GESTOR' | 'DESCONHECIDO';
  unidade: string;
  setor: string;
  cargo?: string;
  p1?: number; p2?: number; p3?: number; p4?: number; p5?: number;
  p6?: number; p7?: number; p8?: number; p9?: number; p10?: number;
  p11?: number; p12?: number; p13?: number; p14?: number; p15?: number;
  respostas: Record<string, any>;
  email1?: string;
  email2?: string;
  email3?: string;
  phone?: string;
  employeeSurveyUrl?: string;
  managerSurveyUrl?: string;
}

/**
 * Monitoramento sumarizado por empresa extraído da Planilha Mestra
 */
export interface MasterCompanyMonitoring {
  empresaName: string;
  economicGroup: string;
  employeeResponses: number;
  managerResponses: number;
  totalResponses: number;
  totalEmployees?: number;
  percentual?: number;
  lastResponseDate?: string;
  email1?: string;
  email2?: string;
  email3?: string;
  phone?: string;
  employeeSurveyUrl?: string;
  managerSurveyUrl?: string;
  collabRows: MasterSheetRow[];
  managerRows: MasterSheetRow[];
}

/**
 * Resultado da Sincronização Mestra da Edge Function
 */
export interface MasterSyncResult {
  success: boolean;
  scannedAt: string;
  masterSheetId: string;
  sheetTitle?: string;
  totalRowsRead: number;
  totalResponses: number;
  companiesCount: number;
  headerRow: string[];
  rows: MasterSheetRow[];
  companiesSummary: Record<string, MasterCompanyMonitoring>;
  error?: string;
}


export type WorkflowState =
  | 'PLANNED'
  | 'CONFIGURING'
  | 'COLLECTING'
  | 'WAITING_MANAGER'
  | 'READY_FOR_TABULATION'
  | 'TABULATING'
  | 'ASSESSMENT_CREATED'
  | 'RISK_INVENTORY_UPDATED'
  | 'FINISHED'
  | 'ARCHIVED';

export interface Client {
  id: string;
  name: string;
}

export interface EconomicGroup {
  id: string;
  name: string;
  clientId: string;
}

export interface SurveyForm {
  id: string;
  type: FormType;
  name: string;
  formUrl?: string;
  sheetUrl?: string;
  responseCount: number;
  lastResponseDate: string | null;
}

export interface Company {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  economicGroupId?: string;
  economicGroupName?: string;
  employeeCount: number;
  collabForm?: SurveyForm;
  managerForm?: SurveyForm;
  email1?: string;
  email2?: string;
  email3?: string;
  phone?: string;
  managerSurveyUrl?: string;
  employeeSurveyUrl?: string;
}

export interface CollectionSourceConfig {
  id: string;
  sourceType: CollectionSourceType;
  name: string;
  formType: FormType;
  externalFormUrl?: string;
  externalSheetUrl?: string;
  externalId?: string;
  responseCount: number;
  lastResponseDate: string | null;
}

export interface ResearchProject {
  id: string;
  companyId: string;
  clientName: string;
  economicGroupName?: string;
  companyName: string;
  title: string;
  goal: string;
  methodology: string;
  period: string; // Ex: "2026.1"
  targetEmployeeCount: number;
  status: WorkflowState;
  sources: CollectionSourceConfig[];
  workspaceBinding?: GoogleWorkspaceBinding;
  linkedAssessmentId?: string;
  lastTabulatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TabulatedDomainScore {
  domainId: string;
  domainName: string;
  employeeMean: number;
  managerMean: number;
  criticalFrequency: number;
}

export interface TabulationResult {
  projectId: string;
  companyId: string;
  domainScores: TabulatedDomainScore[];
  sectorBreakdown: Record<string, any>;
  unitBreakdown: Record<string, any>;
  tabulatedAt: string;
}

export interface SurveySummary {
  id: string; // ID do Projeto ou da Empresa
  company: Company;
  project?: ResearchProject;
  collabResponses: number;
  managerResponses: number;
  totalResponses: number;
  participationPercentage: number;
  missingResponses: number;
  status: SurveyStatus;
  workflowState: WorkflowState;
  lastUpdated: string | null;
}

export interface DashboardKpiSummary {
  totalCompanies: number;
  readyCompanies: number;
  waitingManagerCompanies: number;
  inProgressCompanies: number;
  noResponseCompanies: number;
  totalResponses: number;
}

export interface SurveyFilterParams {
  client: string;
  economicGroup: string;
  company: string;
  status: SurveyStatus | 'ALL';
  workflowState?: WorkflowState | 'ALL';
  onlyReady: boolean;
  searchQuery: string;
}
