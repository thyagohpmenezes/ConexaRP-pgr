// src/components/survey-management/WorkspaceMonitoringDashboard.tsx
import React, { useState } from 'react';
import { Company } from '../../domain/types';
import { 
  useGoogleWorkspaceMonitoring, 
  OverallSurveyStatus, 
  CompanySurveyStatus, 
  MonitoringSurveyItem,
  getPersistedTabulatedState
} from '../../hooks/useGoogleWorkspaceMonitoring';
import { googleSurveyImportService, ConexaTabulationOutput } from '../../services/GoogleSurveyImportService';
import { 
  RefreshCw, 
  Building2, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Sparkles, 
  ExternalLink, 
  FolderGit2, 
  Layers, 
  BarChart3,
  Settings,
  X,
  UserCheck,
  FileCheck2,
  FileCheck,
  Check,
  HelpCircle,
  PlayCircle,
  FileSpreadsheet,
  Pencil,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Link2,
  FileText,
  MessageCircle,
  Mail
} from 'lucide-react';

interface Props {
  companies?: Company[];
  assessments?: any[];
  onCreateCompany?: (newCompany: Omit<Company, 'id'>) => void;
  onNavigateToAssessments?: (companyId?: string) => void;
  onNavigateToInventory?: (companyId?: string) => void;
}

export const WorkspaceMonitoringDashboard: React.FC<Props> = ({ 
  companies = [],
  assessments = [],
  onCreateCompany,
  onNavigateToAssessments,
  onNavigateToInventory
}) => {
  const {
    loading,
    error,
    lastSyncTime,
    rootFolderId,
    surveyItems,
    kpis,
    filters,
    setFilters,
    uniqueCompanies,
    uniqueEconomicGroups,
    refreshSync,
    handleSaveRootFolderId,
    updateCompanySurveyStatus,
    markCompanyAsTabulated,
    updateTotalEmployees,
    linkCompanyManual
  } = useGoogleWorkspaceMonitoring(companies);

  const [activeDashboardTab, setActiveDashboardTab] = useState<'companies' | 'last_responses'>('companies');

  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [inputFolderId, setInputFolderId] = useState<string>(rootFolderId);
  const [validationTargetItem, setValidationTargetItem] = useState<MonitoringSurveyItem | null>(null);
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<MonitoringSurveyItem | null>(null);
  const [selectedLinkCompanyId, setSelectedLinkCompanyId] = useState<string>('');
  const [activeTabulatingItem, setActiveTabulatingItem] = useState<MonitoringSurveyItem | null>(null);
  const [tabulationOutput, setTabulationOutput] = useState<ConexaTabulationOutput | null>(null);
  const [savedTemplateSuccess, setSavedTemplateSuccess] = useState<boolean>(false);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTotalValue, setEditingTotalValue] = useState<string>('');

  const hasSavedReport = (item: MonitoringSurveyItem | string | undefined | null): boolean => {
    if (!item || !assessments || assessments.length === 0) return false;
    const companyId = typeof item === 'string' ? item : item.companyId;
    const itemId = typeof item === 'object' ? item.id : item;

    return assessments.some(a => 
      (companyId && (a.companyId === companyId || a.companyId === itemId)) || 
      (itemId && (a.companyId === itemId || a.companyId === companyId))
    );
  };

  const handleOpenDrawer = (item: MonitoringSurveyItem) => {
    setSelectedDrawerItem(item);
    
    // Inicializa o dropdown de vinculação individualmente para esta empresa
    let initialLinkId = '';
    if (item.companyId && companies.some(c => c.id === item.companyId)) {
      initialLinkId = item.companyId;
    } else {
      const compNameUpper = item.companyName.toUpperCase().trim();
      const match = companies.find(c =>
        c.name.toUpperCase().trim() === compNameUpper ||
        c.name.toUpperCase().trim().includes(compNameUpper) ||
        compNameUpper.includes(c.name.toUpperCase().trim())
      );
      if (match) {
        initialLinkId = match.id;
      }
    }

    setSelectedLinkCompanyId(initialLinkId);
  };

  const handleConfirmLink = () => {
    if (selectedLinkCompanyId && selectedDrawerItem) {
      linkCompanyManual(selectedDrawerItem.id, selectedLinkCompanyId);
      const matched = companies.find(c => c.id === selectedLinkCompanyId);
      
      setSelectedDrawerItem({
        ...selectedDrawerItem,
        companyId: selectedLinkCompanyId,
        linkedCompanyName: matched?.name,
        economicGroup: matched?.economicGroupName || selectedDrawerItem.economicGroup,
        isLinked: true
      });
    }
  };

  const handleSaveTotal = (item: MonitoringSurveyItem) => {
    const val = parseInt(editingTotalValue, 10);
    if (!isNaN(val) && val >= 0) {
      updateTotalEmployees(item.id, item.companyName, val);
    }
    setEditingItemId(null);
  };

  const handleQuickCreateCompany = async (item: MonitoringSurveyItem) => {
    if (onCreateCompany) {
      try {
        const created: any = await onCreateCompany({
          name: item.companyName,
          economicGroupName: item.economicGroup !== 'Corporativo' && item.economicGroup !== 'Empresas Não Vinculadas' ? item.economicGroup : undefined,
          employeeCount: item.totalEmployees || 10
        });

        if (created && created.id) {
          linkCompanyManual(item.id, created.id);
          item.isLinked = true;
          item.companyId = created.id;
          item.linkedCompanyName = created.name;
          setSelectedDrawerItem({ 
            ...item, 
            isLinked: true, 
            companyId: created.id, 
            linkedCompanyName: created.name 
          });
        }
      } catch (err) {
        console.error('[ConexaRP] Falha ao vincular/criar empresa:', err);
      }
    }
  };

  const handleExecuteTabulation = (item: MonitoringSurveyItem) => {
    setValidationTargetItem(null);
    setSelectedDrawerItem(null);

    const targetId = item.companyId || item.id;
    const hasReport = hasSavedReport(item);

    if (hasReport) {
      // Se a empresa possui relatórios salvos no sistema -> direciona para a aba de Inventário / Relatórios Salvos
      if (onNavigateToInventory) {
        onNavigateToInventory(targetId);
      } else if (onNavigateToAssessments) {
        onNavigateToAssessments(targetId);
      }
    } else {
      // Se não houver relatórios salvos -> direciona para a aba de Avaliação para tabular & salvar
      updateCompanySurveyStatus(item.id, 'COMPLETED');
      markCompanyAsTabulated(item.id);
      if (item.companyId) {
        markCompanyAsTabulated(item.companyId);
      }

      if (onNavigateToAssessments) {
        onNavigateToAssessments(targetId);
      } else {
        setActiveTabulatingItem(item);
        const output = googleSurveyImportService.tabulateMonitoringSurvey(item);
        setTabulationOutput(output);
      }
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const generateReminderMessage = (item: MonitoringSurveyItem): string => {
    const companyName = item.companyName || 'Sua Empresa';
    const respColab = item.employeeResponses || 0;
    const respGestor = item.managerResponses || 0;
    const progresso = `${item.participationPercentage || 0}%`;
    const linkColab = item.employeeFormUrl || '[INSERIR_LINK_SISTEMA_COLAB]';
    const linkGestor = item.managerFormUrl || '[INSERIR_LINK_SISTEMA_GESTOR]';

    return `Olá, tudo bem?
Passando para compartilhar como está o andamento das Pesquisas de Avaliação de Riscos Psicossociais na sua empresa.
Sabemos que a rotina é corrida, mas a participação de todos é fundamental para mapearmos o cenário atual e traçarmos estratégias eficientes para a saúde mental e o clima organizacional da ${companyName}.

Aqui está o nosso balanço mais recente:
📊 Status de Engajamento Atual

Empresa: ${companyName}
Respostas de Colaboradores: ${respColab} respostas
Respostas de Gestores: ${respGestor} respostas
Taxa de Adesão Geral: ${progresso}

Obs: O mínimo para iniciarmos a tabulação é 70%.

🚀 Como podemos aumentar essa participação?
Para nos ajudar a alcançar uma amostra ainda mais segura e representativa, sugerimos enviar um reforço rápido nos canais internos da empresa (WhatsApp, Teams/Slack ou e-mail corporativo).

Caso precise reenviar os acessos, aqui estão os links diretos para cada público:
🔗 Link para Colaboradores: ${linkColab}
🔗 Link para Gestores: ${linkGestor}
    
⚠️ Lembrete: A pesquisa é totalmente confidencial. As respostas individuais não serão compartilhadas, garantindo a segurança e o anonimato de todos os participantes.
 
Agradecemos desde já pela parceria de sempre na promoção do bem-estar.
Atenciosamente,`;
  };

  const handleOpenWhatsApp = (item: MonitoringSurveyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const message = generateReminderMessage(item);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenEmail = (item: MonitoringSurveyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const message = generateReminderMessage(item);
    const subject = `Andamento das Pesquisas Psicossociais - ${item.companyName}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  const renderOverallStatusBadge = (status: OverallSurveyStatus, isSavedReport = false) => {
    if (isSavedReport) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
          <CheckCircle2 size={13} className="text-emerald-600" />
          🟢 Tabulado
        </span>
      );
    }

    switch (status) {
      case 'READY_FOR_TABULATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
            <CheckCircle2 size={13} className="text-emerald-600" />
            🟢 Pronta p/ Tabulação
          </span>
        );
      case 'AWAITING_COMPANY_SURVEY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 border border-blue-300 text-blue-900 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Clock size={13} className="text-blue-600" />
            🔵 Aguard. Pesquisa Empresa
          </span>
        );
      case 'AWAITING_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Clock size={13} className="text-amber-600" />
            🟡 Aguard. Gestor
          </span>
        );
      case 'AWAITING_EMPLOYEES':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-300 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Users size={13} className="text-slate-500" />
            ⚪ Aguard. Colaboradores (&lt; 70%)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo de Monitoramento */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              Metodologia Psicossocial ConexaRP
            </span>
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
              <Clock size={13} /> Sincronizado: {formatLastSync(lastSyncTime)}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Acompanhamento da Coleta Psicossocial
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-2xl">
            Monitoramento triangulado das 3 fontes metodológicas: Colaboradores (Google), Gestores (Google) e Pesquisa da Empresa (ConexaRP).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <Settings size={16} /> Configurar Planilha Mestra
          </button>
          
          <button
            onClick={refreshSync}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
        </div>
      </div>

      {/* Cartões de Indicadores KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Em Andamento</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl"><Building2 size={16} /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{kpis.activeSurveys}</p>
        </div>

        <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-black uppercase tracking-widest">Prontas p/ Tabulação</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl"><CheckCircle2 size={16} /></div>
          </div>
          <p className="text-3xl font-black text-emerald-950 tracking-tight">{kpis.readyForTabulation}</p>
        </div>

        <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[10px] font-black uppercase tracking-widest">Aguard. Empresa</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl"><Clock size={16} /></div>
          </div>
          <p className="text-3xl font-black text-blue-950 tracking-tight">{kpis.awaitingCompanySurvey}</p>
        </div>

        <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-black uppercase tracking-widest">Aguard. Gestor</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl"><UserCheck size={16} /></div>
          </div>
          <p className="text-3xl font-black text-amber-950 tracking-tight">{kpis.awaitingManager}</p>
        </div>

        <div className="bg-orange-50/50 p-5 rounded-3xl border border-orange-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-orange-800">
            <span className="text-[10px] font-black uppercase tracking-widest">Aguard. Colaboradores</span>
            <div className="p-2 bg-orange-100 text-orange-700 rounded-xl"><Users size={16} /></div>
          </div>
          <p className="text-3xl font-black text-orange-950 tracking-tight">{kpis.awaitingEmployees}</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-3xl text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Média Engajamento</span>
            <div className="p-2 bg-slate-800 text-blue-400 rounded-xl"><BarChart3 size={16} /></div>
          </div>
          <p className="text-3xl font-black tracking-tight text-white">{kpis.overallAverageParticipation}%</p>
        </div>
      </div>

      {/* Navegação por Abas Internas do Monitoramento */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveDashboardTab('companies')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeDashboardTab === 'companies'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 size={16} /> Acompanhamento por Empresa ({surveyItems.length})
        </button>

        <button
          onClick={() => setActiveDashboardTab('last_responses')}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeDashboardTab === 'last_responses'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock size={16} /> Última Resposta por Empresa
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      </div>

      {activeDashboardTab === 'companies' && (
        <>
          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Empresa, Grupo Econômico ou Pesquisa..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filters.companyId}
            onChange={(e) => setFilters(prev => ({ ...prev, companyId: e.target.value }))}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Todas as Empresas</option>
            {uniqueCompanies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filters.economicGroup}
            onChange={(e) => setFilters(prev => ({ ...prev, economicGroup: e.target.value }))}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Todos os Grupos</option>
            {uniqueEconomicGroups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Todas as Situações</option>
            <option value="READY_FOR_TABULATION">🟢 Pronta p/ Tabulação</option>
            <option value="AWAITING_COMPANY_SURVEY">🔵 Aguard. Pesquisa Empresa</option>
            <option value="AWAITING_MANAGER">🟡 Aguard. Gestor</option>
            <option value="AWAITING_EMPLOYEES">⚪ Aguard. Colaboradores</option>
          </select>
        </div>
      </div>

      {/* Tabela de Acompanhamento Único da Planilha Mestra */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md shadow-slate-200/40 overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6 w-[28%] min-w-[220px]">EMPRESA (COLUNA A)</th>
                <th className="py-4 px-3 w-[8%] text-center min-w-[80px]">COLAB</th>
                <th className="py-4 px-3 w-[10%] text-center min-w-[100px]">GESTOR</th>
                <th className="py-4 px-3 w-[10%] text-center min-w-[100px]">QUADRO</th>
                <th className="py-4 px-5 w-[14%] min-w-[140px]">PROGRESSO %</th>
                <th className="py-4 px-5 w-[20%] min-w-[180px]">SITUAÇÃO GERAL</th>
                <th className="py-4 px-6 w-[10%] text-right min-w-[140px]">AÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {surveyItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-medium">
                    Nenhuma pesquisa encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                surveyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Coluna A: Empresa (Exibe exatamente a nomenclatura da Coluna A da Planilha) */}
                    <td className="py-5 px-6 cursor-pointer" onClick={() => handleOpenDrawer(item)}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            {item.economicGroup || 'Empresa Independente'}
                          </span>
                          {!item.isLinked && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9px] font-black uppercase">
                              ⚠️ Não vinculada
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-900 hover:text-blue-600 uppercase text-sm flex items-center gap-1.5 transition-colors">
                          {item.companyName}
                        </h4>
                        {item.isLinked && item.linkedCompanyName && item.linkedCompanyName.toUpperCase().trim() !== item.companyName.toUpperCase().trim() && (
                          <span className="text-[10px] font-bold text-emerald-700 block">
                            🔗 Vinculada a: {item.linkedCompanyName}
                          </span>
                        )}
                        {item.lastResponseDateStr && (
                          <span className="text-[9px] text-slate-400 font-medium block">
                            Última: {item.lastResponseDateStr}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Coluna B: Colab */}
                    <td className="py-5 px-3 text-center">
                      <span className="font-black text-slate-800 text-sm">
                        {item.employeeResponses} <span className="text-[10px] font-bold text-slate-400">resp.</span>
                      </span>
                    </td>

                    {/* Coluna C: Gestor */}
                    <td className="py-5 px-3 text-center">
                      {item.managerResponses > 0 ? (
                        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black uppercase">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          {item.managerResponses} {item.managerResponses === 1 ? 'resp.' : 'resp.'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-900 border border-yellow-300 rounded-lg text-[10px] font-black uppercase">
                          <Clock size={12} className="text-yellow-600" />
                          0 (Pendente)
                        </span>
                      )}
                    </td>

                    {/* Coluna D: Quadro (Total Colaboradores - Editável no Google Sheets) */}
                    <td className="py-5 px-3 text-center">
                      {editingItemId === item.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={editingTotalValue}
                            onChange={(e) => setEditingTotalValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTotal(item);
                              if (e.key === 'Escape') setEditingItemId(null);
                            }}
                            className="w-20 px-2 py-1 bg-white border-2 border-emerald-500 rounded-lg text-xs font-black text-slate-900 focus:outline-none shadow-sm text-center"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveTotal(item)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-sm active:scale-95"
                            title="Salvar na Planilha Google"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditingTotalValue(String(item.totalEmployees));
                          }}
                          className="group/edit inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all"
                          title="Clique para editar a Coluna D e salvar no Google Sheets"
                        >
                          <span className="font-bold text-slate-800 text-xs">
                            {item.totalEmployees} <span className="text-[9px] text-slate-400 font-medium">colab.</span>
                          </span>
                          <Pencil size={11} className="text-slate-400 group-hover/edit:text-emerald-600 transition-colors" />
                        </button>
                      )}
                    </td>

                    {/* Coluna E: Progresso % (Com badge verde para 100%) */}
                    <td className="py-5 px-5">
                      <div className="space-y-1 max-w-[140px]">
                        {item.participationPercentage >= 100 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-xs font-black shadow-sm">
                            <CheckCircle2 size={13} className="text-emerald-600" /> 100% Concluído
                          </span>
                        ) : item.participationPercentage >= 70 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-black">
                            {item.participationPercentage}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-black">
                            {item.participationPercentage}%
                          </span>
                        )}

                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.participationPercentage >= 100 ? 'bg-emerald-600' : item.participationPercentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, item.participationPercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Situação Geral da Pesquisa Psicossocial */}
                    <td className="py-5 px-5">
                      {renderOverallStatusBadge(item.overallStatus, hasSavedReport(item))}
                    </td>

                    {/* Ação */}
                    <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        {/* Botão de Contato WhatsApp */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenWhatsApp(item, e)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200/70 shadow-2xs hover:shadow-xs transition-all active:scale-95 flex items-center justify-center group/wa"
                          title="Enviar lembrete de cobrança via WhatsApp"
                        >
                          <MessageCircle size={15} className="group-hover/wa:scale-110 transition-transform" />
                        </button>

                        {/* Botão de Contato E-mail */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenEmail(item, e)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-xl border border-blue-200/70 shadow-2xs hover:shadow-xs transition-all active:scale-95 flex items-center justify-center group/mail"
                          title="Enviar lembrete de cobrança via E-mail"
                        >
                          <Mail size={15} className="group-hover/mail:scale-110 transition-transform" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(item)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                          title="Ver detalhes da empresa"
                        >
                          <ExternalLink size={14} />
                        </button>

                        {hasSavedReport(item) ? (
                          <button
                            type="button"
                            onClick={() => handleExecuteTabulation(item)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                            title="Empresa possui relatórios salvos. Clique para visualizar no Inventário"
                          >
                            <BarChart3 size={14} /> Visualizar Relatório
                          </button>
                        ) : item.overallStatus === 'READY_FOR_TABULATION' || item.companySurveyStatus === 'COMPLETED' ? (
                          <button
                            type="button"
                            onClick={() => handleExecuteTabulation(item)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                            title="Validar pesquisas e direcionar para Avaliações (GRO/PGR)"
                          >
                            <FileCheck2 size={14} /> Validar & Tabular
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase italic px-1">
                            Aguardando
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

  {activeDashboardTab === 'last_responses' && (
    <div className="space-y-6">
      {/* Tabela Dedicada: Última Resposta por Empresa */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Última Resposta Recebida por Empresa
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Acompanhamento cronológico do último carimbo de resposta recepcionado da Planilha Mestra para cada empresa.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sincronizado com Google Workspace
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Empresa</th>
                <th className="py-4 px-6">Data & Hora da Última Resposta (Carimbo)</th>
                <th className="py-4 px-6">Total Respostas</th>
                <th className="py-4 px-6">Formulários Recebidos</th>
                <th className="py-4 px-6">Engajamento %</th>
                <th className="py-4 px-6 text-right">Status de Coleta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {surveyItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              ) : (
                [...surveyItems]
                  .sort((a, b) => {
                    const dateA = a.lastResponseDateStr ? new Date(a.lastResponseDateStr).getTime() : 0;
                    const dateB = b.lastResponseDateStr ? new Date(b.lastResponseDateStr).getTime() : 0;
                    return dateB - dateA;
                  })
                  .map((item) => {
                    const isTabulated = hasSavedReport(item);
                    const hasResponses = (item.employeeResponses + item.managerResponses) > 0;
                    return (
                      <tr key={`last_resp_${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                        {/* Empresa */}
                        <td className="py-5 px-6 font-bold text-slate-900">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              {item.economicGroup}
                            </span>
                            <p className="text-sm font-black text-slate-900 uppercase">
                              {item.companyName}
                            </p>
                          </div>
                        </td>

                        {/* Data/Hora da Última Resposta */}
                        <td className="py-5 px-6">
                          {item.lastResponseDateStr ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-full text-xs font-mono font-black">
                              <Clock size={14} className="text-blue-600" />
                              {item.lastResponseDateStr}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs font-semibold">
                              Aguardando primeira resposta
                            </span>
                          )}
                        </td>

                        {/* Total Respostas */}
                        <td className="py-5 px-6">
                          <span className="font-black text-slate-900 text-sm">
                            {item.employeeResponses + item.managerResponses}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">resp.</span>
                        </td>

                        {/* Detalhamento dos Formulários */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase">
                              👥 Colaboradores: {item.employeeResponses}
                            </span>
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[10px] font-black uppercase">
                              👔 Gestor: {item.managerResponses}
                            </span>
                          </div>
                        </td>

                        {/* Engajamento */}
                        <td className="py-5 px-6">
                          <span className="font-black text-slate-800 text-xs">
                            {item.participationPercentage}%
                          </span>
                        </td>

                        {/* Status de Atividade */}
                        <td className="py-5 px-6 text-right whitespace-nowrap">
                          {isTabulated ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              🟢 Tabulado
                            </span>
                          ) : hasResponses ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              🟢 Recebendo Respostas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              🟡 Sem Respostas Ainda
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* PAINEL LATERAL (DRAWER) DE DETALHES DA EMPRESA */}
      {selectedDrawerItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header do Drawer */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">
                  {selectedDrawerItem.economicGroup}
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Building2 size={20} className="text-blue-400" />
                  {selectedDrawerItem.companyName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDrawerItem(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo Principal do Drawer */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Card de Vinculação / Mapeamento com Empresa no ConexaRP */}
              <div className={`p-5 rounded-2xl border space-y-3 ${selectedDrawerItem.isLinked ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/80 border-amber-200'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest block text-slate-500">
                      Status de Vinculação no ConexaRP
                    </span>
                    <p className={`text-xs font-black uppercase flex items-center gap-1.5 ${selectedDrawerItem.isLinked ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {selectedDrawerItem.isLinked ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Empresa Vinculada ({selectedDrawerItem.linkedCompanyName || selectedDrawerItem.companyName})
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} className="text-amber-600" />
                          Empresa Não Vinculada no Sistema
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Seção de Ações de Vinculação */}
                <div className="pt-3 border-t border-slate-200/60 space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 block">
                      🔗 Vincular a uma Empresa Já Cadastrada / Tabulada no ConexaRP:
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedLinkCompanyId}
                        onChange={(e) => setSelectedLinkCompanyId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione uma empresa existente...</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>
                            🏢 {c.name} {c.economicGroupName ? `(${c.economicGroupName})` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!selectedLinkCompanyId}
                        onClick={handleConfirmLink}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                      >
                        <Link2 size={13} /> Vincular
                      </button>
                    </div>
                  </div>

                  {!selectedDrawerItem.isLinked && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/40">
                      <span className="text-[9px] font-bold text-slate-500">
                        Ou se for uma empresa nova que ainda não foi cadastrada:
                      </span>
                      <button
                        onClick={() => handleQuickCreateCompany(selectedDrawerItem)}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0"
                      >
                        <PlusCircle size={13} /> Cadastrar Nova Empresa
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Métricas Trianguladas */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-600" />
                  Triangulação Metodológica ConexaRP
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">1. Colaboradores</span>
                    <p className="text-lg font-black text-slate-900">{selectedDrawerItem.employeeResponses} respostas</p>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Quadro: {selectedDrawerItem.totalEmployees} colab. ({selectedDrawerItem.participationPercentage}%)
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">2. Gestores</span>
                    <p className="text-lg font-black text-slate-900">{selectedDrawerItem.managerResponses} respostas</p>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      {selectedDrawerItem.managerResponses > 0 ? '🟢 Gestor Preenchido' : '🟡 Gestor Pendente'}
                    </span>
                  </div>
                </div>

                {selectedDrawerItem.lastResponseDateStr && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    📅 Última resposta na Planilha: <strong className="text-slate-700">{selectedDrawerItem.lastResponseDateStr}</strong>
                  </p>
                )}
              </div>

              {/* Status da Pesquisa Empresa (Manual) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  3. Status da Pesquisa da Empresa (Preenchimento ConexaRP)
                </span>
                <select
                  value={selectedDrawerItem.companySurveyStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as CompanySurveyStatus;
                    updateCompanySurveyStatus(selectedDrawerItem.id, newStatus);
                    setSelectedDrawerItem({ ...selectedDrawerItem, companySurveyStatus: newStatus });
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NOT_STARTED">⚪ Não iniciada</option>
                  <option value="IN_PROGRESS">🔵 Em andamento</option>
                  <option value="COMPLETED">🟢 Concluída</option>
                </select>
              </div>

              {/* Situação Geral */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Situação Geral Triangulada</span>
                <div>{renderOverallStatusBadge(selectedDrawerItem.overallStatus, hasSavedReport(selectedDrawerItem))}</div>
                <p className="text-xs text-slate-300 font-medium">
                  {hasSavedReport(selectedDrawerItem) 
                    ? 'A empresa possui pesquisa psicossocial tabulada com relatórios gerados no Inventário GRO/PGR.'
                    : selectedDrawerItem.overallStatus === 'READY_FOR_TABULATION' || selectedDrawerItem.companySurveyStatus === 'COMPLETED'
                    ? 'A empresa atingiu os pré-requisitos e está totalmente apta para a validação e tabulação psicossocial dos riscos.'
                    : 'Aguardando o preenchimento de todas as 3 fontes metodológicas para liberar a tabulação psicossocial dos riscos.'}
                </p>
              </div>
            </div>

            {/* Rodapé de Ações do Drawer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              {hasSavedReport(selectedDrawerItem) ? (
                <button
                  onClick={() => handleExecuteTabulation(selectedDrawerItem)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <BarChart3 size={16} /> Visualizar Relatório (Inventário GRO/PGR)
                  <ArrowRight size={16} />
                </button>
              ) : selectedDrawerItem.overallStatus === 'READY_FOR_TABULATION' || selectedDrawerItem.companySurveyStatus === 'COMPLETED' ? (
                <button
                  onClick={() => handleExecuteTabulation(selectedDrawerItem)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FileCheck2 size={16} /> Validar & Direcionar para Avaliação (GRO/PGR)
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-slate-200 text-slate-400 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Aguardando Fases da Metodologia RP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceMonitoringDashboard;
