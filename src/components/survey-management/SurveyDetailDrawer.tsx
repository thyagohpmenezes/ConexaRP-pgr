import React from 'react';
import { SurveySummary } from '../../domain/types';
import { SurveyStatusBadge } from './SurveyStatusBadge';
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
} from 'lucide-react';

interface Props {
  summary: SurveySummary | null;
  onClose: () => void;
  onUpdateEmployeeCount: (companyId: string, count: number) => void;
}

export const SurveyDetailDrawer: React.FC<Props> = ({
  summary,
  onClose,
  onUpdateEmployeeCount,
}) => {
  if (!summary) return null;

  const company = summary.company;
  const pct = Math.min(100, Math.round(summary.participationPercentage * 10) / 10);

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
                  Detalhes da Empresa
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  ID: {company.id}
                </span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {company.name}
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
            {/* Status Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Status da Pesquisa
                </p>
                <div className="mt-1.5">
                  <SurveyStatusBadge status={summary.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Última Atualização
                </p>
                <p className="text-xs font-bold text-slate-700 mt-1 flex items-center justify-end gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  {summary.lastUpdated || 'Sem registros'}
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Building2 size={12} /> Cliente
                </span>
                <p className="text-xs font-black text-slate-900 truncate">{company.clientName}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Layers size={12} /> Grupo Econômico
                </span>
                <p className="text-xs font-black text-slate-900 truncate">
                  {company.economicGroupName || 'Independente'}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-blue-600" /> Respostas & Engajamento
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
                    Total
                  </p>
                  <p className="text-xl font-black text-white mt-1">
                    {summary.totalResponses}
                  </p>
                </div>
              </div>

              {/* Editable Employee Count */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-slate-800">
                    Número de Funcionários
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Editável na sessão
                  </p>
                </div>
                <input
                  type="number"
                  min="0"
                  value={company.employeeCount || ''}
                  onChange={(e) =>
                    onUpdateEmployeeCount(company.id, parseInt(e.target.value, 10))
                  }
                  placeholder="0"
                  className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-inner"
                />
              </div>

              {/* Progress */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs font-black text-slate-800">
                  <span>Engajamento %</span>
                  <span className="text-blue-600 font-extrabold">{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
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
                <p className="text-[10px] text-slate-500 font-semibold text-right">
                  {summary.missingResponses > 0
                    ? `Faltam ${summary.missingResponses} respostas para 100%`
                    : 'Meta de 100% de preenchimento atingida!'}
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-purple-600" /> Formulários & Planilhas
              </h3>

              <div className="space-y-2 pt-1">
                {company.collabForm ? (
                  <a
                    href={company.collabForm.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 p-3 rounded-xl flex items-center justify-between text-xs font-black text-slate-800 hover:text-blue-700 transition-all shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      Abrir formulário de colaboradores
                    </span>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </a>
                ) : (
                  <div className="w-full bg-amber-50/50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertCircle size={16} className="text-amber-600" />
                    Formulário de colaboradores não existente
                  </div>
                )}

                {company.managerForm ? (
                  <a
                    href={company.managerForm.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 p-3 rounded-xl flex items-center justify-between text-xs font-black text-slate-800 hover:text-purple-700 transition-all shadow-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={16} className="text-purple-600" />
                      Abrir formulário de gestores
                    </span>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </a>
                ) : (
                  <div className="w-full bg-purple-50/50 border border-purple-200 p-3 rounded-xl flex items-center gap-2 text-xs font-bold text-purple-800">
                    <AlertCircle size={16} className="text-purple-600" />
                    Formulário de gestores não existente
                  </div>
                )}
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
