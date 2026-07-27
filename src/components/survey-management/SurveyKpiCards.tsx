import React from 'react';
import { DashboardKpiSummary } from '../../domain/types';
import {
  Building2,
  CheckCircle2,
  Clock,
  Activity,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface Props {
  kpis: DashboardKpiSummary;
}

export const SurveyKpiCards: React.FC<Props> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Total de Empresas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total Empresas
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <Building2 size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {kpis.totalCompanies}
          </span>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Empresas mapeadas</p>
        </div>
      </div>

      {/* Empresas Liberadas */}
      <div className="bg-white rounded-2xl border border-emerald-200/80 bg-emerald-50/20 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
            Liberadas (🟢)
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-emerald-700 tracking-tight">
            {kpis.readyCompanies}
          </span>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">≥ 70% + 1 Gestor</p>
        </div>
      </div>

      {/* Aguardando Gestor */}
      <div className="bg-white rounded-2xl border border-yellow-300/80 bg-yellow-50/20 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">
            Aguardando Gestor (🟡)
          </span>
          <div className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition-colors">
            <Clock size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-yellow-800 tracking-tight">
            {kpis.waitingManagerCompanies}
          </span>
          <p className="text-[10px] text-yellow-700 font-semibold mt-0.5">≥ 70% e 0 Gestores</p>
        </div>
      </div>

      {/* Em Andamento */}
      <div className="bg-white rounded-2xl border border-amber-200/80 bg-amber-50/20 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
            Em Andamento (🟠)
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Activity size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-amber-700 tracking-tight">
            {kpis.inProgressCompanies}
          </span>
          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Percentual &lt; 70%</p>
        </div>
      </div>

      {/* Sem Respostas */}
      <div className="bg-white rounded-2xl border border-rose-200/80 bg-rose-50/20 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest">
            Sem Respostas (🔴)
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <AlertCircle size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-rose-700 tracking-tight">
            {kpis.noResponseCompanies}
          </span>
          <p className="text-[10px] text-rose-600 font-semibold mt-0.5">0 Colab e 0 Gestores</p>
        </div>
      </div>

      {/* Total de Respostas */}
      <div className="bg-white rounded-2xl border border-blue-200/80 bg-blue-50/20 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">
            Total Respostas
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <BarChart3 size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-blue-700 tracking-tight">
            {kpis.totalResponses}
          </span>
          <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Respostas acumuladas</p>
        </div>
      </div>
    </div>
  );
};
