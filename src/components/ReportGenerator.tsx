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
import * as XLSX from 'xlsx';
import { FileSpreadsheet } from 'lucide-react';

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

   // 0. Consolidar domínios se os globais estiverem vazios (resiliência para análise setorial pura)
   const getEffectiveDomains = () => {
      if (assessment.domains && assessment.domains.some(d => d.employeeMean > 0)) {
         return assessment.domains;
      }
      
      // Se global está vazio, consolidar dos setores
      if (assessment.sectorBreakdown) {
         const sectors = Object.values(assessment.sectorBreakdown);
         if (sectors.length > 0) {
            // Usar o primeiro setor como base de estrutura e calcular médias
            const baseDomains = [...sectors[0].domains];
            return baseDomains.map(base => {
               const values = sectors.map(s => s.domains.find(d => d.id === base.id)?.employeeMean || 0).filter(v => v > 0);
               const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
               return { ...base, employeeMean: avg, managerMean: avg }; // Simplificado para visualização
            });
         }
      }
      return assessment.domains;
   };

   const effectiveDomains = getEffectiveDomains();
   const { status, triangulationScore, grauConvergencia = 'FRACA', riskScore, probability, severity } = assessment;

   const getRiskLabel = (val: number) => {
      if (val >= 17) return 'CRÍTICO';
      if (val >= 10) return 'ALTO';
      if (val >= 6) return 'MODERADO';
      return 'BAIXO';
   };

   // 1. Calcular inventário detalhado por setor (classificação individual solicitada)
   const getInventoryBySector = () => {
      const inventory: Record<string, { rowCount: number, hazards: any[] }> = {};

      // 1. Primeiro, capturar o Inventário Geral (Empresa)
      const globalCritical = effectiveDomains.filter(d => d.employeeMean >= 3.0);
      const globalHazards = globalCritical.flatMap(cd => HAZARD_MASTER.filter(h => h.domainId === cd.id));
      
      if (globalHazards.length > 0) {
         inventory['GERAL (EMPRESA)'] = {
            rowCount: 0, // No global, não precisamos mostrar contagem aqui conforme pedido anterior
            hazards: globalHazards
         };
      }

      // 2. Depois, processar setores do breakdown (Análise Individual)
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

   const divergentDomains = effectiveDomains.filter(d => Math.abs(d.employeeMean - d.managerMean) > 1.0);

   const exportToExcel = () => {
      const workbook = XLSX.utils.book_new();

      // 1. Aba Resumo
      const summaryData = [
         ['RELATÓRIO DE AVALIAÇÃO PSICOSSOCIAL'],
         ['Data:', new Date().toLocaleDateString()],
         ['Unidade:', assessment.unitId],
         [],
         ['RESULTADOS DA TRIANGULAÇÃO'],
         ['Índice de Convergência', triangulationScore.toFixed(3), grauConvergencia],
         ['Score de Risco', riskScore, getRiskLabel(riskScore)],
         ['Probabilidade', probability],
         ['Severidade', severity],
         [],
         ['DIVERGÊNCIAS (Δ > 1.0)'],
         ...divergentDomains.map(d => [d.name, `Δ ${Math.abs(d.employeeMean - d.managerMean).toFixed(1)}`]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");

      // 2. Aba Inventário
      const inventoryRows = [['SETOR', 'PERIGO', 'RISCO (DESCRIÇÃO)', 'DANOS / AGRAVOS']];
      Object.entries(inventoryData).forEach(([sector, data]) => {
         data.hazards.forEach(h => {
            inventoryRows.push([sector, h.hazard, h.risk, h.possibleDamages]);
         });
      });
      const inventorySheet = XLSX.utils.aoa_to_sheet(inventoryRows);
      XLSX.utils.book_append_sheet(workbook, inventorySheet, "Inventario_Riscos");

      XLSX.writeFile(workbook, `Relatorio_Psicossocial_${assessment.unitId}_${new Date().toISOString().split('T')[0]}.xlsx`);
   };

   return (
      <>
         {/* Estilos de Impressão Customizados */}
         <style>{`
            @media print {
               body * { visibility: hidden; }
               #printable-report, #printable-report * { visibility: visible; }
               #printable-report { 
                  position: absolute !important; 
                  left: 0 !important; 
                  top: 0 !important; 
                  width: 100% !important; 
                  margin: 0 !important; 
                  padding: 20px !important;
                  border: none !important;
                  box-shadow: none !important;
               }
               .no-print { display: none !important; }
               body { background: white !important; }
               * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
         `}</style>

         <div id="printable-report" className="max-w-5xl mx-auto space-y-6 bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-slate-800">
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
               <div className="flex gap-2 no-print">
                  <button
                     onClick={exportToExcel}
                     className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-sm active:scale-95"
                  >
                     <FileSpreadsheet size={14} />
                     Excel
                  </button>
                  <button
                     onClick={() => window.print()}
                     className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                  >
                     <Download size={14} />
                     PDF
                  </button>
               </div>
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

                              </div>
                           </div>
                           <div className="bg-white border border-slate-200 px-3 py-1 rounded-full">
                              <span className="text-[9px] font-black text-rose-600 uppercase">Perigos Identificados: {data.hazards.length}</span>
                           </div>
                        </div>
                        <table className="w-full text-left text-[11px]">
                           <thead className="bg-white border-b border-slate-100">
                              <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                 <th className="px-6 py-3 w-1/4 italic">Fator de Perigo</th>
                                 <th className="px-6 py-3 w-1/3">Risco</th>
                                 <th className="px-6 py-3">Danos e Consequências à Saúde do Trabalhador</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {data.hazards.map((h, i) => (
                                 <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-black text-slate-800 uppercase text-[10px] leading-tight border-r border-slate-50">{h.hazard}</td>
                                    <td className="px-6 py-4 text-slate-600 text-[10px] font-medium leading-relaxed italic border-r border-slate-50">{h.risk}</td>
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

         {/* 4. Análise de Divergência (Gestão vs Colaboradores) */}
         <section className="space-y-4">
            <h2 className="text-[11px] font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-2">
               <Search size={12} className="text-amber-500" />
               4. Análise de Divergência (Gestão vs Colaboradores)
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

         {/* 5. Recomendações Dinâmicas Personalizadas */}
         <section className="space-y-3">
            <h2 className="text-[11px] font-black flex items-center gap-2 text-slate-800 uppercase tracking-widest border-l-4 border-emerald-600 pl-2">
               <ClipboardList size={12} className="text-emerald-600" />
               5. Recomendações e Plano de Ação Personalizado
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Medidas de controle sugeridas com base nos fatores críticos identificados nos setores.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {finalRecommendations.map((action, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl items-start">
                     <div className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">{i + 1}</div>
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
            <div className="flex justify-center border-t border-dashed border-slate-200 pt-12 no-print pb-20">
               <button
                  onClick={() => {
                     const btn = document.getElementById('btn-conclude');
                     if (btn) {
                        btn.innerHTML = '<span class="animate-spin">🌀</span> SALVANDO NO BANCO...';
                        btn.style.opacity = '0.7';
                        btn.style.pointerEvents = 'none';
                     }
                     onConclude?.();
                  }}
                  id="btn-conclude"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-6 rounded-2xl uppercase tracking-widest text-sm flex items-center gap-4 transition-all shadow-2xl shadow-emerald-600/40 active:scale-95 group"
               >
                  <CheckCircle size={24} className="group-hover:scale-110 transition-transform" />
                  Salvar e Concluir Avaliação PGR
               </button>
            </div>
         )}
      </div>
   </>
);
}
