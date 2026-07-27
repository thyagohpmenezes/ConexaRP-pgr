export type SurveyStatus = 'NONE' | 'IN_PROGRESS' | 'WAITING_MANAGER' | 'READY';

export interface CompanySurveyMetric {
  id: string;
  clientName: string;
  economicGroup?: string;
  companyName: string;
  employeeCount: number; // Editable by user
  collabResponses: number;
  managerResponses: number;
  totalResponses: number;
  participationPercentage: number;
  missingResponses: number; // Math.max(0, employeeCount - totalResponses)
  status: SurveyStatus;
  lastUpdated: string | null;
  hasCollabForm: boolean;
  hasManagerForm: boolean;
  collabFormUrl?: string;
  managerFormUrl?: string;
  collabSheetUrl?: string;
  managerSheetUrl?: string;
}

export interface SurveyKpiData {
  totalCompanies: number;
  readyCompanies: number;
  waitingManagerCompanies: number;
  inProgressCompanies: number;
  noResponseCompanies: number;
  totalResponses: number;
}

export interface SurveyFilterOptions {
  client: string;
  economicGroup: string;
  company: string;
  status: SurveyStatus | 'ALL';
  onlyReady: boolean;
  searchQuery: string;
}
