import React from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  BarChart3, 
  AlertTriangle, 
  Search, 
  LayoutGrid,
  ClipboardList,
  Users,
  Layers
} from 'lucide-react';
import { Assessment, DomainData } from '../types';
import { HAZARD_MASTER, DOMAINS } from '../constants';

interface ReportGeneratorProps {
  assessment: Assessment;
  checklistCriticality: number;
  employeeOverallMean: number;
  managerOverallMean: number;
  onConclude: () => void;
}

export default function ReportGenerator({ 
  assessment, 
  checklistCriticality, 
  employeeOverallMean, 
  managerOverallMean,
  onConclude
}: ReportGeneratorProps) {

  const { domains, status, triangulationScore, grauConvergencia = 'FRACA', riskScore, probability, severity } = assessment;

  const getRiskLabel = (val: number) => {
    if (val >= 17) return 'CRÍTICO';
    if (val >= 10) return 'ALTO';
    if (val >= 6) return 'MODERADO';
    return 'BAIXO';
  };

  // 1. Calcular inventário detalhado por setor (classificação individual solicitada)
  const getInventoryBySector = () => {
    const inventory: Record<string, { rowCount: number, hazards: any[] }> = {};
    
    // Processar setores do breakdown (Análise Individual)
    if (assessment.sectorBreakdown) {
      Object.entries(assessment.sectorBreakdown).forEach(([sName, sData]) => {
        // Filtrar domínios críticos específicos deste setor (média >= 3.0)
        const sCritical = sData.domains.filter(d => d.employeeMean >= 3.0);
        const sHazards = sCritical.flatMap(cd => HAZARD_MASTER.filter(h => h.domainId === cd.id));
        
        if (sHazards.length > 0) {
          inventory[sName] = {
            rowCount: sData.rowCount || 0,
            hazards: sHazards
          };
        }
      });
    }

    // Se estiver na visão Geral e não houver setores, ou para garantir que o Geral apareça se for crítico
    const globalCritical = domains.filter(d => d.employeeMean >= 3.0);
    const globalHazards = globalCritical.flatMap(cd => HAZARD_MASTER.filter(h => h.domainId === cd.id));
    
    if (Object.keys(inventory).length === 0 && globalHazards.length > 0) {
      inventory['GERAL (EMPRESA)'] = { 
        rowCount: 0, 
        hazards: globalHazards 
      };
    }
    
    return inventory;
  };

  const inventoryData = getInventoryBySector();

  // 2. Recomendações dinâmicas baseadas nos fatores críticos reais
  const allCriticalHazards = Object.values(inventoryData).flatMap(d => d.hazards);
  const dynamicRecommendations = Array.from(new Set(allCriticalHazards.map(h => (h as any).recommendation))).filter(Boolean) as string[];
  
  const finalRecommendations = dynamicRecommendations.length > 0 
    ? dynamicRecommendations 
    : [
        "Monitorar continuamente os indicadores de saúde mental e clima organizacional.",
        "Manter canal aberto de comunicação entre liderança e liderados.",
        "Revisar o inventário de riscos em caso de mudanças nos processos de trabalho."
      ];

  const riskColor = riskScore >= 17 ? 'text-rose-600' : riskScore >= 10 ? 'text-orange-600' : riskScore >= 6 ? 'text-amber-600' : 'text-emerald-600';
  const riskLabel = getRiskLabel(riskScore);

  const divergentDomains = domains.filter(d => Math.abs(d.employeeMean - d.managerMean) > 1.0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-slate-800">
      {/* Cabeçalho do Relatório */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white">
                 <FileText size={14} />
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Relatório de Avaliação Psicossocial</h1>
           </div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protocolo GRO/PGR | Metodologia Conexa | Ref: {new Date().toLocaleDateString()}</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
        >
          <Download size={14} />
          Exportar PDF
        </button>
      </div>

      {/* 1. Contexto Avaliatório */}
      <section className="space-y-4">
         <h2 className="text-[11px] font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest border-l-4 border-slate-800 pl-2">
            <FileText size={12} className="text-slate-800" />
            1. Contexto Avaliatório
         </h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded text-xs">
            <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Unidade</p>
               <p className="font-black text-slate-700">{assessment.unitId}</p>
            </div>
            <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visão Atual</p>
               <p className="font-black text-blue-600">{assessment.sectorId || 'Global (Empresa)'}</p>
            </div>
            <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GES em Foco</p>
               <p className="font-black text-slate-700">{assessment.gesId || 'Todos'}</p>
            </div>
            <div>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Data do Relatório</p>
               <p className="font-black text-slate-700">{new Date().toLocaleDateString()}</p>
            </div>
         </div>
      </section>

      {/* 2. Resultados da Triangulação */}
      <section className="space-y-4">
         <h2 className="text-[11px] font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest border-l-4 border-blue-600 pl-2">
            <BarChart3 size={12} className="text-blue-600" />
            2. Resultados da Triangulação (Nível {assessment.sectorId || 'Global'})
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border border-slate-200 rounded">
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Índice de Convergência</p>
               <div className="flex items-baseline gap-2">
                  <p className="text-xl font-black text-slate-900 leading-none">{triangulationScore.toFixed(3)}</p>
                  <span className="text-[10px] font-black text-blue-600 uppercase">({grauConvergencia})</span>
               </div>
            </div>
            <div className="p-3 border border-slate-200 rounded">
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Risco Calculado</p>
               <p className={`text-xl font-black leading-none ${riskColor}`}>{riskLabel} ({riskScore})</p>
            </div>
            <div className="p-3 border border-slate-200 rounded">
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Matriz 5x5</p>
               <p className="text-sm font-black text-slate-700 leading-none uppercase">P: {probability} × S: {severity}</p>
            </div>
         </div>
      </section>

      {/* 3. Inventário PGR Detalhado por Setor (Solicitação Principal do Usuário) */}
      <section className="space-y-3">
         <h2 className="text-[11px] font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest border-l-4 border-rose-600 pl-2">
            <AlertTriangle size={12} className="text-rose-600" />
            3. Inventário de Fatores Críticos - Classificação Individual
         </h2>
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Mapeamento de perigos psicossociais isolados por departamento para inclusão no PGR.</p>
         
         <div className="space-y-6">
            {Object.keys(inventoryData).length > 0 ? (
               Object.entries(inventoryData).map(([sector, data]) => (
                  <div key={sector} className="border-2 border-slate-100 rounded-xl overflow-hidden shadow-sm hover:border-slate-200 transition-colors">
                     <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-blue-600">
                              <LayoutGrid size={16} />
                           </div>
                           <div>
                              <h3 className="text-[11px] font-black text-slate-900 uppercase italic tracking-tight">SETOR: {sector}</h3>
                              {data.rowCount > 0 && (
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Users size={10} /> {data.rowCount} Colaboradores Avaliados
                                 </p>
                              )}
                           </div>
                        </div>
                        <div className="bg-white border border-slate-200 px-3 py-1 rounded-full">
                           <span className="text-[9px] font-black text-rose-600 uppercase">Perigos Identificados: {data.hazards.length}</span>
                        </div>
                     </div>
                     <table className="w-full text-left text-[11px]">
                        <thead className="bg-white border-b border-slate-100">
                           <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              <th className="px-6 py-3 w-1/3 italic">Fator de Risco / Perigo</th>
                              <th className="px-6 py-3">Danos e Consequências à Saúde do Trabalhador</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {data.hazards.map((h, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                 <td className="px-6 py-4 font-black text-slate-800 uppercase text-[10px] leading-tight border-r border-slate-50">{h.hazard}</td>
                                 <td className="px-6 py-4 text-slate-600 text-[10px] font-medium leading-relaxed italic">{h.possibleDamages}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               ))
            ) : (
               <div className="p-12 text-center bg-slate-50 border border-slate-100 rounded-xl">
                  <Search size={32} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-xs text-slate-400 font-bold uppercase italic tracking-widest">Nenhum fator crítico mapeado. Verifique os dados de importação.</p>
               </div>
            )}
         </div>
      </section>

      {/* 4. Análise Comparativa por Setor (Tabulação) */}
      <section className="space-y-4">
         <h2 className="text-[11px] font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest border-l-4 border-blue-600 pl-2">
            <LayoutGrid size={12} className="text-blue-600" />
            4. Análise Comparativa de Risco por Departamento
         </h2>
         <div className="overflow-hidden border border-slate-200 rounded shadow-sm">
           <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black">
                 <tr>
                    <th className="px-4 py-3">Setor / Departamento</th>
                    <th className="px-4 py-3 text-center">Amostra</th>
                    <th className="px-4 py-3 text-center">Grau de Risco</th>
                    <th className="px-4 py-3 text-center">Status PGR</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                 <tr className="bg-blue-50/50">
                    <td className="px-4 py-3 font-black text-blue-700 uppercase">MÉDIA GLOBAL (EMPRESA)</td>
                    <td className="px-4 py-3 text-center font-black text-blue-600 italic">TOTAL</td>
                    <td className="px-4 py-3 text-center font-black">{(riskScore).toFixed(0)}</td>
                    <td className="px-4 py-3 text-center">
                       <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Referência</span>
                    </td>
                 </tr>
                 {assessment.sectorBreakdown && Object.entries(assessment.sectorBreakdown).length > 0 ? (
                   Object.entries(assessment.sectorBreakdown).map(([name, data]) => {
                      const rScore = data.riskScore || 0;
                      const rLabel = getRiskLabel(rScore);
                      const rColor = rScore >= 17 ? 'text-rose-600' : rScore >= 10 ? 'text-orange-600' : rScore >= 6 ? 'text-amber-600' : 'text-emerald-600';

                      return (
                         <tr key={name} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 uppercase font-bold text-slate-700">{name}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-500">{data.rowCount || 'N/A'}</td>
                            <td className={`px-4 py-3 text-center font-black ${rColor}`}>{rScore.toFixed(0)}</td>
                            <td className="px-4 py-3 text-center">
                               <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                  rScore >= 17 ? 'bg-rose-100 text-rose-700' : 
                                  rScore >= 10 ? 'bg-orange-100 text-orange-700' : 
                                  rScore >= 6 ? 'bg-amber-100 text-amber-700' : 
                                  'bg-emerald-100 text-emerald-700'
                               }`}>
                                  {rLabel}
                               </span>
                            </td>
                         </tr>
                      );
                   })
                 ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic text-[10px]">
                        Nenhum setor individual identificado. Importe os dados com a coluna "Setor" para ativar.
                      </td>
                    </tr>
                 )}
              </tbody>
           </table>
         </div>
      </section>

      {/* 5. Divergência */}
      <section className="space-y-4">
         <h2 className="text-[11px] font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-2">
            <Search size={12} className="text-amber-500" />
            5. Análise de Divergência (Gestão vs Colaboradores)
         </h2>
         <div className="bg-slate-50 border border-slate-100 rounded p-4">
            <div className="space-y-2">
               {divergentDomains.length > 0 ? divergentDomains.map(d => (
                 <div key={d.id} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded shadow-sm">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">{d.name}</span>
                    <span className="text-[10px] font-black text-amber-600">Δ {Math.abs(d.employeeMean - d.managerMean).toFixed(1)}</span>
                 </div>
               )) : (
                 <div className="p-2 text-[10px] text-slate-400 font-medium italic">Alinhamento satisfatório identificado entre as visões gerenciais e operacionais.</div>
               )}
            </div>
         </div>
      </section>

      {/* 6. Recomendações Dinâmicas Personalizadas */}
      <section className="space-y-3">
         <h2 className="text-[11px] font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest border-l-4 border-emerald-600 pl-2">
            <ClipboardList size={12} className="text-emerald-600" />
            6. Recomendações e Plano de Ação Personalizado
         </h2>
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Medidas de controle sugeridas com base nos fatores críticos identificados nos setores.</p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {finalRecommendations.map((action, i) => (
              <div key={i} className="flex gap-4 p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl items-start">
                 <div className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">{i+1}</div>
                 <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-tight leading-relaxed">{action}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Assinaturas */}
      <div className="pt-12 grid grid-cols-2 gap-12 border-t border-slate-100 mb-8">
         <div className="text-center">
            <div className="h-px bg-slate-300 w-full mb-3" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Consultoria SST Responsável</p>
            <p className="text-[8px] text-slate-400 font-medium uppercase mt-1 italic">Emitido via Plataforma ConexaRP</p>
         </div>
         <div className="text-center">
            <div className="h-px bg-slate-300 w-full mb-3" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Aprovação Direção / SESMT</p>
            <p className="text-[8px] text-slate-400 font-medium uppercase mt-1 italic">Data da Aprovação: ___/___/___</p>
         </div>
      </div>
      
      {/* Botões de Conclusão */}
      {status !== 'CONCLUÍDA' && (
         <div className="flex justify-center border-t border-dashed border-slate-200 pt-8 no-print">
            <button
               onClick={onConclude}
               className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-5 rounded-2xl uppercase tracking-widest text-xs flex items-center gap-4 transition-all shadow-xl shadow-emerald-600/30 active:scale-95"
            >
               <CheckCircle size={22} />
               Concluir e Finalizar PGR
            </button>
         </div>
      )}
    </div>
  );
}
