import React from 'react';
import { SurveySummary } from '../../domain/types';
import { SurveyWorkflowBadge } from './SurveyWorkflowBadge';
import {
  Users,
  FileSpreadsheet,
  Calendar,
  ChevronRight,
  Table as TableIcon,
  Sparkles,
  Link2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { MOCK_COMPANIES } from '../../data/mockData';

interface Props {
  summaries: SurveySummary[];
  onUpdateEmployeeCount: (companyId: string, count: number) => void;
  onSelectSummary: (summary: SurveySummary) => void;
  onOpenTabulation: (summary: SurveySummary) => void;
  onOpenDriveBrowser: (summary: SurveySummary) => void;
  onSyncMetrics: (projectId: string) => Promise<any>;
  onReTabulate: (projectId: string) => Promise<any>;
  loading: boolean;
}

export const SurveyMetricsTable: React.FC<Props> = ({
  summaries,
  onUpdateEmployeeCount,
  onSelectSummary,
  onOpenTabulation,
  onOpenDriveBrowser,
  onSyncMetrics,
  onReTabulate,
  loading,
}) => {
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [retabulatingId, setRetabulatingId] = React.useState<string | null>(null);

  const handleSync = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setSyncingId(projectId);
    try {
      await onSyncMetrics(projectId);
    } finally {
      setSyncingId(null);
    }
  };

  const handleRetabulate = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (
      !window.confirm(
        'Esta pesquisa já se encontra tabulada e com o GRO/PGR bloqueado. Deseja realmente Tabular Novamente e atualizar o inventário com as novas respostas do Google Workspace?'
      )
    ) {
      return;
    }
    setRetabulatingId(projectId);
    try {
      await onReTabulate(projectId);
      alert('Tabulação recalculada e Avaliação GRO/PGR atualizada com sucesso!');
    } finally {
      setRetabulatingId(null);
    }
  };

  if (loading && summaries.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-600">
          Carregando Centro Operacional de Pesquisas e Sincronização Workspace...
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
          Nenhum Projeto de Pesquisa Encontrado
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
          Ajuste os filtros ou crie um novo Projeto de Pesquisa para conectar ao seu Google Workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
              <th className="py-4 px-4">Cliente / Grupo</th>
              <th className="py-4 px-5">Empresa & Projeto</th>
              <th className="py-4 px-4 text-center">
                <span className="flex items-center justify-center gap-1">
                  <Shield size={12} className="text-blue-400" /> Sincronização Workspace
                </span>
              </th>
              <th className="py-4 px-3 text-center" title="Quadro Estritamente Dinâmico (Em Tempo Real)">
                <span className="flex items-center justify-center gap-1">
                  <Users size={12} className="text-emerald-400" /> Amostra
                </span>
              </th>
              <th className="py-4 px-3 text-center">Colaboradores</th>
              <th className="py-4 px-3 text-center">Gestores (≥1)</th>
              <th className="py-4 px-5 text-center">Engajamento Dinâmico</th>
              <th className="py-4 px-4 text-center">Estado do Workflow</th>
              <th className="py-4 px-5 text-center">Tabulação GRO/PGR</th>
              <th className="py-4 px-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {summaries.map((item) => {
              const pct = Math.min(100, Math.round(item.participationPercentage * 10) / 10);
              const company = item.company;
              const project = item.project;
              const hasBinding = !!project?.workspaceBinding;
              const isReadyForTabulation =
                item.workflowState === 'READY_FOR_TABULATION' || item.workflowState === 'WAITING_MANAGER';
              const isTabulated =
                item.workflowState === 'FINISHED' ||
                item.workflowState === 'ASSESSMENT_CREATED' ||
                item.workflowState === 'RISK_INVENTORY_UPDATED' ||
                item.workflowState === 'ARCHIVED';

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectSummary(item)}
                  className="hover:bg-blue-50/40 transition-all cursor-pointer group"
                >
                  {/* Cliente / Grupo Econômico */}
                  <td className="py-4 px-4">
                    <div className="font-black text-slate-900 text-xs truncate max-w-[130px]">
                      {company.clientName}
                    </div>
                    <div className="mt-0.5">
                      {company.economicGroupName ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-extrabold uppercase tracking-wide inline-block">
                          {company.economicGroupName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Independente</span>
                      )}
                    </div>
                  </td>

                  {/* Empresa & Projeto */}
                  <td className="py-4 px-5">
                    <div className="font-black text-slate-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      {company.name}
                    </div>
                    {project && (
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5 truncate max-w-[210px] flex items-center gap-1">
                        <span>{project.title} ({project.period})</span>
                      </div>
                    )}
                  </td>

                  {/* Sincronização Workspace */}
                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    {hasBinding ? (
                      <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-2xl shadow-2xs">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        <div className="text-left leading-none">
                          <p className="text-[10px] font-black uppercase tracking-wider">Drive Vinculado</p>
                          <p className="text-[9px] font-semibold text-emerald-600 mt-0.5 truncate max-w-[110px]">
                            {project?.workspaceBinding?.folderName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => project && handleSync(e, project.id)}
                          disabled={syncingId === item.id}
                          title="Sincronizar Respostas (Tempo Real)"
                          className="p-1 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors ml-1"
                        >
                          <RefreshCw size={14} className={syncingId === item.id ? 'animate-spin text-blue-600' : ''} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDriveBrowser(item);
                        }}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 mx-auto shadow-2xs"
                      >
                        <Link2 size={14} className="text-blue-600" /> Vincular Google Drive
                      </button>
                    )}
                  </td>

                  {/* Amostra Target (Input Estritamente Dinâmico) */}
                  <td className="py-4 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center justify-center">
                      <input
                        type="number"
                        min="1"
                        value={company.employeeCount || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateEmployeeCount(company.id, val);
                          }
                        }}
                        title="Quadro de colaboradores dinâmico. Altere para recalcular o engajamento imediatamente."
                        className="w-16 bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-2 py-1.5 text-center text-xs font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-inner"
                      />
                    </div>
                  </td>

                  {/* Colaboradores */}
                  <td className="py-4 px-3 text-center font-black">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black border border-blue-100">
                      {item.collabResponses}
                    </span>
                  </td>

                  {/* Gestores (Verificação ≥1) */}
                  <td className="py-4 px-3 text-center">
                    {item.managerResponses > 0 ? (
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-800 rounded-lg text-xs font-black border border-purple-200 flex items-center justify-center gap-1 mx-auto max-w-[80px]">
                        <CheckCircle2 size={13} className="text-purple-600" /> {item.managerResponses}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[10px] font-black border border-amber-200 flex items-center justify-center gap-1 mx-auto max-w-[85px]">
                        <AlertTriangle size={12} className="text-amber-600" /> 0 (Falta)
                      </span>
                    )}
                  </td>

                  {/* Percentual Progresso */}
                  <td className="py-4 px-5 text-center">
                    <div className="w-full max-w-[120px] mx-auto space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-800">
                        <span>{pct}%</span>
                        <span className="text-[9px] text-slate-500">
                          Meta: ≥70%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 70 && item.managerResponses > 0
                              ? 'bg-emerald-500'
                              : pct >= 70
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        ></div>
                      </div>
                      {pct >= 70 && item.managerResponses === 0 && (
                        <p className="text-[9px] font-bold text-amber-700 leading-tight">
                          Aguardando Gestor
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Estado do Workflow Badge */}
                  <td className="py-4 px-4 text-center">
                    <SurveyWorkflowBadge state={item.workflowState || 'PLANNED'} />
                  </td>

                  {/* Tabulação GRO/PGR */}
                  <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                    {isReadyForTabulation ? (
                      <button
                        type="button"
                        onClick={() => onOpenTabulation(item)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <TableIcon size={14} /> Liberar Tabulação
                      </button>
                    ) : isTabulated ? (
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-800">
                          <CheckCircle2 size={11} /> Tabulada (Bloqueada)
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={(e) => project && handleRetabulate(e, project.id)}
                            disabled={retabulatingId === item.project?.id}
                            className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider underline flex items-center justify-center gap-1 mx-auto mt-0.5 transition-colors"
                          >
                            <RotateCcw size={10} className={retabulatingId === item.project?.id ? 'animate-spin' : ''} />
                            {retabulatingId === item.project?.id ? 'Atualizando...' : 'Tabular Novamente'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl block text-center italic">
                        Coleta em Andamento
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-3 text-right">
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
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
