import React, { useState } from 'react';
import { SurveySummary } from '../../domain/types';
import { X, Table as TableIcon, Sparkles, CheckCircle2, ArrowRight, BarChart2, Shield } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  summary: SurveySummary | null;
  onExecuteTabulation: (projectId: string) => Promise<any>;
  onNavigateToAssessments?: () => void;
}

export const TabulationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  summary,
  onExecuteTabulation,
  onNavigateToAssessments,
}) => {
  const [tabulating, setTabulating] = useState<boolean>(false);
  const [completedResult, setCompletedResult] = useState<any | null>(null);

  if (!isOpen || !summary) return null;

  const project = summary.project;
  const company = summary.company;

  const handleRunTabulation = async () => {
    if (!project) return;
    setTabulating(true);
    try {
      const res = await onExecuteTabulation(project.id);
      setCompletedResult(res);
    } catch (err) {
      console.error('Erro ao tabular:', err);
    } finally {
      setTabulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50">
              <TableIcon size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Tabulação Automatizada & Avaliação GRO/PGR
              </h3>
              <p className="text-slate-400 text-xs font-semibold">
                {company.name} ({project?.title || 'Pesquisa Organizacional'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {!completedResult ? (
            <>
              {/* Summary Stats */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Respostas Colaboradores</p>
                  <p className="text-lg font-black text-blue-600 mt-1">{summary.collabResponses}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Respostas Liderança</p>
                  <p className="text-lg font-black text-purple-600 mt-1">{summary.managerResponses}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400">Engajamento %</p>
                  <p className="text-lg font-black text-emerald-600 mt-1">
                    {Math.round(summary.participationPercentage)}%
                  </p>
                </div>
              </div>

              {/* Likert Domain Preview */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <BarChart2 size={16} className="text-blue-600" /> Pré-Cálculo de Domínios Psicossociais (Eixo 1)
                </h4>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-black text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Domínio Psicossocial</th>
                        <th className="p-3 text-center">Média Colaboradores</th>
                        <th className="p-3 text-center">Média Gestores</th>
                        <th className="p-3 text-center">Freq. Crítica %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      <tr>
                        <td className="p-3 font-bold">1. Exigências Emocionais & Carga</td>
                        <td className="p-3 text-center font-black text-blue-600">3.4</td>
                        <td className="p-3 text-center font-black text-purple-600">3.9</td>
                        <td className="p-3 text-center text-amber-600 font-black">18.5%</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">2. Autonomia & Controle sobre Trabalho</td>
                        <td className="p-3 text-center font-black text-blue-600">3.8</td>
                        <td className="p-3 text-center font-black text-purple-600">4.1</td>
                        <td className="p-3 text-center text-emerald-600 font-black">12.0%</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">3. Suporte Social & Qualidade Liderança</td>
                        <td className="p-3 text-center font-black text-blue-600">3.2</td>
                        <td className="p-3 text-center font-black text-purple-600">4.5</td>
                        <td className="p-3 text-center text-amber-600 font-black">22.0%</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">4. Relacionamento Interpessoal & Justiça</td>
                        <td className="p-3 text-center font-black text-blue-600">4.0</td>
                        <td className="p-3 text-center font-black text-purple-600">4.2</td>
                        <td className="p-3 text-center text-emerald-600 font-black">8.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-xs space-y-1">
                <p className="font-black flex items-center gap-1">
                  <Sparkles size={16} className="text-emerald-600" /> Automação da Avaliação GRO/PGR
                </p>
                <p className="font-medium text-emerald-700">
                  Ao clicar em Tabular, o sistema executará a sintaxe das respostas e injetará a avaliação na aba <span className="font-black uppercase">Avaliações</span> sem necessidade de digitação manual.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Tabulação Concluída com Sucesso!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-semibold mt-1">
                  A avaliação foi criada e injetada no fluxo de risco GRO/PGR. O workflow avançou para o estado <span className="font-black text-emerald-600">FINISHED</span>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>ID da Avaliação Gerada:</span>
                  <span className="font-mono text-slate-900">{completedResult.assessment.id}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Empresa Destino:</span>
                  <span>{company.name}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>Matriz de Risco:</span>
                  <span className="text-emerald-600 font-black">Preenchida Automaticamente</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all"
          >
            Fechar
          </button>

          {!completedResult ? (
            <button
              type="button"
              disabled={tabulating}
              onClick={handleRunTabulation}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {tabulating ? (
                'Tabulando Dados...'
              ) : (
                <>
                  Tabular Respostas e Injetar na Avaliação <ArrowRight size={16} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateToAssessments) onNavigateToAssessments();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Shield size={16} /> Ir para Avaliações (GRO/PGR)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
