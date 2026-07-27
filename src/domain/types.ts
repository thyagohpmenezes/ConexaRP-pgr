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
