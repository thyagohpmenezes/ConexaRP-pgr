import React from 'react';
import { useSurveyData } from '../../hooks/useSurveyData';
import { SurveyHeader } from './SurveyHeader';
import { SurveyKpiCards } from './SurveyKpiCards';
import { SurveyFilterBar } from './SurveyFilterBar';
import { SurveyMetricsTable } from './SurveyMetricsTable';
import { SurveyDetailDrawer } from './SurveyDetailDrawer';
import { AlertCircle } from 'lucide-react';

export const SurveyManagerView: React.FC = () => {
  const {
    summaries,
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
  } = useSurveyData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header com Busca e Sincronização */}
      <SurveyHeader
        onRefresh={refresh}
        loading={loading}
        searchQuery={filters.searchQuery}
        setSearchQuery={(val) => setFilters((prev) => ({ ...prev, searchQuery: val }))}
        lastSync={lastSync}
      />

      {/* Alertas de Erro */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-xs font-semibold flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => refresh()}
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

      {/* 4. Tabela Principal */}
      <SurveyMetricsTable
        summaries={summaries}
        onUpdateEmployeeCount={updateEmployeeCount}
        onSelectCompany={(id) => setSelectedCompanyId(id)}
        loading={loading}
      />

      {/* 5. Painel Lateral de Detalhes */}
      <SurveyDetailDrawer
        summary={selectedSummary}
        onClose={() => setSelectedCompanyId(null)}
        onUpdateEmployeeCount={updateEmployeeCount}
      />
    </div>
  );
};

export default SurveyManagerView;
