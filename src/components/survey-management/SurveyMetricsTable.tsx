import React from 'react';
import { SurveySummary } from '../../domain/types';
import { SurveyStatusBadge } from './SurveyStatusBadge';
import { Users, FileSpreadsheet, Calendar, ChevronRight } from 'lucide-react';

interface Props {
  summaries: SurveySummary[];
  onUpdateEmployeeCount: (companyId: string, count: number) => void;
  onSelectCompany: (companyId: string) => void;
  loading: boolean;
}

export const SurveyMetricsTable: React.FC<Props> = ({
  summaries,
  onUpdateEmployeeCount,
  onSelectCompany,
  loading,
}) => {
  if (loading && summaries.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-600">
          Carregando dados através da camada de serviço...
        </p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <FileSpreadsheet size={24} />
        </div>
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
          Nenhuma Empresa Encontrada
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
          Ajuste os filtros ou a busca por palavra-chave para encontrar registros.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
              <th className="py-4 px-5">Cliente</th>
              <th className="py-4 px-5">Grupo Econômico</th>
              <th className="py-4 px-6">Empresa</th>
              <th className="py-4 px-4 text-center">
                <span className="flex items-center justify-center gap-1">
                  <Users size={12} /> Funcionários
                </span>
              </th>
              <th className="py-4 px-4 text-center">Colaboradores</th>
              <th className="py-4 px-4 text-center">Gestores</th>
              <th className="py-4 px-4 text-center">Total</th>
              <th className="py-4 px-5 text-center">Percentual (%)</th>
              <th className="py-4 px-4 text-center">Faltam Respostas</th>
              <th className="py-4 px-5 text-center">Status</th>
              <th className="py-4 px-5 text-right">Última Atualização</th>
              <th className="py-4 px-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {summaries.map((item) => {
              const pct = Math.min(100, Math.round(item.participationPercentage * 10) / 10);
              const company = item.company;

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectCompany(item.id)}
                  className="hover:bg-slate-50/90 transition-all cursor-pointer group"
                >
                  {/* Cliente */}
                  <td className="py-4 px-5 font-black text-slate-800 text-xs truncate max-w-[140px]">
                    {company.clientName}
                  </td>

                  {/* Grupo Econômico */}
                  <td className="py-4 px-5 font-bold text-slate-600">
                    {company.economicGroupName ? (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wide">
                        {company.economicGroupName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Independente</span>
                    )}
                  </td>

                  {/* Empresa */}
                  <td className="py-4 px-6 font-black text-slate-900 text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                    {company.name}
                    {(!company.collabForm || !company.managerForm) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {!company.collabForm && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Sem Form Colab
                          </span>
                        )}
                        {!company.managerForm && (
                          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            Sem Form Gestor
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Funcionários (Input Editável Inline) */}
                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        value={company.employeeCount || ''}
                        onChange={(e) =>
                          onUpdateEmployeeCount(item.id, parseInt(e.target.value, 10))
                        }
                        placeholder="0"
                        className="w-20 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-center text-xs font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </td>

                  {/* Colaboradores */}
                  <td className="py-4 px-4 text-center font-black text-slate-900">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                      {item.collabResponses}
                    </span>
                  </td>

                  {/* Gestores */}
                  <td className="py-4 px-4 text-center font-black text-slate-900">
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs">
                      {item.managerResponses}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="py-4 px-4 text-center font-black text-slate-900 text-sm">
                    {item.totalResponses}
                  </td>

                  {/* Percentual */}
                  <td className="py-4 px-5 text-center">
                    <div className="w-full max-w-[110px] mx-auto space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                        <span>{pct}%</span>
                        <span className="text-[9px] text-slate-400">
                          {item.totalResponses}/{company.employeeCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 70
                              ? 'bg-emerald-500'
                              : pct >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Faltam Respostas */}
                  <td className="py-4 px-4 text-center font-black text-slate-700">
                    {item.missingResponses > 0 ? (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs border border-slate-200">
                        {item.missingResponses}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
                        0 (Completo)
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-5 text-center">
                    <SurveyStatusBadge status={item.status} />
                  </td>

                  {/* Última Atualização */}
                  <td className="py-4 px-5 text-right font-medium text-slate-500 text-[11px]">
                    {item.lastUpdated ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {item.lastUpdated}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Sem registros</span>
                    )}
                  </td>

                  <td className="py-4 px-3 text-right">
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
