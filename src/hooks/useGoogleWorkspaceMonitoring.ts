// src/hooks/useGoogleWorkspaceMonitoring.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Company, MasterSheetRow, MasterCompanyMonitoring, MasterSyncResult } from '../domain/types';
import { googleWorkspaceBackendService } from '../services/GoogleWorkspaceBackendService';

// Status da Coleta da Empresa (Gerenciado Manualmente)
export type CompanySurveyStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

// Situação Geral Triangulada da Pesquisa Psicossocial ConexaRP
export type OverallSurveyStatus = 
  | 'AWAITING_EMPLOYEES'       // Aguardando respostas dos colaboradores (< 70%)
  | 'AWAITING_MANAGER'         // Aguardando resposta do gestor (>= 70%, 0 gestor)
  | 'AWAITING_COMPANY_SURVEY'  // Aguardando preenchimento da Pesquisa da Empresa (>= 70%, >= 1 gestor, Empresa != COMPLETED)
  | 'READY_FOR_TABULATION';    // Pronta para tabulação (>= 70%, >= 1 gestor, Empresa == COMPLETED)

export interface MonitoringSurveyItem {
  id: string;
  economicGroup: string;
  companyId: string;
  companyName: string;
  linkedCompanyName?: string;
  surveyName: string;
  employeeResponses: number;
  managerResponses: number;
  totalEmployees: number;
  participationPercentage: number;
  companySurveyStatus: CompanySurveyStatus;
  overallStatus: OverallSurveyStatus;
  lastSyncedAt: Date;
  lastResponseDateStr?: string;
  employeeFormUrl?: string;
  managerFormUrl?: string;
  folderPath: string[];
  isLinked: boolean;
  folderId: string;
  collabRows?: MasterSheetRow[];
  managerRows?: MasterSheetRow[];
}

export interface MonitoringFilters {
  companyId: string;
  economicGroup: string;
  status: string;
  searchQuery: string;
}

export interface MonitoringKpis {
  totalCompanies: number;
  activeSurveys: number;
  readyForTabulation: number;
  awaitingCompanySurvey: number;
  awaitingManager: number;
  awaitingEmployees: number;
  overallAverageParticipation: number;
}

function getPersistedCompanyStatus(surveyId: string, defaultStatus: CompanySurveyStatus): CompanySurveyStatus {
  try {
    const saved = localStorage.getItem(`conexarp_company_survey_status_${surveyId}`);
    if (saved && (saved === 'NOT_STARTED' || saved === 'IN_PROGRESS' || saved === 'COMPLETED')) {
      return saved as CompanySurveyStatus;
    }
  } catch {}
  return defaultStatus;
}

function getPersistedCompanyLink(surveyId: string): string | null {
  try {
    return localStorage.getItem(`conexarp_company_manual_link_${surveyId}`);
  } catch {}
  return null;
}

export function useGoogleWorkspaceMonitoring(companies: Company[] = []) {
  const [rootFolderId, setRootFolderId] = useState<string>(() => googleWorkspaceBackendService.getMasterSheetId());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [surveyItems, setSurveyItems] = useState<MonitoringSurveyItem[]>([]);
  const [rawSyncResult, setRawSyncResult] = useState<MasterSyncResult | null>(null);

  const [filters, setFilters] = useState<MonitoringFilters>({
    companyId: 'ALL',
    economicGroup: 'ALL',
    status: 'ALL',
    searchQuery: '',
  });

  // Regra Inegociável da Metodologia RP para cálculo da Situação Geral Triangulada
  const calculateOverallStatus = (
    participation: number, 
    managerCount: number, 
    companyStatus: CompanySurveyStatus
  ): OverallSurveyStatus => {
    if (participation < 70) {
      return 'AWAITING_EMPLOYEES';
    }
    if (managerCount === 0) {
      return 'AWAITING_MANAGER';
    }
    if (companyStatus !== 'COMPLETED') {
      return 'AWAITING_COMPANY_SURVEY';
    }
    return 'READY_FOR_TABULATION';
  };

  /**
   * Converte o payload da Planilha Mestra Única em itens do Dashboard de Acompanhamento
   */
  const parseMasterSheetToSurveyItems = useCallback((syncResult: MasterSyncResult, companyList: Company[]): MonitoringSurveyItem[] => {
    const items: MonitoringSurveyItem[] = [];
    const summaryMap = syncResult.companiesSummary || {};
    let summaryEntries: MasterCompanyMonitoring[] = Object.values(summaryMap);

    // Fallback: se companiesSummary veio vazio mas rows possui linhas
    if (summaryEntries.length === 0 && (syncResult.rows || (syncResult as any).rows)) {
      const rawRows: any[] = syncResult.rows || (syncResult as any).rows || [];
      rawRows.forEach((r: any) => {
        if (!r.empresa) return;
        const empName = String(r.empresa).trim();
        const colab = typeof r.colab === 'number' ? r.colab : (r.employeeResponses || 0);
        const gestor = typeof r.gestor === 'number' ? r.gestor : (r.managerResponses || 0);
        const totalColaboradores = r.totalColaboradores || r.totalEmployees || 0;
        const percentual = r.percentual !== undefined ? r.percentual : 0;
        const lastResponseDate = r.ultimaResposta || r.lastResponseDate || '';

        summaryEntries.push({
          empresaName: empName,
          economicGroup: 'Corporativo',
          employeeResponses: colab,
          managerResponses: gestor,
          totalResponses: colab + gestor,
          totalEmployees: totalColaboradores,
          percentual,
          lastResponseDate,
          collabRows: [],
          managerRows: []
        });
      });
    }

    let recognizedCount = 0;
    let linkedCount = 0;

    summaryEntries.forEach(compSummary => {
      const compName = compSummary.empresaName;
      const compNameUpper = compName.toUpperCase().trim();
      const itemId = `master_${compNameUpper.replace(/\s+/g, '_')}`;

      const manualLinkedCompanyId = getPersistedCompanyLink(itemId);

      // Busca correspondência com empresas cadastradas no ConexaRP (manual ou automática)
      let matchedCompany = manualLinkedCompanyId 
        ? companyList.find(c => c.id === manualLinkedCompanyId)
        : companyList.find(c =>
            c.name.toUpperCase().trim() === compNameUpper ||
            c.name.toUpperCase().trim().includes(compNameUpper) ||
            compNameUpper.includes(c.name.toUpperCase().trim())
          );

      const isLinked = Boolean(matchedCompany);
      if (isLinked) {
        linkedCount++;
        recognizedCount++;
      }

      const empResponses = compSummary.employeeResponses;
      const mngResponses = compSummary.managerResponses;

      const totalEmployees = (compSummary.totalEmployees && compSummary.totalEmployees > 0)
        ? compSummary.totalEmployees
        : (matchedCompany?.employeeCount && matchedCompany.employeeCount > 0 ? matchedCompany.employeeCount : 100);

      const participationPercentage = (compSummary.percentual !== undefined && compSummary.percentual > 0)
        ? compSummary.percentual
        : (totalEmployees > 0 ? Number(((empResponses / totalEmployees) * 100).toFixed(1)) : 0);

      const companySurveyStatus = getPersistedCompanyStatus(itemId, 'NOT_STARTED');
      const overallStatus = calculateOverallStatus(participationPercentage, mngResponses, companySurveyStatus);

      items.push({
        id: itemId,
        folderId: itemId,
        economicGroup: matchedCompany?.economicGroupName || compSummary.economicGroup || (isLinked ? 'Corporativo' : 'Empresas Não Vinculadas'),
        companyId: matchedCompany?.id || itemId,
        companyName: compName, // Preserva exatamente a nomenclatura original da Coluna A da Planilha
        linkedCompanyName: matchedCompany?.name,
        surveyName: `Pesquisa Mestra - ${compName}`,
        employeeResponses: empResponses,
        managerResponses: mngResponses,
        totalEmployees,
        participationPercentage,
        companySurveyStatus,
        overallStatus,
        lastSyncedAt: new Date(syncResult.scannedAt || Date.now()),
        lastResponseDateStr: compSummary.lastResponseDate,
        folderPath: ['Planilha Mestra', compName],
        isLinked,
        collabRows: compSummary.collabRows,
        managerRows: compSummary.managerRows
      });
    });

    console.log(`📊 [Planilha Mestra Sync] Total de empresas encontradas na Planilha Mestra: ${summaryEntries.length}`);
    return items;
  }, []);

  // Sincronização remota via Supabase Edge Function com suporte SWR
  const fetchSyncData = useCallback(async (customSheetId?: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    const targetSheet = customSheetId || rootFolderId;

    try {
      const result = await googleWorkspaceBackendService.syncMasterSheet(targetSheet, forceRefresh);
      setRawSyncResult(result);
      const mappedItems = parseMasterSheetToSurveyItems(result, companies);
      setSurveyItems(mappedItems);
      setLastSyncTime(new Date(result.scannedAt || Date.now()));
    } catch (err: any) {
      console.warn('Erro na sincronização da Planilha Mestra:', err.message);
      setError(err.message || 'Falha ao sincronizar com a Planilha Mestra.');
      // Tentativa de recuperação automática usando ID Oficial
      try {
        const fallbackResult = await googleWorkspaceBackendService.syncMasterSheet('1oeP_TJk4es0gbeBAPnebYkGecVAjzFG5EkC1dSUSde0', true);
        setRawSyncResult(fallbackResult);
        const fallbackItems = parseMasterSheetToSurveyItems(fallbackResult, companies);
        setSurveyItems(fallbackItems);
        setLastSyncTime(new Date(fallbackResult.scannedAt || Date.now()));
        setError(null);
      } catch (fallbackErr: any) {
        setSurveyItems([]);
        setLastSyncTime(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [rootFolderId, companies, parseMasterSheetToSurveyItems]);

  useEffect(() => {
    fetchSyncData();
  }, [fetchSyncData]);

  const refreshSync = () => {
    fetchSyncData(rootFolderId, true);
  };

  const updateCompanySurveyStatus = (surveyId: string, status: CompanySurveyStatus) => {
    try {
      localStorage.setItem(`conexarp_company_survey_status_${surveyId}`, status);
    } catch {}

    setSurveyItems(prev => prev.map(item => {
      if (item.id === surveyId) {
        const newOverall = calculateOverallStatus(item.participationPercentage, item.managerResponses, status);
        return {
          ...item,
          companySurveyStatus: status,
          overallStatus: newOverall
        };
      }
      return item;
    }));
  };

  const linkCompanyManual = useCallback((surveyItemId: string, companyId: string) => {
    try {
      localStorage.setItem(`conexarp_company_manual_link_${surveyItemId}`, companyId);
    } catch {}

    const targetCompany = companies.find(c => c.id === companyId);

    setSurveyItems(prev => prev.map(item => {
      if (item.id === surveyItemId) {
        return {
          ...item,
          companyId,
          linkedCompanyName: targetCompany?.name,
          economicGroup: targetCompany?.economicGroupName || item.economicGroup,
          isLinked: true
        };
      }
      return item;
    }));
  }, [companies]);

  const updateTotalEmployees = useCallback(async (surveyItemId: string, companyName: string, newTotal: number) => {
    if (newTotal < 0) return;

    // Atualização otimista local (0ms lag na UI)
    setSurveyItems(prev => prev.map(item => {
      if (item.id === surveyItemId || item.companyName.toUpperCase().trim() === companyName.toUpperCase().trim()) {
        const participationPercentage = newTotal > 0 ? Number(((item.employeeResponses / newTotal) * 100).toFixed(1)) : 0;
        const newOverall = calculateOverallStatus(participationPercentage, item.managerResponses, item.companySurveyStatus);
        return {
          ...item,
          totalEmployees: newTotal,
          participationPercentage,
          overallStatus: newOverall
        };
      }
      return item;
    }));

    // Envia atualização para a Coluna D no Google Sheets
    try {
      await googleWorkspaceBackendService.updateTotalEmployees(companyName, newTotal);
    } catch (err) {
      console.error('Falha ao atualizar Coluna D no Google Sheets:', err);
    }
  }, []);

  const handleSaveRootFolderId = (sheetId: string) => {
    googleWorkspaceBackendService.setMasterSheetId(sheetId);
    setRootFolderId(sheetId);
    fetchSyncData(sheetId, true);
  };

  // Filtragem dos dados
  const filteredItems = useMemo(() => {
    return surveyItems.filter(item => {
      if (filters.companyId !== 'ALL' && item.companyId !== filters.companyId && item.companyName !== filters.companyId) {
        return false;
      }
      if (filters.economicGroup !== 'ALL' && item.economicGroup !== filters.economicGroup) {
        return false;
      }
      if (filters.status !== 'ALL' && item.overallStatus !== filters.status) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = item.surveyName.toLowerCase().includes(query);
        const matchCompany = item.companyName.toLowerCase().includes(query);
        const matchLinked = (item.linkedCompanyName || '').toLowerCase().includes(query);
        const matchGroup = item.economicGroup.toLowerCase().includes(query);
        if (!matchName && !matchCompany && !matchLinked && !matchGroup) {
          return false;
        }
      }
      return true;
    });
  }, [surveyItems, filters]);

  // Indicadores KPIs da Metodologia Completa ConexaRP
  const kpis = useMemo<MonitoringKpis>(() => {
    const totalCompanies = new Set(surveyItems.map(i => i.companyId)).size;
    const activeSurveys = surveyItems.length;
    const readyForTabulation = surveyItems.filter(i => i.overallStatus === 'READY_FOR_TABULATION').length;
    const awaitingCompanySurvey = surveyItems.filter(i => i.overallStatus === 'AWAITING_COMPANY_SURVEY').length;
    const awaitingManager = surveyItems.filter(i => i.overallStatus === 'AWAITING_MANAGER').length;
    const awaitingEmployees = surveyItems.filter(i => i.overallStatus === 'AWAITING_EMPLOYEES').length;

    const sumPercentage = surveyItems.reduce((acc, i) => acc + i.participationPercentage, 0);
    const overallAverageParticipation = activeSurveys > 0 ? Number((sumPercentage / activeSurveys).toFixed(1)) : 0;

    return {
      totalCompanies,
      activeSurveys,
      readyForTabulation,
      awaitingCompanySurvey,
      awaitingManager,
      awaitingEmployees,
      overallAverageParticipation
    };
  }, [surveyItems]);

  const uniqueCompanies = useMemo(() => {
    const map = new Map<string, string>();
    surveyItems.forEach(i => map.set(i.companyId, i.linkedCompanyName || i.companyName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [surveyItems]);

  const uniqueEconomicGroups = useMemo(() => {
    const set = new Set<string>();
    surveyItems.forEach(i => { if (i.economicGroup) set.add(i.economicGroup); });
    return Array.from(set).sort();
  }, [surveyItems]);

  return {
    loading,
    error,
    lastSyncTime,
    rootFolderId,
    surveyItems: filteredItems,
    allSurveyItems: surveyItems,
    kpis,
    filters,
    setFilters,
    uniqueCompanies,
    uniqueEconomicGroups,
    refreshSync,
    handleSaveRootFolderId,
    updateCompanySurveyStatus,
    updateTotalEmployees,
    linkCompanyManual
  };
}
