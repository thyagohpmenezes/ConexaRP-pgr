
export enum RiskLevel {
  LOW = "BAIXO",
  MEDIUM = "MÉDIO",
  HIGH = "ALTO",
  CRITICAL = "CRÍTICO"
}

export enum MatrixColor {
  GREEN = "VERDE",
  YELLOW = "AMARELO",
  ORANGE = "LARANJA",
  RED = "VERMELHO"
}

export enum AssessmentStatus {
  PLANNED = "PLANEJADA",
  COLLECTING = "EM COLETA",
  ANALYZING = "EM ANÁLISE",
  VALIDATING = "VALIDAÇÃO TÉCNICA",
  COMPLETED = "CONCLUÍDA",
  ARCHIVED = "ARQUIVADA"
}

export interface HazardMaster {
  id: string;
  hazard: string;
  risk: string;
  possibleDamages: string;
}

export interface DomainData {
  id: string;
  name: string;
  employeeMean: number;
  managerMean: number;
  criticalFrequency: number; // % of 4 and 5
  items: number[];
}

export interface ChecklistData {
  conforming: number;
  partial: number;
  nonConforming: number;
  notApplicable: number;
}

export interface TriangulationSource {
  id: string;
  name: string;
  score: number; // 0-1 normalized
  weight: number;
  intensity: number; // 1, 0.5, 0
  reliability: number; // 1, 0.75, 0.5
  active: boolean;
}

export interface ActionPlan {
  id: string;
  hazardId: string;
  action: string;
  responsible: string;
  deadline: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
}

export interface SectorAssessment {
  domains: DomainData[];
  employeeOverallMean?: number;
  managerOverallMean?: number;
  triangulationScore?: number;
  grauConvergencia?: string;
  probability?: number;
  severity?: number;
  riskScore?: number;
  rowCount?: number;
}

export interface Assessment {
  id: string;
  companyId: string;
  unitId: string;
  sectorId: string;
  gesId: string;
  status: AssessmentStatus;
  startDate: string;
  endDate?: string;
  domains: DomainData[];
  checklist: ChecklistData;
  triangulationScore: number;
  grauConvergencia?: string;
  probability: number;
  severity: number;
  riskScore: number;
  actions: ActionPlan[];
  sectorBreakdown?: Record<string, SectorAssessment>;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  units: Unit[];
}

export interface Unit {
  id: string;
  name: string;
  sectors: Sector[];
}

export interface Sector {
  id: string;
  name: string;
  ges: string[];
}
