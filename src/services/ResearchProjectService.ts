import {
  ResearchProject,
  WorkflowState,
  TabulationResult,
  Company,
  SurveySummary,
  GoogleWorkspaceBinding,
} from '../domain/types';
import { ICollectionProvider, CollectionMetrics } from './providers/ICollectionProvider';
import { GoogleFormsProvider } from './providers/GoogleFormsProvider';
import { googleWorkspaceCollectionProvider } from './providers/GoogleWorkspaceCollectionProvider';
import { workflowEngine, evaluateAutoState, canTransition } from './WorkflowEngine';
import { tabulationService } from './TabulationService';
import { assessmentIntegrationService } from './AssessmentIntegrationService';
import { notificationService } from './NotificationService';
import { MOCK_COMPANIES } from '../data/mockData';
import { Assessment } from '../types';

const PROJECTS_STORAGE_KEY = 'conexarp_research_projects_v3';

export class ResearchProjectService {
  private projects: ResearchProject[] = [];
  private collectionProvider: ICollectionProvider;

  constructor(provider?: ICollectionProvider) {
    this.collectionProvider = provider || googleWorkspaceCollectionProvider;
    this.projects = this.loadProjectsFromStorage();
  }

  public getProvider(): ICollectionProvider {
    return this.collectionProvider;
  }

  private loadProjectsFromStorage(): ResearchProject[] {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler projetos do localStorage', e);
    }
    // Inicialização com dados padrão caso o storage esteja vazio
    return this.createDefaultProjects();
  }

  private createDefaultProjects(): ResearchProject[] {
    return MOCK_COMPANIES.map((company, idx) => {
      const id = `proj-${company.id}`;
      const isReady = idx % 4 === 0;
      const isWaitingManager = idx % 4 === 1;

      return {
        id,
        companyId: company.id,
        clientName: company.clientName,
        economicGroupName: company.economicGroupName,
        companyName: company.name,
        title: `Pesquisa de Clima & Riscos - ${company.name}`,
        goal: 'Diagnóstico dos fatores psicossociais conforme diretrizes da NR-01.',
        methodology: 'Questionário Psicossocial ConexaRP (Escala Likert 1-5)',
        period: '2026.1',
        targetEmployeeCount: company.employeeCount || 25,
        status: isReady
          ? 'READY_FOR_TABULATION'
          : isWaitingManager
          ? 'WAITING_MANAGER'
          : 'COLLECTING',
        workspaceBinding: isReady || isWaitingManager ? {
          folderId: `f-2026-${company.id}`,
          folderName: `Pesquisas / ${company.name} / Clima 2026`,
          collabFormId: `form-colab-${company.id}`,
          collabFormName: `Pesquisa com COLABORADORES 2026 - ${company.name}`,
          collabSheetId: `sheet-colab-${company.id}`,
          managerFormId: `form-gestor-${company.id}`,
          managerFormName: `Avaliação da LIDERANÇA e GESTORES 2026 - ${company.name}`,
          managerSheetId: `sheet-gestor-${company.id}`,
          lastSyncedAt: new Date().toLocaleDateString('pt-BR'),
        } : undefined,
        sources: [
          {
            id: `src-colab-${company.id}`,
            sourceType: 'GOOGLE_WORKSPACE',
            name: `RP - Pesquisa com COLABORADORES - ${company.name}`,
            formType: 'COLABORADOR',
            externalFormUrl: company.collabForm?.formUrl || 'https://docs.google.com/forms/mock-colaborador',
            externalSheetUrl: company.collabForm?.sheetUrl || 'https://docs.google.com/spreadsheets/mock-colab',
            responseCount: isReady ? Math.ceil((company.employeeCount || 25) * 0.8) : isWaitingManager ? Math.ceil((company.employeeCount || 25) * 0.72) : 5,
            lastResponseDate: new Date().toLocaleDateString('pt-BR'),
          },
          {
            id: `src-manager-${company.id}`,
            sourceType: 'GOOGLE_WORKSPACE',
            name: `RP - Pesquisa com GESTORES - ${company.name}`,
            formType: 'GESTOR',
            externalFormUrl: company.managerForm?.formUrl || 'https://docs.google.com/forms/mock-gestores',
            externalSheetUrl: company.managerForm?.sheetUrl || 'https://docs.google.com/spreadsheets/mock-gestor',
            responseCount: isReady ? 2 : 0,
            lastResponseDate: isReady ? new Date().toLocaleDateString('pt-BR') : null,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private saveProjectsToStorage(): void {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(this.projects));
    } catch (e) {
      console.error('Erro ao salvar projetos no localStorage', e);
    }
  }

  public getAllProjects(): ResearchProject[] {
    return this.projects;
  }

  public getProjectById(id: string): ResearchProject | null {
    return this.projects.find((p) => p.id === id) || null;
  }

  public getProjectsByCompany(companyId: string): ResearchProject[] {
    return this.projects.filter((p) => p.companyId === companyId);
  }

  /**
   * Consulta o quadro dinâmico em tempo real de funcionários da empresa
   */
  private getDynamicEmployeeCount(companyId: string, defaultTarget: number): number {
    const liveCompany = MOCK_COMPANIES.find((c) => c.id === companyId);
    return liveCompany?.employeeCount && liveCompany.employeeCount > 0
      ? liveCompany.employeeCount
      : defaultTarget > 0
      ? defaultTarget
      : 1;
  }

  /**
   * Cria um novo Projeto de Pesquisa para uma Empresa
   */
  public async createProject(params: {
    company: Company;
    title: string;
    goal: string;
    period: string;
    targetEmployeeCount: number;
  }): Promise<ResearchProject> {
    const { company, title, goal, period, targetEmployeeCount } = params;

    const projectId = `proj-${Date.now()}`;
    const newProject: ResearchProject = {
      id: projectId,
      companyId: company.id,
      clientName: company.clientName,
      economicGroupName: company.economicGroupName,
      companyName: company.name,
      title,
      goal,
      methodology: 'Questionário Psicossocial ConexaRP (Escala Likert 1-5)',
      period,
      targetEmployeeCount,
      status: 'PLANNED',
      sources: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projects.unshift(newProject);
    this.saveProjectsToStorage();

    notificationService.notifyStateChange(
      newProject.id,
      newProject.title,
      newProject.companyName,
      newProject.status
    );

    return newProject;
  }

  /**
   * Vincula uma pasta do Google Workspace & Drive a uma pesquisa existente
   */
  public async bindWorkspaceFolder(
    projectId: string,
    binding: GoogleWorkspaceBinding
  ): Promise<ResearchProject> {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Projeto de pesquisa não encontrado.');

    project.workspaceBinding = {
      ...binding,
      lastSyncedAt: new Date().toLocaleDateString('pt-BR'),
    };

    // Alimenta as fontes de coleta na estrutura de domínio para observabilidade e relatórios
    project.sources = [
      {
        id: `src-colab-${projectId}`,
        sourceType: 'GOOGLE_WORKSPACE',
        name: binding.collabFormName || `Colaboradores - ${project.companyName}`,
        formType: 'COLABORADOR',
        externalFormUrl: binding.collabFormId ? `https://docs.google.com/forms/d/${binding.collabFormId}/viewform` : undefined,
        externalSheetUrl: binding.collabSheetId ? `https://docs.google.com/spreadsheets/d/${binding.collabSheetId}/edit` : undefined,
        responseCount: 0,
        lastResponseDate: null,
      },
      {
        id: `src-manager-${projectId}`,
        sourceType: 'GOOGLE_WORKSPACE',
        name: binding.managerFormName || `Gestores - ${project.companyName}`,
        formType: 'GESTOR',
        externalFormUrl: binding.managerFormId ? `https://docs.google.com/forms/d/${binding.managerFormId}/viewform` : undefined,
        externalSheetUrl: binding.managerSheetId ? `https://docs.google.com/spreadsheets/d/${binding.managerSheetId}/edit` : undefined,
        responseCount: 0,
        lastResponseDate: null,
      },
    ];

    project.updatedAt = new Date().toISOString();
    
    // Inicia no estado em configuração ou coleta
    if (project.status === 'PLANNED') {
      workflowEngine.transitionTo(project, 'CONFIGURING');
    }

    this.saveProjectsToStorage();
    await this.syncProjectMetrics(projectId);

    return project;
  }

  /**
   * Sincroniza em tempo real as respostas das planilhas Google Sheets com o cálculo estritamente dinâmico
   */
  public async syncProjectMetrics(projectId: string): Promise<CollectionMetrics | null> {
    const project = this.getProjectById(projectId);
    if (!project || !project.workspaceBinding) return null;

    const dynamicCount = this.getDynamicEmployeeCount(project.companyId, project.targetEmployeeCount);
    project.targetEmployeeCount = dynamicCount;

    const metrics = await this.collectionProvider.fetchMetrics(
      project.workspaceBinding,
      project.sources,
      dynamicCount
    );

    project.workspaceBinding.lastSyncedAt = new Date().toLocaleDateString('pt-BR');
    project.updatedAt = new Date().toISOString();

    const collabSrc = project.sources.find((s) => s.formType === 'COLABORADOR');
    const managerSrc = project.sources.find((s) => s.formType === 'GESTOR');

    if (collabSrc) {
      collabSrc.responseCount = metrics.collabResponses;
      collabSrc.lastResponseDate = metrics.lastResponseDate;
    }
    if (managerSrc) {
      managerSrc.responseCount = metrics.managerResponses;
      managerSrc.lastResponseDate = metrics.managerResponses > 0 ? metrics.lastResponseDate : null;
    }

    // Avaliação automática de transição no Workflow perante regras
    const nextState = evaluateAutoState(project, dynamicCount);
    if (nextState !== project.status && canTransition(project.status, nextState, project, dynamicCount).allowed) {
      workflowEngine.transitionTo(project, nextState);
      notificationService.notifyStateChange(project.id, project.title, project.companyName, project.status);
    }

    this.saveProjectsToStorage();
    return metrics;
  }

  /**
   * Transiciona o estado do Workflow do Projeto
   */
  public transitionWorkflow(
    projectId: string,
    targetState: WorkflowState
  ): { success: boolean; project?: ResearchProject; reason?: string } {
    const project = this.getProjectById(projectId);
    if (!project) return { success: false, reason: 'Projeto não encontrado.' };

    const dynamicCount = this.getDynamicEmployeeCount(project.companyId, project.targetEmployeeCount);
    const result = workflowEngine.transitionTo(project, targetState, dynamicCount);

    if (result.success) {
      this.saveProjectsToStorage();
      notificationService.notifyStateChange(
        project.id,
        project.title,
        project.companyName,
        project.status
      );
      return { success: true, project };
    }

    return { success: false, reason: result.reason };
  }

  /**
   * Executa a Tabulação Direta e Injeta no Fluxo de Avaliação GRO/PGR
   */
  public async executeTabulation(projectId: string): Promise<{
    tabulation: TabulationResult;
    assessment: Assessment;
    project: ResearchProject;
  }> {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Projeto de pesquisa não encontrado.');

    // 1. Muda estado para TABULATING
    workflowEngine.transitionTo(project, 'TABULATING');
    this.saveProjectsToStorage();

    // 2. Processa os dados brutos lidos direto da planilha sincronizada e gera médias Likert
    const tabulation = await tabulationService.tabulateProject(project, this.collectionProvider);

    // 3. Gera a Avaliação GRO/PGR
    const assessment = assessmentIntegrationService.generateAssessmentFromTabulation(
      project,
      tabulation
    );

    // 4. Atualiza estado para ASSESSMENT_CREATED -> RISK_INVENTORY_UPDATED -> FINISHED
    project.linkedAssessmentId = assessment.id;
    project.lastTabulatedAt = new Date().toISOString();

    workflowEngine.transitionTo(project, 'ASSESSMENT_CREATED');
    workflowEngine.transitionTo(project, 'RISK_INVENTORY_UPDATED');
    workflowEngine.transitionTo(project, 'FINISHED');

    this.saveProjectsToStorage();

    notificationService.notifyStateChange(
      project.id,
      project.title,
      project.companyName,
      project.status
    );

    return { tabulation, assessment, project };
  }

  /**
   * "Tabular Novamente": Permite atualizar o cálculo e histórico do GRO/PGR com novas respostas pós-bloqueio
   */
  public async reExecuteTabulation(projectId: string): Promise<{
    tabulation: TabulationResult;
    assessment: Assessment;
    project: ResearchProject;
  }> {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Projeto de pesquisa não encontrado.');

    // Sincroniza em tempo real antes de retabular
    await this.syncProjectMetrics(projectId);

    const tabulation = await tabulationService.tabulateProject(project, this.collectionProvider);
    const assessment = assessmentIntegrationService.generateAssessmentFromTabulation(
      project,
      tabulation
    );

    project.linkedAssessmentId = assessment.id;
    project.lastTabulatedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();

    this.saveProjectsToStorage();

    notificationService.notifyStateChange(
      project.id,
      `${project.title} (Retabulada)`,
      project.companyName,
      project.status
    );

    return { tabulation, assessment, project };
  }

  /**
   * Converte a lista de Projetos de Pesquisa no formato legível da UI (SurveySummary)
   * utilizando estritamente a quantidade dinâmica do quadro de colaboradores
   */
  public getSummaries(): SurveySummary[] {
    return this.projects.map((project) => {
      const collabSource = project.sources.find((s) => s.formType === 'COLABORADOR');
      const managerSource = project.sources.find((s) => s.formType === 'GESTOR');

      const collabResponses = collabSource?.responseCount || 0;
      const managerResponses = managerSource?.responseCount || 0;
      const totalResponses = collabResponses + managerResponses;

      // Cálculo Estritamente Dinâmico contra o quadro da empresa
      const targetCount = this.getDynamicEmployeeCount(project.companyId, project.targetEmployeeCount);
      const participationPercentage = Math.min(100, Math.round((collabResponses / targetCount) * 100));
      const missingResponses = Math.max(0, targetCount - collabResponses);

      // Mapeia WorkflowState para o SurveyStatus visual da UI
      let status: any = 'NONE';
      if (project.status === 'READY_FOR_TABULATION' || project.status === 'FINISHED' || project.status === 'ARCHIVED') {
        status = 'READY';
      } else if (project.status === 'WAITING_MANAGER') {
        status = 'WAITING_MANAGER';
      } else if (project.status === 'COLLECTING' || project.status === 'CONFIGURING') {
        status = 'IN_PROGRESS';
      }

      const company: Company = {
        id: project.companyId,
        name: project.companyName,
        clientId: 'c1',
        clientName: project.clientName,
        economicGroupName: project.economicGroupName,
        employeeCount: targetCount,
        collabForm: collabSource
          ? {
              id: collabSource.id,
              type: 'COLABORADOR',
              name: collabSource.name,
              formUrl: collabSource.externalFormUrl,
              sheetUrl: collabSource.externalSheetUrl,
              responseCount: collabSource.responseCount,
              lastResponseDate: collabSource.lastResponseDate,
            }
          : undefined,
        managerForm: managerSource
          ? {
              id: managerSource.id,
              type: 'GESTOR',
              name: managerSource.name,
              formUrl: managerSource.externalFormUrl,
              sheetUrl: managerSource.externalSheetUrl,
              responseCount: managerSource.responseCount,
              lastResponseDate: managerSource.lastResponseDate,
            }
          : undefined,
      };

      return {
        id: project.id,
        company,
        project,
        collabResponses,
        managerResponses,
        totalResponses,
        participationPercentage,
        missingResponses,
        status,
        workflowState: project.status,
        lastUpdated: project.workspaceBinding?.lastSyncedAt || collabSource?.lastResponseDate || null,
      };
    });
  }
}

export const researchProjectService = new ResearchProjectService();
