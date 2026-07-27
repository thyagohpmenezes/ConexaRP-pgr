import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SurveySummary,
  DashboardKpiSummary,
  SurveyFilterParams,
} from '../domain/types';
import { ISurveyService } from '../services/SurveyService';
import { mockSurveyService } from '../services/MockSurveyService';

const FILTERS_STORAGE_KEY = 'conexarp_survey_filters';
const surveyService: ISurveyService = mockSurveyService;

export function useSurveyData() {
  // Obter dados em cache de forma síncrona
  const initialCached = surveyService.getCachedSummariesSync ? surveyService.getCachedSummariesSync() : [];
  const initialSync = surveyService.getLastSyncTime ? surveyService.getLastSyncTime() : new Date();

  const [allSummaries, setAllSummaries] = useState<SurveySummary[]>(initialCached);
  const [loading, setLoading] = useState<boolean>(initialCached.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(initialSync);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Filtros persistidos no localStorage
  const [filters, setFiltersState] = useState<SurveyFilterParams>(() => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      client: 'ALL',
      economicGroup: 'ALL',
      company: 'ALL',
      status: 'ALL',
      onlyReady: false,
      searchQuery: '',
    };
  });

  const setFilters = useCallback((action: React.SetStateAction<SurveyFilterParams>) => {
    setFiltersState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Carregamento de dados sem exibir tela de spinner se já houver dados em memória
  const loadData = useCallback(async () => {
    if (allSummaries.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await surveyService.getSurveySummaries();
      setAllSummaries(data);
      const syncTime = surveyService.getLastSyncTime ? surveyService.getLastSyncTime() : new Date();
      setLastSync(syncTime);
    } catch (err: any) {
      console.error('Erro ao carregar pesquisas:', err);
      setError(err.message || 'Erro inesperado ao consultar os dados das pesquisas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Se já temos resumos em memória, não precisamos acionar o loadData no mount
    if (allSummaries.length === 0) {
      loadData();
    }
  }, []);

  // Atualização em tempo real do número de funcionários
  const updateEmployeeCount = useCallback(async (companyId: string, count: number) => {
    try {
      const updatedSummary = await surveyService.updateEmployeeCount(companyId, count);
      setAllSummaries((prev) =>
        prev.map((item) => (item.id === companyId ? updatedSummary : item))
      );
    } catch (err: any) {
      console.error('Erro ao atualizar número de funcionários:', err);
      setError(err.message || 'Falha ao atualizar funcionários.');
    }
  }, []);

  // Recarrega explicitamente APENAS quando o usuário clica em "Atualizar"
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await surveyService.refresh();
      const freshData = await surveyService.getSurveySummaries();
      setAllSummaries(freshData);
      const syncTime = surveyService.getLastSyncTime ? surveyService.getLastSyncTime() : new Date();
      setLastSync(syncTime);
    } catch (err: any) {
      console.error('Erro ao atualizar:', err);
      setError(err.message || 'Falha ao sincronizar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtra os resumos com base nos filtros da UI
  const filteredSummaries = useMemo(() => {
    return allSummaries.filter((item) => {
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
      if (filters.status !== 'ALL' && item.status !== filters.status) {
        return false;
      }
      if (filters.onlyReady && item.status !== 'READY') {
        return false;
      }
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchName = item.company.name.toLowerCase().includes(query);
        const matchClient = item.company.clientName.toLowerCase().includes(query);
        const matchGroup = item.company.economicGroupName?.toLowerCase().includes(query);
        if (!matchName && !matchClient && !matchGroup) return false;
      }
      return true;
    });
  }, [allSummaries, filters]);

  // KPIs do Dashboard
  const kpis: DashboardKpiSummary = useMemo(() => {
    let totalCompanies = allSummaries.length;
    let readyCompanies = 0;
    let waitingManagerCompanies = 0;
    let inProgressCompanies = 0;
    let noResponseCompanies = 0;
    let totalResponses = 0;

    allSummaries.forEach((s) => {
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
  }, [allSummaries]);

  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    allSummaries.forEach((s) => set.add(s.company.clientName));
    return Array.from(set).sort();
  }, [allSummaries]);

  const uniqueEconomicGroups = useMemo(() => {
    const set = new Set<string>();
    allSummaries.forEach((s) => {
      if (s.company.economicGroupName) set.add(s.company.economicGroupName);
    });
    return Array.from(set).sort();
  }, [allSummaries]);

  const selectedSummary = useMemo(() => {
    if (!selectedCompanyId) return null;
    return allSummaries.find((s) => s.id === selectedCompanyId) || null;
  }, [allSummaries, selectedCompanyId]);

  return {
    summaries: filteredSummaries,
    rawSummaries: allSummaries,
    kpis,
    loading,
    error,
    lastSync,
    filters,
    setFilters,
    uniqueClients,
    uniqueEconomicGroups,
    updateEmployeeCount,
    refresh,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedSummary,
  };
}
