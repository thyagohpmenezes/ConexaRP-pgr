import React, { useState, useMemo } from 'react';
import { useResearchProjects } from '../../hooks/useResearchProjects';
import { Company, SurveySummary } from '../../domain/types';
import { SurveyHeader } from './SurveyHeader';
import { SurveyKpiCards } from './SurveyKpiCards';
import { SurveyFilterBar } from './SurveyFilterBar';
import { SurveyMetricsTable } from './SurveyMetricsTable';
import { SurveyDetailDrawer } from './SurveyDetailDrawer';
import { CreateProjectWizardModal } from './CreateProjectWizardModal';
import { TabulationModal } from './TabulationModal';
import { GoogleDriveBrowserModal } from './GoogleDriveBrowserModal';
import { WorkspaceMonitoringDashboard } from './WorkspaceMonitoringDashboard';
import { MOCK_COMPANIES } from '../../data/mockData';
import { AlertCircle, BarChart3, FolderGit2 } from 'lucide-react';

interface Props {
  companies?: Company[];
  onNavigateToAssessments?: () => void;
}

export const SurveyManagerView: React.FC<Props> = ({
  companies = MOCK_COMPANIES,
  onNavigateToAssessments,
}) => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'projects'>('monitoring');

  const {
    summaries,
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
  } = useResearchProjects();

  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [tabulationTargetSummary, setTabulationTargetSummary] = useState<SurveySummary | null>(null);
  const [driveModalTarget, setDriveModalTarget] = useState<SurveySummary | null>(null);

  // Manipulador para atualizar quadro dinâmico em tempo real
  const handleUpdateEmployeeCount = (companyId: string, count: number) => {
    const comp = MOCK_COMPANIES.find((c) => c.id === companyId);
    if (comp) {
      comp.employeeCount = count;
    }
    // Dispara recálculo das métricas para refletir engajamento em tempo real
    const summary = summaries.find((s) => s.company.id === companyId);
    if (summary?.project?.id) {
      syncMetrics(summary.project.id);
    } else {
      reload();
    }
  };

  // Listas únicas para dropdowns
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    summaries.forEach((s) => set.add(s.company.clientName));
    return Array.from(set).sort();
  }, [summaries]);

  const uniqueEconomicGroups = useMemo(() => {
    const set = new Set<string>();
    summaries.forEach((s) => {
      if (s.company.economicGroupName) set.add(s.company.economicGroupName);
    });
    return Array.from(set).sort();
  }, [summaries]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Seletor de Abas no Topo do Módulo Pesquisas */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'monitoring'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 size={16} /> Monitoramento Google Workspace
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'projects'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FolderGit2 size={16} /> Cadastro de Projetos
        </button>
      </div>

      {activeTab === 'monitoring' ? (
        <WorkspaceMonitoringDashboard companies={companies} />
      ) : (
        <>
          {/* 1. Header com Novo Projeto e Busca */}
          <SurveyHeader
            onRefresh={reload}
            onOpenCreateModal={() => setIsWizardOpen(true)}
            loading={loading}
            searchQuery={filters.searchQuery}
            setSearchQuery={(val) => setFilters((prev) => ({ ...prev, searchQuery: val }))}
            lastSync={new Date()}
          />


      {/* Alertas de Erro */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-xs font-semibold flex items-center gap-3 shadow-sm">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => reload()}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* 2. Cartões de Indicadores KPIs */}
      <SurveyKpiCards kpis={kpis} />

      {/* 3. Barra de Filtros */}
      <SurveyFilterBar
        filters={filters}
        setFilters={setFilters}
        uniqueClients={uniqueClients}
        uniqueEconomicGroups={uniqueEconomicGroups}
      />

      {/* 4. Tabela Principal de Projetos de Pesquisa */}
      <SurveyMetricsTable
        summaries={summaries}
        onUpdateEmployeeCount={handleUpdateEmployeeCount}
        onSelectSummary={(sum) => setSelectedProjectId(sum.id)}
        onOpenTabulation={(sum) => setTabulationTargetSummary(sum)}
        onOpenDriveBrowser={(sum) => setDriveModalTarget(sum)}
        onSyncMetrics={syncMetrics}
        onReTabulate={reExecuteTabulation}
        loading={loading}
      />

      {/* 5. Painel Lateral de Detalhes do Workflow */}
      <SurveyDetailDrawer
        summary={selectedSummary}
        onClose={() => setSelectedProjectId(null)}
        onTransitionState={(projId, state) => transitionState(projId, state)}
        onOpenTabulation={(sum) => setTabulationTargetSummary(sum)}
        onOpenDriveBrowser={(sum) => setDriveModalTarget(sum)}
        onSyncMetrics={syncMetrics}
        onReTabulate={reExecuteTabulation}
      />

      {/* 6. Wizard Modal para Criar Novo Projeto de Pesquisa */}
      <CreateProjectWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        companies={companies}
        onCreateProject={createProject}
      />

      {/* 7. Modal de Tabulação & Integração com Avaliações GRO/PGR */}
      <TabulationModal
        isOpen={!!tabulationTargetSummary}
        onClose={() => setTabulationTargetSummary(null)}
        summary={tabulationTargetSummary}
        onExecuteTabulation={(projId) => executeTabulation(projId)}
        onNavigateToAssessments={onNavigateToAssessments}
      />

      {/* 8. Modal de Navegação do Google Drive Workspace */}
      <GoogleDriveBrowserModal
        isOpen={!!driveModalTarget}
        onClose={() => setDriveModalTarget(null)}
        companyName={driveModalTarget?.company.name || ''}
        currentBinding={driveModalTarget?.project?.workspaceBinding}
        onConfirmBinding={async (binding) => {
          if (driveModalTarget?.project?.id) {
            await bindWorkspaceFolder(driveModalTarget.project.id, binding);
          }
        }}
      />
        </>
      )}
    </div>
  );
};

export default SurveyManagerView;

