import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Target, 
  ShieldCheck, 
  Activity, 
  Info,
  Maximize2,
  TrendingDown
} from 'lucide-react';
import { DomainData, ChecklistData, TriangulationSource, MatrixColor } from '../types';
import { SOURCE_WEIGHTS } from '../constants';

interface AnalysisViewProps {
  domains: DomainData[];
  checklist: ChecklistData;
  checklistCriticality: number;
  employeeOverallMean: number;
  managerOverallMean: number;
  assessment?: any; // Replace with Assessment type
  onUpdate?: (updates: any) => void;
}

export default function AnalysisView({ 
  domains, 
  checklistCriticality, 
  employeeOverallMean, 
  managerOverallMean,
  assessment,
  onUpdate
}: AnalysisViewProps) {

  
  const [sources, setSources] = useState<TriangulationSource[]>([
    { id: 'colab', name: 'Pesquisa Colaboradores', score: employeeOverallMean, weight: SOURCE_WEIGHTS.colaboradores, intensity: 0, reliability: 1, active: true },
    { id: 'gestor', name: 'Pesquisa Gestores', score: managerOverallMean, weight: SOURCE_WEIGHTS.gestores, intensity: 0, reliability: 1, active: true },
    { id: 'checklist', name: 'Checklist Empresa', score: checklistCriticality * 100, weight: SOURCE_WEIGHTS.checklist, intensity: 0, reliability: 1, active: true },
    { id: 'indicadores', name: 'Indicadores Complementares', score: 0, weight: SOURCE_WEIGHTS.indicadores, intensity: 0, reliability: 0.75, active: false },
    { id: 'docs', name: 'Documentos/Registros', score: 0, weight: SOURCE_WEIGHTS.documentos, intensity: 0, reliability: 0.75, active: false },
    { id: 'entrevistas', name: 'Entrevistas Técnicas', score: 0, weight: SOURCE_WEIGHTS.entrevistas, intensity: 0, reliability: 0.75, active: false },
    { id: 'aet', name: 'AEP/AET', score: 0, weight: SOURCE_WEIGHTS.aet_aep, intensity: 0, reliability: 0.75, active: false }
  ]);

  React.useEffect(() => {
    setSources(prev => prev.map(s => {
      let newIntensity = s.intensity;
      let newScore = s.score;
      
      if (s.id === 'colab') {
        newScore = employeeOverallMean;
        if (employeeOverallMean >= 3.0) newIntensity = 1.0;
        else if (employeeOverallMean >= 2.0) newIntensity = 0.5;
        else newIntensity = 0.1;
      } else if (s.id === 'gestor') {
        newScore = managerOverallMean;
        if (managerOverallMean >= 3.0) newIntensity = 1.0;
        else if (managerOverallMean >= 2.0) newIntensity = 0.5;
        else newIntensity = 0.1;
      } else if (s.id === 'checklist') {
        const checklistScore = checklistCriticality * 100;
        newScore = checklistScore;
        if (checklistCriticality >= 0.5) newIntensity = 1.0;
        else if (checklistCriticality >= 0.2) newIntensity = 0.5;
        else newIntensity = 0.1;
      }
      
      return { ...s, score: newScore, intensity: newIntensity };
    }));
  }, [employeeOverallMean, managerOverallMean, checklistCriticality]);

  const updateSource = (id: string, updates: Partial<TriangulationSource>) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const triangulation = useMemo(() => {
    const activeSources = sources.filter(s => s.active);
    
    let scoreTotal = 0;
    let scoreMaximoAplicavel = 0;
    const normalizedScores: number[] = [];

    activeSources.forEach(s => {
      // Se a fonte não tem dados (score === 0), ela não deve diluir a nota final (não é um peso aplicável)
      if (s.score === 0) return;

      let normalizedScore = 0;
      if (s.id === 'colab' || s.id === 'gestor') {
        normalizedScore = s.score > 0 ? Math.max(0, (s.score - 1) / 4) : 0;
      } else if (s.id === 'checklist') {
        normalizedScore = s.score / 100;
      } else {
        normalizedScore = s.score / 100;
      }
      
      normalizedScores.push(normalizedScore);
      scoreTotal += normalizedScore * s.weight * s.intensity * s.reliability;
      scoreMaximoAplicavel += s.weight;
    });

    const finalScore = scoreMaximoAplicavel > 0 ? scoreTotal / scoreMaximoAplicavel : 0;
    
    // Calcula Grau de Convergência (Desvio Padrão dos scores normalizados)
    let grauConvergencia = 'FRACA';
    if (normalizedScores.length > 0) {
      const mean = normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;
      const variance = normalizedScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / normalizedScores.length;
      const stdDev = Math.sqrt(variance);
      
      // Variação <= ±0.5 (escala 1-5) equivale a 0.125 na escala 0-1
      if (stdDev <= 0.125) grauConvergencia = 'FORTE';
      else if (stdDev <= 0.25) grauConvergencia = 'MODERADA';
    }

    return { 
      score: finalScore, 
      grau: grauConvergencia, 
      sumWeights: scoreMaximoAplicavel 
    };
  }, [sources]);

  const [severity, setSeverity] = useState(assessment?.severity || 3);
  const [probability, setProbability] = useState(assessment?.probability || 1);

  // Auto-sugere probabilidade baseado no score triangulado, apenas se não houver edição manual recente
  React.useEffect(() => {
    let suggestedProb = 1;
    if (triangulation.score >= 0.6) suggestedProb = 4;
    else if (triangulation.score >= 0.3) suggestedProb = 3;
    else if (triangulation.score >= 0.1) suggestedProb = 2;
    
    // Se a convergência for FORTE e o risco alto, sobe a probabilidade
    if (triangulation.grau === 'FORTE' && triangulation.score > 0.6) suggestedProb = 5;
    
    setProbability(suggestedProb);
  }, [triangulation.score, triangulation.grau]);

  const handleSeverityChange = (val: number) => {
    setSeverity(val);
    if (onUpdate) {
      onUpdate({ severity: val, riskScore: val * probability });
    }
  };

  const handleProbabilityChange = (val: number) => {
    setProbability(val);
    if (onUpdate) {
      onUpdate({ probability: val, riskScore: val * severity });
    }
  };

  React.useEffect(() => {
    if (onUpdate) {
      if (assessment?.triangulationScore !== triangulation.score || assessment?.riskScore !== (probability * severity) || assessment?.grauConvergencia !== triangulation.grau) {
        onUpdate({ 
          triangulationScore: triangulation.score,
          grauConvergencia: triangulation.grau,
          riskScore: probability * severity,
          severity,
          probability
        });
      }
    }
  }, [triangulation.score, triangulation.grau, probability, severity]);

  const riskValue = probability * severity;
  const matrixColor = useMemo(() => {
    if (riskValue >= 20) return MatrixColor.RED;
    if (riskValue >= 15) return MatrixColor.ORANGE;
    if (riskValue >= 6) return MatrixColor.YELLOW;
    return MatrixColor.GREEN;
  }, [riskValue]);

  return (
    <div className="space-y-4 text-slate-800">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <div className="xl:col-span-7 flex flex-col gap-3">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex-1">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-600">
                <Activity size={14} className="text-blue-600" /> Fontes de Triangulação
              </h2>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Peso Total: {triangulation.sumWeights}</div>
            </div>
            <table className="w-full text-left text-[11px]">
               <thead>
                  <tr className="bg-white border-b border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest font-black">
                     <th className="px-4 py-3">Usar</th>
                     <th className="px-4 py-3">Fonte</th>
                     <th className="px-4 py-3 text-center">Ajustes</th>
                     <th className="px-4 py-3 text-center">Peso</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {sources.map(s => (
                     <tr key={s.id} className={`${s.active ? 'bg-white' : 'bg-slate-50/50 opacity-40 transition-opacity'}`}>
                        <td className="px-4 py-2 text-center">
                           <input type="checkbox" checked={s.active} onChange={(e) => updateSource(s.id, { active: e.target.checked })} className="accent-blue-600 scale-90" />
                        </td>
                        <td className="px-4 py-2">
                           <p className="font-bold text-slate-700 leading-tight">{s.name}</p>
                           <p className="text-[9px] text-slate-400 font-medium">Score: {s.score.toFixed(2)}</p>
                        </td>
                        <td className="px-4 py-2">
                           <div className="flex flex-col gap-1 items-center">
                              <select value={s.intensity} onChange={(e) => updateSource(s.id, { intensity: parseFloat(e.target.value) })} className="text-[9px] border border-slate-200 rounded p-0.5 w-full max-w-[100px] font-bold bg-white">
                                 <option value="1">Int. Alta (1.0)</option>
                                 <option value="0.5">Int. Média (0.5)</option>
                                 <option value="0.1">Int. Baixa (0.1)</option>
                              </select>
                              <select value={s.reliability} onChange={(e) => updateSource(s.id, { reliability: parseFloat(e.target.value) })} className="text-[9px] border border-slate-200 rounded p-0.5 w-full max-w-[100px] font-bold bg-white">
                                 <option value="1">Conf. Alta (1.0)</option>
                                 <option value="0.75">Conf. Média (0.75)</option>
                                 <option value="0.5">Conf. Baixa (0.5)</option>
                              </select>
                           </div>
                        </td>
                        <td className="px-4 py-2 text-center font-black text-blue-600">{s.weight}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 flex flex-col gap-3">
            <div className="bg-slate-900 border-2 border-blue-900/50 text-white p-5 rounded-lg flex items-center justify-between shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] opacity-10">
                 <Target size={120} />
              </div>
              <div className="relative z-10 text-left">
                 <h3 className="text-blue-400 text-[9px] font-black uppercase tracking-widest mb-1 italic">Índice de Convergência</h3>
                 <p className="text-5xl font-black italic tracking-tighter leading-none">{triangulation.score.toFixed(3)}</p>
                 <div className="mt-3 flex gap-2">
                    <span className="px-2 py-0.5 bg-blue-600/30 border border-blue-400 rounded text-[9px] font-black uppercase tracking-widest">G. Conv: {triangulation.grau}</span>
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-black uppercase tracking-widest">METODOLOGIA CONEXA</span>
                 </div>
              </div>
              <Target size={32} className="text-blue-500 relative z-10" />
            </div>

           <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex-1">
              <div className="flex flex-col gap-3 mb-4 border-b border-slate-50 pb-3">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Matriz 5x5 Prioritária</h3>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Severidade</span>
                    <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(v => (
                          <button key={`sev-${v}`} onClick={() => handleSeverityChange(v)} className={`w-6 h-6 rounded text-[10px] font-black transition-all ${severity === v ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{v}</button>
                       ))}
                    </div>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Probabilidade</span>
                    <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(v => (
                          <button key={`prob-${v}`} onClick={() => handleProbabilityChange(v)} className={`w-6 h-6 rounded text-[10px] font-black transition-all ${probability === v ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{v}</button>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="flex gap-4 items-start">
                 <div className="grid grid-cols-6 gap-1 bg-white p-1 rounded-sm">
                    <div className="h-6 w-6" /> {[1,2,3,4,5].map(s => <div key={s} className="w-6 h-6 flex items-center justify-center text-[8px] font-black text-slate-300 uppercase">{s}</div>)}
                    {[5,4,3,2,1].map(p => (
                       <React.Fragment key={p}>
                          <div className="w-6 h-6 flex items-center justify-center text-[8px] font-black text-slate-300 uppercase">{p}</div>
                          {[1,2,3,4,5].map(s => {
                             const value = p * s;
                             let bg = 'bg-emerald-100 text-emerald-800';
                             if (value >= 20) bg = 'bg-rose-500 text-white';
                             else if (value >= 15) bg = 'bg-orange-400 text-white';
                             else if (value >= 6) bg = 'bg-amber-200 text-amber-800';
                             return <div key={s} className={`w-6 h-6 rounded-[2px] ${bg} flex items-center justify-center text-[9px] font-black ${p === probability && s === severity ? 'ring-2 ring-slate-900 scale-110 z-10 shadow-md' : 'opacity-25'}`}>{value}</div>
                          })}
                       </React.Fragment>
                    ))}
                 </div>
                 <div className="flex-1 py-1 text-center">
                    <div className={`px-2 py-1.5 rounded border-2 font-black text-sm mb-2 uppercase tracking-widest ${matrixColor === MatrixColor.RED ? 'bg-rose-50 border-rose-500 text-rose-600' : matrixColor === MatrixColor.ORANGE ? 'bg-orange-50 border-orange-500 text-orange-600' : matrixColor === MatrixColor.YELLOW ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-emerald-50 border-emerald-500 text-emerald-600'}`}>
                       {matrixColor} ({riskValue})
                    </div>
                    <div className="space-y-1 mt-3 text-left">
                       <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Probabilidade</span>
                          <span className="text-slate-800">{probability}</span>
                       </div>
                       <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-1">
                          <span>Severidade</span>
                          <span className="text-slate-800">{severity}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
