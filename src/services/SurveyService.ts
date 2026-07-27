import {
  SurveySummary,
  DashboardKpiSummary,
  SurveyFilterParams,
} from '../domain/types';

/**
 * Contrato de Serviço para Pesquisas Organizacionais.
 * Ambas as implementações (MockSurveyService e GoogleSurveyService)
 * implementam rigorosamente esta mesma interface.
 */
export interface ISurveyService {
  /**
   * Obtém a lista consolidada de resumos de pesquisas organizacionais
   */
  getSurveySummaries(params?: Partial<SurveyFilterParams>): Promise<SurveySummary[]>;

  /**
   * Calcula e retorna os 6 indicadores do Dashboard
   */
  getDashboardKpis(summaries?: SurveySummary[]): Promise<DashboardKpiSummary>;

  /**
   * Atualiza a quantidade de funcionários de uma empresa e retorna o resumo recalculado
   */
  updateEmployeeCount(companyId: string, employeeCount: number): Promise<SurveySummary>;

  /**
   * Força uma atualização/sincronização dos dados (simulada ou via API)
   */
  refresh(): Promise<void>;

  /**
   * Retorna os resumos em cache de forma síncrona para evitar telas de carregamento ao trocar de aba
   */
  getCachedSummariesSync?(): SurveySummary[];

  /**
   * Retorna a data da última sincronização em cache
   */
  getLastSyncTime?(): Date | null;
}
