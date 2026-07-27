import React, { useState } from 'react';
import { Company } from '../../domain/types';
import { X, Building2, Calendar, Users, Target, CheckCircle2, FileSpreadsheet, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onCreateProject: (params: {
    company: Company;
    title: string;
    goal: string;
    period: string;
    targetEmployeeCount: number;
    autoProvisionSources: boolean;
  }) => Promise<any>;
}

export const CreateProjectWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  companies,
  onCreateProject,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [period, setPeriod] = useState<string>('2026.1');
  const [title, setTitle] = useState<string>('');
  const [goal, setGoal] = useState<string>(
    'Diagnóstico dos fatores psicossociais e de clima organizacional conforme diretrizes da NR-01.'
  );
  const [targetEmployeeCount, setTargetEmployeeCount] = useState<number>(25);
  const [autoProvisionSources, setAutoProvisionSources] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const comp = companies.find((c) => c.id === companyId);
    if (comp) {
      setTitle(`Pesquisa de Clima & Riscos - ${comp.name}`);
      setTargetEmployeeCount(comp.employeeCount || 25);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    setSubmitting(true);
    try {
      await onCreateProject({
        company: selectedCompany,
        title,
        goal,
        period,
        targetEmployeeCount,
        autoProvisionSources,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao criar projeto:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Novo Projeto de Pesquisa
              </h3>
              <p className="text-slate-400 text-xs font-semibold">
                Passo {step} de 3 — {step === 1 ? 'Seleção da Empresa' : step === 2 ? 'Escopo & Metas' : 'Fontes de Coleta'}
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

        {/* Step Indicator */}
        <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 text-center text-xs font-black">
          <div
            className={`py-3 transition-colors ${
              step === 1 ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            1. Empresa & Período
          </div>
          <div
            className={`py-3 transition-colors ${
              step === 2 ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            2. Título & Metas
          </div>
          <div
            className={`py-3 transition-colors ${
              step === 3 ? 'bg-blue-600 text-white' : 'text-slate-600'
            }`}
          >
            3. Fontes de Coleta
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Selecione a Empresa Destino
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  required
                >
                  <option value="">-- Selecione uma Empresa --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clientName} {c.economicGroupName ? `• ${c.economicGroupName}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Período do Projeto
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="Ex: 2026.1 ou 2026-Q1"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {selectedCompany && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-blue-900">
                    <Building2 size={16} /> Empresa Selecionada: {selectedCompany.name}
                  </div>
                  <p className="text-blue-700 font-semibold">
                    Cliente: {selectedCompany.clientName} | Grupo: {selectedCompany.economicGroupName || 'Independente'}
                  </p>
                  <p className="text-blue-700 font-semibold">
                    Total Cadastrado de Funcionários: {selectedCompany.employeeCount || 0}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Título do Projeto de Pesquisa
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome do Projeto"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Objetivo Geral
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Meta de Funcionários a Pesquisar (Amostra Target)
                </label>
                <div className="relative">
                  <Users size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    value={targetEmployeeCount}
                    onChange={(e) => setTargetEmployeeCount(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-blue-600" /> Provedor de Coleta Externa
                </h4>
                <p className="text-xs text-slate-600 font-semibold">
                  O sistema criará as fontes de coleta vinculadas ao projeto (Formulário de Colaboradores e Formulário de Gestores).
                </p>

                <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                  <input
                    type="checkbox"
                    checked={autoProvisionSources}
                    onChange={(e) => setAutoProvisionSources(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Provisionar Google Forms & Sheets Automático
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Gera automaticamente os links dos formulários via driver GoogleFormsProvider.
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-xs space-y-1">
                <p className="font-black flex items-center gap-1">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Projeto Pronto para Inicialização
                </p>
                <p className="font-medium text-emerald-700">
                  Ao confirmar, o projeto entrará no estado <span className="font-black uppercase">CONFIGURING</span> e poderá ser aberto para coleta a qualquer momento.
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all"
            >
              Voltar
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !selectedCompanyId}
              onClick={() => setStep((s) => s + 1)}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all"
            >
              Próximo Passo
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {submitting ? 'Criando Projeto...' : 'Criar Projeto de Pesquisa'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
