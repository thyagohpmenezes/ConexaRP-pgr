import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, 
  ShieldCheck, 
  Activity, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { DomainData, ChecklistData, MatrixColor } from '../types';

interface AnalysisViewProps {
  domains: DomainData[];
  checklist: ChecklistData;
  checklistCriticality: number;
  employeeOverallMean: number;
  managerOverallMean: number;
  assessment?: any;
  onUpdate?: (updates: any) => void;
}

export default function AnalysisView({ 
  checklistCriticality, 
  employeeOverallMean, 
  managerOverallMean,
  assessment,
  onUpdate
}: AnalysisViewProps) {

  // Lógica de Triangulação Fiel à Metodologia RP (Pesos 4, 3, 4)
  const triangulation = useMemo(() => {
    // 1. Normalização (Escala 1-5 vira 0-1)
    const colabNormalized = employeeOverallMean > 0 ? (employeeOverallMean - 1) / 4 : 0;
    const gestorNormalized = managerOverallMean > 0 ? (managerOverallMean - 1) / 4 : 0;
    const checklistNormalized = checklistCriticality; // Já é 0 a 1

    // 2. Aplicação de Pesos (Metodologia ConexaRP)
    const pesoColab = 4;
    const pesoGestor = 3;
    const pesoChecklist = 4;
    const pesoTotal = pesoColab + pesoGestor + pesoChecklist;

    // 3. Cálculo da Média Ponderada
    let somaPonderada = 0;
    let somaPesosAtivos = 0;

    if (employeeOverallMean > 0) {
      somaPonderada += colabNormalized * pesoColab;
      somaPesosAtivos += pesoColab;
    }
    
    if (managerOverallMean > 0) {
      somaPonderada += gestorNormalized * pesoGestor;
      somaPesosAtivos += pesoGestor;
    }

    // Checklist sempre conta (Peso 4)
    somaPonderada += checklistNormalized * pesoChecklist;
    somaPesosAtivos += pesoChecklist;

    const scoreFinal = somaPesosAtivos > 0 ? somaPonderada / somaPesosAtivos : 0;

    // 4. Determinação de Probabilidade e Severidade (Escalonamento 1 a 5)
    // Regra: 0-0.2 (1), 0.2-0.4 (2), 0.4-0.6 (3), 0.6-0.8 (4), 0.8-1.0 (5)
    const suggestedValue = Math.min(5, Math.max(1, Math.ceil(scoreFinal * 5)));

    return {
      score: scoreFinal,
      suggestedValue,
      activeWeights: somaPesosAtivos
    };
  }, [employeeOverallMean, managerOverallMean, checklistCriticality]);

  // Estados locais para ajuste manual
  const [severity, setSeverity] = useState(assessment?.severity || triangulation.suggestedValue);
  const [probability, setProbability] = useState(assessment?.probability || triangulation.suggestedValue);

  // Sincronizar sugestão automática se não houver edição manual (opcional, aqui estamos sendo fiéis)
  useEffect(() => {
    if (!assessment?.severity) setSeverity(triangulation.suggestedValue);
    if (!assessment?.probability) setProbability(triangulation.suggestedValue);
  }, [triangulation.suggestedValue]);

  // Atualizar o banco de dados quando os valores mudarem
  useEffect(() => {
    if (onUpdate) {
      const currentRiskScore = probability * severity;
      if (
        assessment?.triangulationScore !== triangulation.score || 
        assessment?.riskScore !== currentRiskScore ||
        assessment?.probability !== probability ||
        assessment?.severity !== severity
      ) {
        onUpdate({
          triangulationScore: triangulation.score,
          probability,
          severity,
          riskScore: currentRiskScore
        });
      }
    }
  }, [triangulation.score, probability, severity]);

  const riskValue = probability * severity;
  
  const getMatrixColor = (val: number) => {
    if (val >= 20) return { bg: 'bg-rose-500', text: 'text-white', label: 'CRÍTICO', color: MatrixColor.RED };
    if (val >= 15) return { bg: 'bg-orange-400', text: 'text-white', label: 'ALTO', color: MatrixColor.ORANGE };
    if (val >= 6) return { bg: 'bg-amber-200', text: 'text-amber-900', label: 'MODERADO', color: MatrixColor.YELLOW };
    return { bg: 'bg-emerald-500', text: 'text-white', label: 'BAIXO', color: MatrixColor.GREEN };
  };

  const status = getMatrixColor(riskValue);

  return (
    <div className="space-y-6">
      {/* KPI da Triangulação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <Target size={120} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Índice de Triangulação (RP)</p>
          <p className="text-5xl font-black italic tracking-tighter mb-4">{triangulation.score.toFixed(3)}</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-600/30 border border-blue-500/50 rounded text-[9px] font-black uppercase">Peso Total Ativo: {triangulation.activeWeights}</span>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Activity size={16} className="text-blue-600" /> Detalhamento dos Eixos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Eixo 1: Colab.', score: employeeOverallMean, weight: 4, color: 'blue' },
              { label: 'Eixo 2: Gestores', score: managerOverallMean, weight: 3, color: 'indigo' },
              { label: 'Eixo 3: Checklist', score: checklistCriticality * 5, weight: 4, color: 'emerald' }
            ].map(eixo => (
              <div key={eixo.label} className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-500 uppercase">{eixo.label}</p>
                  <p className="text-xs font-black text-slate-900">Peso {eixo.weight}</p>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-${eixo.color}-500 transition-all`} style={{ width: `${(eixo.score / 5) * 100}%` }} />
                </div>
                <p className="text-[10px] font-bold text-slate-400">Média: {eixo.score > 0 ? eixo.score.toFixed(2) : '0.00'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matriz de Risco 5x5 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-8 w-full">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Determinação de Risco (Matriz 5x5)</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Probabilidade</label>
                    <span className="text-xs font-black text-blue-600">{probability}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={`prob-${v}`}
                        onClick={() => setProbability(v)}
                        className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border-2 ${probability === v ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Severidade</label>
                    <span className="text-xs font-black text-blue-600">{severity}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={`sev-${v}`}
                        onClick={() => setSeverity(v)}
                        className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border-2 ${severity === v ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${status.bg.replace('bg-', 'bg-').replace('500', '50')} ${status.color === MatrixColor.RED ? 'border-rose-200' : status.color === MatrixColor.ORANGE ? 'border-orange-200' : status.color === MatrixColor.YELLOW ? 'border-amber-200' : 'border-emerald-200'}`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nível de Risco Identificado</p>
                <h4 className={`text-2xl font-black italic uppercase tracking-tighter ${status.color === MatrixColor.RED ? 'text-rose-600' : status.color === MatrixColor.ORANGE ? 'text-orange-600' : status.color === MatrixColor.YELLOW ? 'text-amber-700' : 'text-emerald-600'}`}>
                  {status.label} ({riskValue})
                </h4>
              </div>
              <ShieldCheck size={40} className={status.color === MatrixColor.RED ? 'text-rose-500' : status.color === MatrixColor.ORANGE ? 'text-orange-500' : status.color === MatrixColor.YELLOW ? 'text-amber-500' : 'text-emerald-500'} />
            </div>
          </div>

          {/* Visual Matrix */}
          <div className="shrink-0 p-4 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="grid grid-cols-6 gap-2">
              <div className="w-8 h-8" />
              {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-10 h-10 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">S{s}</div>)}
              {[5, 4, 3, 2, 1].map(p => (
                <React.Fragment key={p}>
                  <div className="w-10 h-10 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">P{p}</div>
                  {[1, 2, 3, 4, 5].map(s => {
                    const value = p * s;
                    const cell = getMatrixColor(value);
                    const isActive = p === probability && s === severity;
                    return (
                      <div 
                        key={s} 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${cell.bg} ${cell.text} ${isActive ? 'ring-4 ring-slate-900 scale-110 z-10 shadow-xl' : 'opacity-20 grayscale-[0.5]'}`}
                      >
                        {value}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-6 italic">Visualização da Matriz de Risco RP</p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Nota Metodológica</p>
          <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
            O Índice de Triangulação é calculado ponderando a Escuta Ativa (Colaboradores), a Visão Estratégica (Gestores) e a Auditoria de Campo (Checklist). 
            <strong> Probabilidade e Severidade </strong> são sugeridas automaticamente com base no Índice Final escalonado de 1 a 5, mas podem ser ajustadas pelo auditor conforme evidências específicas.
          </p>
        </div>
      </div>
    </div>
  );
}
