import React from 'react';
import { SurveySummary, WorkflowState } from '../../domain/types';
import { SurveyWorkflowBadge } from './SurveyWorkflowBadge';
import { WORKFLOW_STATES } from '../../domain/workflow';
import {
  X,
  Building2,
  Users,
  FileSpreadsheet,
  ExternalLink,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Table as TableIcon,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  Link2,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

interface Props {
  summary: SurveySummary | null;
  onClose: () => void;
  onTransitionState?: (projectId: string, targetState: WorkflowState) => void;
  onOpenTabulation?: (summary: SurveySummary) => void;
  onOpenDriveBrowser?: (summary: SurveySummary) => void;
  onSyncMetrics?: (projectId: string) => Promise<any>;
  onReTabulate?: (projectId: string) => Promise<any>;
}

export const SurveyDetailDrawer: React.FC<Props> = ({
  summary,
  onClose,
  onTransitionState,
  onOpenTabulation,
  onOpenDriveBrowser,
  onSyncMetrics,
  onReTabulate,
}) => {
  const [syncing, setSyncing] = React.useState<boolean>(false);
  const [retabulating, setRetabulating] = React.useState<boolean>(false);

  if (!summary) return null;

  const company = summary.company;
  const project = summary.project;
  const pct = Math.min(100, Math.round(summary.participationPercentage * 10) / 10);
  const currentWorkflowState = summary.workflowState || 'PLANNED';
  const binding = project?.workspaceBinding;

  const stepsList: WorkflowState[] = [
    'PLANNED',
    'CONFIGURING',
    'COLLECTING',
    'WAITING_MANAGER',
    'READY_FOR_TABULATION',
    'TABULATING',
    'ASSESSMENT_CREATED',
    'RISK_INVENTORY_UPDATED',
    'FINISHED',
  ];

  const currentStepNumber = WORKFLOW_STATES[currentWorkflowState]?.stepNumber || 1;
  const isTabulated =
    currentWorkflowState === 'FINISHED' ||
    currentWorkflowState === 'ASSESSMENT_CREATED' ||
    currentWorkflowState === 'RISK_INVENTORY_UPDATED' ||
    currentWorkflowState === 'ARCHIVED';

  const handleSync = async () => {
    if (!project || !onSyncMetrics) return;
    setSyncing(true);
    try {
      await onSyncMetrics(project.id);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetabulate = async () => {
    if (!project || !onReTabulate) return;
    if (!window.confirm('Deseja retabular e atualizar a avaliação com as novas respostas da planilha?')) return;
    setRetabulating(true);
    try {
      await onReTabulate(project.id);
      alert('Tabulação atualizada e inventário recalculado com sucesso!');
    } finally {
      setRetabulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end transition-all animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose}></div>

      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex justify-between items-start border-b border-slate-800 relative">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded text-[9px] font-black uppercase tracking-widest">
                  Centro Operacional
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Período: {project?.period || '2026.1'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {project?.title || company.name}
              </h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                {company.clientName} {company.economicGroupName ? `• ${company.economicGroupName}` : ''}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Vínculo Workspace Section */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Sincronização Google Drive
                  </h3>
                </div>
                {binding ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase rounded-lg">
                    Conectado
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-black text-[10px] uppercase rounded-lg">
                    Não Conectado
                  </span>
                )}
              </div>

              {binding ? (
                <div className="space-y-2 text-xs font-semibold text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Pasta Drive:</span>
                    <span className="font-black text-slate-900">{binding.folderName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400 font-bold">Último Sync:</span>
                    <span className="font-extrabold text-blue-600">{binding.lastSyncedAt || 'Recente'}</span>
                  </p>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Sincronizando...' : 'Sincronizar Respostas Now'}
                    </button>
                    <button
                      onClick={() => onOpenDriveBrowser && onOpenDriveBrowser(summary)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-lg transition-colors"
                    >
                      Trocar Pasta
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-3">
                  <p className="text-xs text-slate-500 font-medium">
                    Conecte a conta corporativa e selecione a pasta com os formulários de Colaboradores e Gestores desta empresa.
                  </p>
                  <button
                    onClick={() => onOpenDriveBrowser && onOpenDriveBrowser(summary)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <Link2 size={16} /> Navegar e Vincular Drive
                  </button>
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Estado do Workflow
                  </p>
                  <div className="mt-1.5">
                    <SurveyWorkflowBadge state={currentWorkflowState} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Tabulação GRO/PGR
                  </p>
                  <p className="text-xs font-black text-slate-800 mt-1">
                    {isTabulated ? '✓ Concluída (Bloqueio Ativo)' : 'Não Liberada / Em Aberto'}
                  </p>
                </div>
              </div>

              {/* Action Button Trigger */}
              {(currentWorkflowState === 'READY_FOR_TABULATION' || currentWorkflowState === 'WAITING_MANAGER') && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenTabulation) onOpenTabulation(summary);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <TableIcon size={16} /> Liberar Tabulação e Injetar <ArrowRight size={16} />
                </button>
              )}

              {/* Retabular opção pós-bloqueio */}
              {isTabulated && (
                <div className="border-t border-slate-200 pt-3 mt-3 space-y-2">
                  <p className="text-[11px] text-slate-600 font-medium">
                    O inventário principal do sistema já se encontra alimentado por esta tabulação e com trava contra sobrescrita acidental. Para incorporar novas respostas que surgiram nas planilhas, utilize a opção abaixo:
                  </p>
                  <button
                    type="button"
                    onClick={handleRetabulate}
                    disabled={retabulating}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RotateCcw size={15} className={retabulating ? 'animate-spin' : ''} />
                    {retabulating ? 'Re-tabulando Pesquisa...' : 'Tabular Novamente (Atualizar GRO)'}
                  </button>
                </div>
              )}
            </div>

            {/* Workflow Lifecycle Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" /> Ciclo do Negócio - Pesquisa Organizacional
              </h3>

              <div className="space-y-2">
                {stepsList.map((st, idx) => {
                  const meta = WORKFLOW_STATES[st];
                  const isCompleted = meta.stepNumber < currentStepNumber;
                  const isCurrent = meta.stepNumber === currentStepNumber;

                  return (
                    <div
                      key={st}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-300 font-black text-blue-900 shadow-xs'
                          : isCompleted
                          ? 'bg-slate-50 border-slate-200 text-slate-700 font-bold opacity-75'
                          : 'bg-white border-slate-100 text-slate-400 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 size={12} /> : meta.stepNumber}
                        </span>
                        <span>{meta.label}</span>
                      </div>

                      {isCurrent && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">
                          Estágio Atual
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-blue-600" /> Amostra Dinâmica & Respostas
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase text-blue-700 tracking-wider">
                    Colaboradores
                  </p>
                  <p className="text-xl font-black text-blue-900 mt-1">
                    {summary.collabResponses}
                  </p>
                </div>

                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase text-purple-700 tracking-wider">
                    Gestores
                  </p>
                  <p className="text-xl font-black text-purple-900 mt-1">
                    {summary.managerResponses}
                  </p>
                </div>

                <div className="bg-slate-900 text-white rounded-xl p-3">
                  <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider">
                    Total Coleta
                  </p>
                  <p className="text-xl font-black text-white mt-1">
                    {summary.totalResponses}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs font-black text-slate-800">
                  <span>Engajamento (Base Dinâmica: {company.employeeCount} func.)</span>
                  <span className="text-blue-600 font-extrabold">{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 70 && summary.managerResponses > 0
                        ? 'bg-emerald-500'
                        : pct >= 70
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
