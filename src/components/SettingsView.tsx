import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Sliders, Shield, BookOpen, Trash2, AlertOctagon } from 'lucide-react';
import { SOURCE_WEIGHTS } from '../constants';
import { Company } from '../types';

interface SettingsViewProps {
  companies?: Company[];
  onDeleteCompany?: (id: string) => Promise<void>;
  onResetDatabase?: () => Promise<void>;
}

export default function SettingsView({ companies = [], onDeleteCompany, onResetDatabase }: SettingsViewProps) {
  const [weights, setWeights] = useState(SOURCE_WEIGHTS);
  const [isResetting, setIsResetting] = useState(false);
  
  const [intensities, setIntensities] = useState({
    colaboradores: 1.0,
    gestores: 1.0,
    checklist: 1.0,
    indicadores: 0.5,
    documentos: 0.5,
    entrevistas: 0.5,
    aet_aep: 1.0
  });

  const [reliabilities, setReliabilities] = useState({
    colaboradores: 1.0,
    gestores: 1.0,
    checklist: 1.0,
    indicadores: 0.75,
    documentos: 0.75,
    entrevistas: 0.75,
    aet_aep: 1.0
  });
  
  const [riskMatrix, setRiskMatrix] = useState({
    lowMax: 4,
    moderateMax: 9,
    highMax: 16
  });

  // Just a visual save indicator
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sources = [
    { id: 'colaboradores', name: 'Pesquisa Colaboradores' },
    { id: 'gestores', name: 'Pesquisa Gestores' },
    { id: 'checklist', name: 'Checklist Empresa' },
    { id: 'indicadores', name: 'Indicadores Complementares' },
    { id: 'documentos', name: 'Documentos/Registros' },
    { id: 'entrevistas', name: 'Entrevistas Técnicas' },
    { id: 'aet_aep', name: 'AEP / AET' }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase flex items-center gap-2">
            <SettingsIcon size={20} className="text-blue-600" />
            Parâmetros Metodológicos
          </h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configuração de pesos, intensidades e limiares</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
        >
          {saved ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avaliação de Fontes */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Sliders size={18} className="text-slate-600" />
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Pesos e Fatores de Triangulação</h3>
          </div>
          
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-4 py-3">Fonte de Inteligência</th>
                  <th className="px-4 py-3 w-28">Peso (1 a 5)</th>
                  <th className="px-4 py-3 w-32">Intensidade</th>
                  <th className="px-4 py-3 w-32">Confiabilidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sources.map(({ id, name }) => (
                  <tr key={id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 uppercase leading-none">
                      {name}
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min="1" max="5" 
                        className="w-full text-sm font-black p-1.5 border border-slate-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                        value={(weights as Record<string, number>)[id]}
                        onChange={(e) => setWeights({ ...weights, [id]: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        className="w-full text-xs font-bold p-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={(intensities as Record<string, number>)[id]}
                        onChange={(e) => setIntensities({ ...intensities, [id]: Number(e.target.value) })}
                      >
                        <option value={1.0}>1.0 (Total)</option>
                        <option value={0.5}>0.5 (Parcial)</option>
                        <option value={0.0}>0.0 (Nula)</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        className="w-full text-xs font-bold p-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={(reliabilities as Record<string, number>)[id]}
                        onChange={(e) => setReliabilities({ ...reliabilities, [id]: Number(e.target.value) })}
                      >
                        <option value={1.0}>1.0 (Alta)</option>
                        <option value={0.75}>0.75 (Média)</option>
                        <option value={0.5}>0.5 (Baixa)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-blue-50 border-t border-blue-100 text-[10px] text-blue-800 tracking-wider font-bold">
            <span className="uppercase font-black text-blue-900 mr-1">Fórmula Oculta:</span> Score da Fonte = Intensidade × Confiabilidade × Peso
          </div>
        </div>

        <div className="space-y-6">
          {/* Matriz 5x5 */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Shield size={18} className="text-slate-600" />
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Limiares da Matriz 5x5 (GRO)</h3>
            </div>
            <div className="p-6 space-y-5">
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Risco Baixo</label>
                  <span className="text-xs font-bold text-slate-500">Score de 1 a {riskMatrix.lowMax}</span>
                </div>
                <input 
                  type="range" min="1" max="5" 
                  value={riskMatrix.lowMax}
                  onChange={e => setRiskMatrix({...riskMatrix, lowMax: Number(e.target.value)})}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Risco Moderado</label>
                  <span className="text-xs font-bold text-slate-500">Score de {riskMatrix.lowMax + 1} a {riskMatrix.moderateMax}</span>
                </div>
                <input 
                  type="range" min={riskMatrix.lowMax + 1} max="12" 
                  value={riskMatrix.moderateMax}
                  onChange={e => setRiskMatrix({...riskMatrix, moderateMax: Number(e.target.value)})}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Risco Alto</label>
                  <span className="text-xs font-bold text-slate-500">Score de {riskMatrix.moderateMax + 1} a {riskMatrix.highMax}</span>
                </div>
                <input 
                  type="range" min={riskMatrix.moderateMax + 1} max="20" 
                  value={riskMatrix.highMax}
                  onChange={e => setRiskMatrix({...riskMatrix, highMax: Number(e.target.value)})}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                 <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Risco Crítico</label>
                  <span className="text-xs font-bold text-slate-500">Score de {riskMatrix.highMax + 1} a 25</span>
                </div>
                <div className="w-full h-1.5 bg-rose-200 rounded overflow-hidden">
                  <div className="w-full h-full bg-rose-500" />
                </div>
              </div>

            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 shadow-sm text-white">
            <div className="flex items-center gap-3 mb-3 text-blue-400">
               <BookOpen size={20} />
               <h3 className="font-black uppercase tracking-widest text-xs">Instrução Normativa</h3>
            </div>
            <p className="text-[11px] leading-relaxed font-bold text-slate-400">
              Estas configurações definem como o <span className="text-white">Motor de Análise</span> pondera cada fonte na triangulação. 
              Alterar a intensidade padrão de "Pesquisa Colaboradores" para menos de <span className="text-white">1.0</span> pode subestimar o nível primário de ruído ocupacional.
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
               <AlertOctagon size={20} />
               <h3 className="font-black uppercase tracking-widest text-xs">Zona Crítica</h3>
            </div>
            <p className="text-[10px] font-bold text-rose-800 uppercase mb-4">Apagar Dados de Teste / Reset de Fábrica</p>
            <button 
              onClick={async () => {
                if (!window.confirm('ATENÇÃO: Esta ação apagará TODAS as Avaliações e Planos de Ação. As Empresas e Setores cadastrados serão preservados. Esta ação não pode ser desfeita. Deseja continuar?')) return;
                setIsResetting(true);
                try {
                  if (onResetDatabase) {
                    await onResetDatabase();
                  }
                  alert('Dados apagados com sucesso. O sistema foi resetado.');
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsResetting(false);
                }
              }}
              disabled={isResetting || companies.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 text-white rounded font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 disabled:opacity-50 transition-all"
            >
              <Trash2 size={14} />
              {isResetting ? 'Limpando...' : 'LImpar Todos os Dados'}
            </button>
            <p className="text-[9px] text-rose-400 mt-2 italic text-center">Use esta função para remover avaliações de teste e começar novas análises reais.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
