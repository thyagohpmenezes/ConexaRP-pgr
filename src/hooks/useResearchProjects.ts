import { useState, useMemo, useCallback } from 'react';
import {
  WorkflowState,
  SurveySummary,
  DashboardKpiSummary,
  SurveyFilterParams,
  Company,
  GoogleWorkspaceBinding,
} from '../domain/types';
import { researchProjectService } from '../services/ResearchProjectService';

export function useResearchProjects() {
  const [summaries, setSummaries] = useState<SurveySummary[]>(() =>
    researchProjectService.getSummaries()
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filtros de busca e navegação
  const [filters, setFilters] = useState<SurveyFilterParams>({
    client: 'ALL',
    economicGroup: 'ALL',
    company: 'ALL',
    status: 'ALL',
    workflowState: 'ALL',
    onlyReady: false,
    searchQuery: '',
  });

  const reload = useCallback(() => {
    setSummaries(researchProjectService.getSummaries());
  }, []);

  // Criar um Novo Projeto de Pesquisa
  const createProject = useCallback(
    async (params: {
      company: Company;
      title: string;
      goal: string;
      period: string;
      targetEmployeeCount: number;
    }) => {
      setLoading(true);
      try {
        const project = await researchProjectService.createProject(params);
        reload();
        return project;
      } catch (err: any) {
        setError(err.message || 'Erro ao criar projeto de pesquisa.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reload]
  );

  // Vincular Pasta do Google Workspace
  const bindWorkspaceFolder = useCallback(
    async (projectId: string, binding: GoogleWorkspaceBinding) => {
      setLoading(true);
      setError(null);
      try {
        const res = await researchProjectService.bindWorkspaceFolder(projectId, binding);
        reload();
        return res;
      } catch (err: any) {
        setError(err.message || 'Erro ao vincular pasta do Google Drive.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reload]
  );

  // Sincronizar Métricas em Tempo Real com o Workspace e Cadastro Dinâmico
  const syncMetrics = useCallback(
    async (projectId: string) => {
      setLoading(true);
      setError(null);
      try {
        const metrics = await researchProjectService.syncProjectMetrics(projectId);
        reload();
        return metrics;
      } catch (err: any) {
        setError(err.message || 'Erro ao sincronizar dados com o Google Sheets.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reload]
  );

  // Transicionar Estado do Workflow
  const transitionState = useCallback(
    (projectId: string, targetState: WorkflowState) => {
      const res = researchProjectService.transitionWorkflow(projectId, targetState);
      if (res.success) {
        reload();
      } else {
        setError(res.reason || 'Transição de estado inválida.');
      }
      return res;
    },
    [reload]
  );

  // Executar Tabulação Direta e Gerar Avaliação
  const executeTabulation = useCallback(
    async (projectId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await researchProjectService.executeTabulation(projectId);
        reload();
        return res;
      } catch (err: any) {
        setError(err.message || 'Erro ao executar tabulação.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reload]
  );

  // "Tabular Novamente" (Retabulacão após novas respostas no Google Sheets)
  const reExecuteTabulation = useCallback(
    async (projectId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await researchProjectService.reExecuteTabulation(projectId);
        reload();
        return res;
      } catch (err: any) {
        setError(err.message || 'Erro ao re-tabular pesquisa.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reload]
  );

  // Filtra os resumos com base nos filtros selecionados na UI
  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      if (filters.client !== 'ALL' && item.company.clientName !== filters.client) {
        return false;
      }
      if (filters.economicGroup !== 'ALL') {
        if (filters.economicGroup === 'DIRECT') {
          if (item.company.economicGroupName) return false;
        } else if (item.company.economicGroupName !== filters.economicGroup) {
          return false;
        }
      }
      if (filters.company !== 'ALL' && item.company.name !== filters.company) {
        return false;
      }
      if (filters.workflowState && filters.workflowState !== 'ALL') {
        if (item.workflowState !== filters.workflowState) return false;
      }
      if (filters.onlyReady && item.workflowState !== 'READY_FOR_TABULATION') {
        return false;
      }
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchName = item.company.name.toLowerCase().includes(query);
        const matchClient = item.company.clientName.toLowerCase().includes(query);
        const matchTitle = item.project?.title.toLowerCase().includes(query);
        if (!matchName && !matchClient && !matchTitle) return false;
      }
      return true;
    });
  }, [summaries, filters]);

  // KPIs do Dashboard
  const kpis: DashboardKpiSummary = useMemo(() => {
    let totalCompanies = summaries.length;
    let readyCompanies = 0;
    let waitingManagerCompanies = 0;
    let inProgressCompanies = 0;
    let noResponseCompanies = 0;
    let totalResponses = 0;

    summaries.forEach((s) => {
      totalResponses += s.totalResponses;
      if (s.workflowState === 'READY_FOR_TABULATION' || s.workflowState === 'FINISHED' || s.workflowState === 'ARCHIVED') {
        readyCompanies++;
      } else if (s.workflowState === 'WAITING_MANAGER') {
        waitingManagerCompanies++;
      } else if (s.workflowState === 'COLLECTING' || s.workflowState === 'CONFIGURING') {
        inProgressCompanies++;
      } else if (s.workflowState === 'PLANNED') {
        noResponseCompanies++;
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
  }, [summaries]);

  const selectedSummary = useMemo(() => {
    if (!selectedProjectId) return null;
    return (
      summaries.find((s) => s.id === selectedProjectId || s.project?.id === selectedProjectId) ||
      null
    );
  }, [summaries, selectedProjectId]);

  return {
    summaries: filteredSummaries,
    rawSummaries: summaries,
    kpis,
    loading,
    error,
    filters,
    setFilters,
    createProject,
    bindWorkspaceFolder,
    syncMetrics,
    transitionState,
    executeTabulation,
    reExecuteTabulation,
    selectedProjectId,
    setSelectedProjectId,
    selectedSummary,
    reload,
  };
}
