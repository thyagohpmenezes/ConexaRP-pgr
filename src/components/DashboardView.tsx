import React from 'react';
import { 
  Building2, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  BrainCircuit,
  Users
} from 'lucide-react';
import { Assessment, RiskLevel, AssessmentStatus } from '../types';

interface DashboardViewProps {
  assessments: Assessment[];
  activeAssessment?: Assessment | null;
}

export default function DashboardView({ assessments, activeAssessment }: DashboardViewProps) {
  const stats = {
    total: assessments.length,
    active: assessments.filter(a => a.status !== 'CONCLUÍDA' && a.status !== 'ARQUIVADA').length,
    critical: assessments.filter(a => (a.riskScore || 0) >= 17).length,
    high: assessments.filter(a => (a.riskScore || 0) >= 10 && (a.riskScore || 0) < 17).length,
    totalActions: assessments.reduce((acc, a) => acc + (a.actions?.length || 0), 0),
    completedActions: assessments.reduce((acc, a) => acc + (a.actions || []).filter(act => act.status === 'CONCLUIDO').length, 0)
  };

  return (
    <div className="space-y-6">
      {/* Upper Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Avaliações</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-900 leading-none">{stats.total}</p>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">Ativas: {stats.active}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-b-4 border-b-rose-500">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Critérios de Alerta</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-rose-600 leading-none">{stats.critical}</p>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Riscos Críticos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-b-4 border-b-orange-500">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded">
              <BrainCircuit size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exposições Elevadas</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-orange-600 leading-none">{stats.high}</p>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase">Risco Alto</span>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-2 text-white">
            <div className="p-2 bg-slate-800 text-blue-400 rounded">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ações Corretivas</p>
          <div className="flex items-end gap-2 text-white">
            <p className="text-3xl font-black leading-none">{stats.completedActions}</p>
            <span className="text-[10px] font-bold text-slate-400 uppercase">de {stats.totalActions} ações</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${stats.totalActions > 0 ? (stats.completedActions / stats.totalActions * 100) : 0}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Assessments */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-blue-600" /> Avaliações Recentes
            </h3>
            <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Ver tudo</button>
          </div>
          <div className="divide-y divide-slate-50">
            {assessments.slice(0, 5).map(a => (
              <div key={a.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Setor {a.sectorId || 'Geral'}</p>
                  <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">Análise de Risco Psicossocial</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    a.status === AssessmentStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {a.status}
                  </span>
                  <p className="text-[10px] font-black mt-1 text-slate-600">Score: {(a.riskScore).toFixed(0)}</p>
                </div>
              </div>
            ))}
            {assessments.length === 0 && (
              <div className="p-12 text-center text-slate-400 italic text-xs">Nenhuma avaliação registrada.</div>
            )}
          </div>
        </div>

        {/* Priority Risks Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
             <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-500" /> Riscos Prioritários (GRO)
            </h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
             {assessments.filter(a => a.riskScore >= 10).slice(0, 3).map(a => (
               <div key={a.id} className={`p-3 bg-slate-800 rounded border-l-4 ${a.riskScore >= 17 ? 'border-rose-500' : 'border-orange-500'}`}>
                  <div className="flex justify-between items-start mb-1">
                     <p className={`text-[10px] font-black uppercase ${a.riskScore >= 17 ? 'text-rose-500' : 'text-orange-500'}`}>
                       {a.riskScore >= 17 ? 'Critical' : 'High'}
                     </p>
                     <span className="text-[9px] font-bold text-slate-500 uppercase">Setor {a.sectorId || 'Geral'}</span>
                  </div>
                  <p className="text-xs font-bold text-white uppercase tracking-tight">Avaliação de Risco Psicossocial</p>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase">Sincronizado com os dados da empresa</p>
               </div>
             ))}
             
             {assessments.filter(a => a.riskScore >= 10).length === 0 && (
               <div className="h-full flex items-center justify-center p-8 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                   Nenhum risco de nível <span className="text-orange-500">Alto</span> ou <span className="text-rose-500">Crítico</span> identificado no momento.
                 </p>
               </div>
             )}
          </div>
          <div className="p-3 bg-slate-800/50 mt-auto text-center">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sincronizado com o Inventário de Riscos do PGR</p>
          </div>
        </div>
      </div>
      {/* Sector Breakdown - NEW */}
      {activeAssessment && activeAssessment.sectorBreakdown && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-widest flex items-center gap-2">
              <Users size={16} className="text-blue-600" /> Detalhamento e Tabulação por Setor
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análise Comparativa Interna</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[9px] text-slate-500 uppercase tracking-widest font-black">
                <tr>
                  <th className="px-6 py-4">Setor / Departamento</th>
                  <th className="px-6 py-4 text-center">Amostra</th>
                  <th className="px-6 py-4 text-center">Índice de Convergência</th>
                  <th className="px-6 py-4 text-center">Grau</th>
                  <th className="px-6 py-4 text-center">Risco (Geral)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Row for Global/Geral first */}
                <tr className="bg-blue-50/30">
                  <td className="px-6 py-4 font-black text-blue-700 text-xs uppercase tracking-tight">Média Geral (Empresa)</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black">TOTAL</span>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-900">{activeAssessment.triangulationScore.toFixed(3)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                      {activeAssessment.grauConvergencia || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-900">{(activeAssessment.riskScore).toFixed(0)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[8px] font-black uppercase tracking-widest">
                      Referência
                    </span>
                  </td>
                </tr>
                {/* Rows for each sector */}
                {Object.entries(activeAssessment.sectorBreakdown).map(([name, data]) => {
                   const riskLabel = (data.riskScore || 0) >= 17 ? 'CRÍTICO' : (data.riskScore || 0) >= 10 ? 'ALTO' : (data.riskScore || 0) >= 6 ? 'MODERADO' : 'BAIXO';
                   const riskColor = (data.riskScore || 0) >= 17 ? 'text-rose-600' : (data.riskScore || 0) >= 10 ? 'text-orange-600' : (data.riskScore || 0) >= 6 ? 'text-amber-600' : 'text-emerald-600';

                   return (
                    <tr key={name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-tight">{name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {data.rowCount || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900">{(data.triangulationScore || 0).toFixed(3)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          {data.grauConvergencia || '-'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-center font-black ${riskColor}`}>
                        {(data.riskScore || 0).toFixed(0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          (data.riskScore || 0) >= 10 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {riskLabel}
                        </span>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
