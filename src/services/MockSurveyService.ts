import { ISurveyService } from './SurveyService';
import {
  Company,
  SurveySummary,
  DashboardKpiSummary,
  SurveyFilterParams,
} from '../domain/types';
import { MOCK_COMPANIES } from '../data/mockData';
import {
  calcularResumoEmpresa,
  calcularKpisDashboard,
} from '../domain/calculations';

const EMPLOYEE_COUNTS_STORAGE_KEY = 'conexarp_domain_employee_counts';

export class MockSurveyService implements ISurveyService {
  private companies: Company[];
  private cachedSummaries: SurveySummary[] | null = null;
  private lastSyncTime: Date | null = new Date();

  constructor() {
    this.companies = this.loadCompaniesWithStoredEmployeeCounts();
    this.rebuildCache();
  }

  private loadCompaniesWithStoredEmployeeCounts(): Company[] {
    let storedCounts: Record<string, number> = {};
    try {
      const saved = localStorage.getItem(EMPLOYEE_COUNTS_STORAGE_KEY);
      if (saved) {
        storedCounts = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler employee counts do localStorage', e);
    }

    return MOCK_COMPANIES.map((comp) => {
      const count = storedCounts[comp.id] ?? comp.employeeCount;
      return {
        ...comp,
        employeeCount: count,
      };
    });
  }

  private rebuildCache(): SurveySummary[] {
    this.cachedSummaries = this.companies.map((company) => calcularResumoEmpresa(company));
    return this.cachedSummaries;
  }

  private saveEmployeeCountToStorage(companyId: string, count: number): void {
    try {
      const saved = localStorage.getItem(EMPLOYEE_COUNTS_STORAGE_KEY);
      const storedCounts: Record<string, number> = saved ? JSON.parse(saved) : {};
      storedCounts[companyId] = count;
      localStorage.setItem(EMPLOYEE_COUNTS_STORAGE_KEY, JSON.stringify(storedCounts));
    } catch (e) {
      console.error('Erro ao salvar employee count no localStorage', e);
    }
  }

  public getCachedSummariesSync(): SurveySummary[] {
    if (!this.cachedSummaries) {
      return this.rebuildCache();
    }
    return this.cachedSummaries;
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  public async getSurveySummaries(
    params?: Partial<SurveyFilterParams>
  ): Promise<SurveySummary[]> {
    const summaries = this.getCachedSummariesSync();

    if (!params) return summaries;

    return summaries.filter((item) => {
      if (params.client && params.client !== 'ALL' && item.company.clientName !== params.client) {
        return false;
      }
      if (params.economicGroup && params.economicGroup !== 'ALL') {
        if (params.economicGroup === 'DIRECT') {
          if (item.company.economicGroupName) return false;
        } else if (item.company.economicGroupName !== params.economicGroup) {
          return false;
        }
      }
      if (params.company && params.company !== 'ALL' && item.company.name !== params.company) {
        return false;
      }
      if (params.status && params.status !== 'ALL' && item.status !== params.status) {
        return false;
      }
      if (params.onlyReady && item.status !== 'READY') {
        return false;
      }
      if (params.searchQuery && params.searchQuery.trim() !== '') {
        const query = params.searchQuery.toLowerCase();
        const matchName = item.company.name.toLowerCase().includes(query);
        const matchClient = item.company.clientName.toLowerCase().includes(query);
        const matchGroup = item.company.economicGroupName?.toLowerCase().includes(query);
        if (!matchName && !matchClient && !matchGroup) return false;
      }
      return true;
    });
  }

  public async getDashboardKpis(
    summaries?: SurveySummary[]
  ): Promise<DashboardKpiSummary> {
    const list = summaries || this.getCachedSummariesSync();
    return calcularKpisDashboard(list);
  }

  public async updateEmployeeCount(
    companyId: string,
    employeeCount: number
  ): Promise<SurveySummary> {
    const validCount = Math.max(0, isNaN(employeeCount) ? 0 : employeeCount);

    const targetCompany = this.companies.find((c) => c.id === companyId);
    if (!targetCompany) {
      throw new Error(`Empresa com ID ${companyId} não foi encontrada.`);
    }

    targetCompany.employeeCount = validCount;
    this.saveEmployeeCountToStorage(companyId, validCount);
    this.rebuildCache();

    return calcularResumoEmpresa(targetCompany);
  }

  public async refresh(): Promise<void> {
    // Simula pequena latência assíncrona apenas quando o usuário clica explicitamente em "Atualizar"
    await new Promise((res) => setTimeout(res, 300));
    this.companies = this.loadCompaniesWithStoredEmployeeCounts();
    this.rebuildCache();
    this.lastSyncTime = new Date();
  }
}

// Singleton do serviço mock mantido em memória durante a sessão da aplicação
export const mockSurveyService = new MockSurveyService();
