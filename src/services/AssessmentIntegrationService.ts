import { TabulationResult, ResearchProject } from '../domain/types';
import { Assessment, AssessmentStatus } from '../types';

/**
 * Serviço de Integração entre o Centro Operacional de Pesquisas e o Módulo de Avaliação GRO/PGR.
 * Injeta os dados tabulados dos domínios diretamente nas estruturas de Avaliação do sistema.
 */
export class AssessmentIntegrationService {
  /**
   * Converte o resultado de tabulação em um objeto Assessment pronto para o fluxo de risco GRO/PGR
   */
  public generateAssessmentFromTabulation(
    project: ResearchProject,
    tabulation: TabulationResult
  ): Assessment {
    const assessmentId = project.linkedAssessmentId || `asst-proj-${project.id}`;

    // Converte os domínios tabulados para a estrutura DomainData exigida pelo GRO/PGR
    const domains = tabulation.domainScores.map((score) => ({
      id: score.domainId,
      name: score.domainName,
      employeeMean: score.employeeMean,
      managerMean: score.managerMean,
      criticalFrequency: score.criticalFrequency,
      items: [score.employeeMean, score.managerMean],
    }));

    return {
      id: assessmentId,
      companyId: project.companyId,
      unitId: '',
      sectorId: '',
      gesId: '',
      status: AssessmentStatus.IN_PROGRESS,
      startDate: project.createdAt || new Date().toISOString(),
      domains,
      checklist: {
        conforming: 10,
        partial: 3,
        nonConforming: 2,
        notApplicable: 0,
      },
      sectorBreakdown: tabulation.sectorBreakdown,
      unitBreakdown: tabulation.unitBreakdown,
      actions: [],
      triangulationScore: 0.75,
      riskScore: 3,
      probability: 2,
      severity: 2,
    };
  }
}

export const assessmentIntegrationService = new AssessmentIntegrationService();
