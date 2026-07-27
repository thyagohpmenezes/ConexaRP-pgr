import { Company, SurveyStatus, SurveySummary, DashboardKpiSummary } from './types';

/**
 * Total de respostas = colaboradores + gestores
 */
export function calcularTotalRespostas(collabResponses: number, managerResponses: number): number {
  return Math.max(0, collabResponses) + Math.max(0, managerResponses);
}

/**
 * Percentual = total de respostas / número de funcionários (* 100)
 */
export function calcularPercentual(totalResponses: number, employeeCount: number): number {
  if (employeeCount <= 0) return 0;
  return (totalResponses / employeeCount) * 100;
}

/**
 * Respostas Faltantes = Math.max(0, número de funcionários - total de respostas)
 */
export function calcularRespostasFaltantes(totalResponses: number, employeeCount: number): number {
  if (employeeCount <= 0) return 0;
  return Math.max(0, employeeCount - totalResponses);
}

/**
 * Determina o status da empresa de acordo com as regras de negócio:
 * 🔴 Não iniciado: 0 colab e 0 gestores
 * 🟠 Em andamento: % < 70%
 * 🟡 Aguardando gestor: % >= 70% e 0 gestores
 * 🟢 Liberado para tabulação: % >= 70% e >= 1 gestor
 */
export function calcularStatus(
  collabResponses: number,
  managerResponses: number,
  employeeCount: number
): SurveyStatus {
  if (collabResponses === 0 && managerResponses === 0) {
    return 'NONE';
  }

  if (employeeCount <= 0) {
    return 'IN_PROGRESS';
  }

  const total = calcularTotalRespostas(collabResponses, managerResponses);
  const percentual = calcularPercentual(total, employeeCount);

  if (percentual >= 70) {
    return managerResponses >= 1 ? 'READY' : 'WAITING_MANAGER';
  }

  return 'IN_PROGRESS';
}

/**
 * Valida o modelo de dados de uma empresa
 */
export function validarEmpresa(company: Company): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!company.id || company.id.trim() === '') {
    errors.push('ID da empresa é obrigatório.');
  }
  if (!company.name || company.name.trim() === '') {
    errors.push('Nome da empresa é obrigatório.');
  }
  if (!company.clientName || company.clientName.trim() === '') {
    errors.push('Nome do cliente é obrigatório.');
  }
  if (company.employeeCount < 0) {
    errors.push('Número de funcionários não pode ser negativo.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Determina a data da última atualização comparando os formulários de colaboradores e gestores
 */
export function determinarUltimaAtualizacao(company: Company): string | null {
  const collabDate = company.collabForm?.lastResponseDate;
  const managerDate = company.managerForm?.lastResponseDate;

  if (collabDate && managerDate) {
    return new Date(collabDate) > new Date(managerDate) ? collabDate : managerDate;
  }
  return collabDate || managerDate || null;
}

/**
 * Converte um modelo de Company em um resumo completo de pesquisa (SurveySummary)
 */
export function calcularResumoEmpresa(company: Company): SurveySummary {
  const collabResponses = company.collabForm?.responseCount || 0;
  const managerResponses = company.managerForm?.responseCount || 0;
  const totalResponses = calcularTotalRespostas(collabResponses, managerResponses);
  const participationPercentage = calcularPercentual(totalResponses, company.employeeCount);
  const missingResponses = calcularRespostasFaltantes(totalResponses, company.employeeCount);
  const status = calcularStatus(collabResponses, managerResponses, company.employeeCount);
  const lastUpdated = determinarUltimaAtualizacao(company);

  return {
    id: company.id,
    company,
    collabResponses,
    managerResponses,
    totalResponses,
    participationPercentage,
    missingResponses,
    status,
    lastUpdated,
  };
}

/**
 * Agrega a lista de resumos de empresas nos 6 KPIs do Dashboard
 */
export function calcularKpisDashboard(summaries: SurveySummary[]): DashboardKpiSummary {
  let totalCompanies = summaries.length;
  let readyCompanies = 0;
  let waitingManagerCompanies = 0;
  let inProgressCompanies = 0;
  let noResponseCompanies = 0;
  let totalResponses = 0;

  summaries.forEach((s) => {
    totalResponses += s.totalResponses;
    switch (s.status) {
      case 'READY':
        readyCompanies++;
        break;
      case 'WAITING_MANAGER':
        waitingManagerCompanies++;
        break;
      case 'IN_PROGRESS':
        inProgressCompanies++;
        break;
      case 'NONE':
        noResponseCompanies++;
        break;
    }
  });

  return {
    totalCompanies,
    readyCompanies,
    waitingManagerCompanies,
    inProgressCompanies,
    noResponseCompanies,
    totalResponses,
  };
}
