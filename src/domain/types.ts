export type SurveyStatus = 'NONE' | 'IN_PROGRESS' | 'WAITING_MANAGER' | 'READY';

export type FormType = 'COLABORADOR' | 'GESTOR';

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

export interface SurveySummary {
  id: string; // Company ID
  company: Company;
  collabResponses: number;
  managerResponses: number;
  totalResponses: number;
  participationPercentage: number;
  missingResponses: number;
  status: SurveyStatus;
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
  onlyReady: boolean;
  searchQuery: string;
}
