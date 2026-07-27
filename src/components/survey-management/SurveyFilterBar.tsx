import React from 'react';
import { SurveyFilterParams, SurveyStatus } from '../../domain/types';
import { Search, Filter, CheckCircle2, RotateCcw } from 'lucide-react';

interface Props {
  filters: SurveyFilterParams;
  setFilters: React.Dispatch<React.SetStateAction<SurveyFilterParams>>;
  uniqueClients: string[];
  uniqueEconomicGroups: string[];
}

export const SurveyFilterBar: React.FC<Props> = ({
  filters,
  setFilters,
  uniqueClients,
  uniqueEconomicGroups,
}) => {
  const handleResetFilters = () => {
    setFilters({
      client: 'ALL',
      economicGroup: 'ALL',
      company: 'ALL',
      status: 'ALL',
      onlyReady: false,
      searchQuery: '',
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900">
          <Filter size={16} className="text-blue-600" />
          <h3 className="text-xs font-black uppercase tracking-wider">Filtros & Navegação</h3>
        </div>

        <button
          onClick={handleResetFilters}
          className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={12} /> Limpar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Pesquisar empresa */}
        <div className="lg:col-span-2 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Pesquisar empresa por nome..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Cliente */}
        <div>
          <select
            value={filters.client}
            onChange={(e) => setFilters((prev) => ({ ...prev, client: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="ALL">Todos os Clientes</option>
            {uniqueClients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </div>

        {/* Grupo Econômico */}
        <div>
          <select
            value={filters.economicGroup}
            onChange={(e) => setFilters((prev) => ({ ...prev, economicGroup: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="ALL">Todos os Grupos</option>
            <option value="DIRECT">Empresas Independentes</option>
            {uniqueEconomicGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as SurveyStatus | 'ALL',
              }))
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="ALL">Todos os Status</option>
            <option value="READY">🟢 Liberado para Tabulação</option>
            <option value="WAITING_MANAGER">🟡 Aguardando Gestor</option>
            <option value="IN_PROGRESS">🟠 Em Andamento</option>
            <option value="NONE">🔴 Não Iniciado</option>
          </select>
        </div>
      </div>

      {/* Switch Toggle: Mostrar apenas empresas liberadas */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <label className="inline-flex items-center gap-3 cursor-pointer group select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={filters.onlyReady}
              onChange={(e) => setFilters((prev) => ({ ...prev, onlyReady: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </div>
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" /> Mostrar apenas empresas liberadas para tabulação
          </span>
        </label>
      </div>
    </div>
  );
};
