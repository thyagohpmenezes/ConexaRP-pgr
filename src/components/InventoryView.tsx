import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Search,
  Filter,
  ArrowRight,
  ClipboardCopy,
  Check,
  FileText,
  Table as TableIcon,
  ChevronLeft,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Assessment, MatrixColor } from '../types';
import { HAZARD_MASTER } from '../constants';
import SectorAnalysisView from './SectorAnalysisView';
import ReportGenerator from './ReportGenerator';
import * as XLSX from 'xlsx';

interface InventoryViewProps {
  assessments: Assessment[];
}

export default function InventoryView({ assessments }: InventoryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'reports'>('table');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [copied, setCopied] = useState(false);

  const exportToExcel = (a: Assessment) => {
    const workbook = XLSX.utils.book_new();

    // 1. Aba Resumo
    const summaryData = [
      ['RELATÓRIO DE AVALIAÇÃO PSICOSSOCIAL - CONEXA RISK'],
      ['Unidade:', a.unitId],
      ['Data:', new Date(a.updatedAt || '').toLocaleDateString()],
      ['Status:', 'CONCLUÍDO'],
      [''],
      ['SCORES GERAIS'],
      ['Triangulação:', a.triangulationScore?.toFixed(3)],
      ['Risco Calculado:', a.riskScore],
      ['Nível:', a.riskScore >= 17 ? 'CRÍTICO' : a.riskScore >= 10 ? 'ALTO' : a.riskScore >= 6 ? 'MODERADO' : 'BAIXO']
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Resumo");

    // 2. Aba Inventário por Setor
    const inventory: any[] = [['SETOR', 'FATOR DE RISCO', 'DESCRIÇÃO DO PERIGO', 'DANOS POSSÍVEIS']];
    
    // Global
    const globalCritical = a.domains.filter(d => d.employeeMean >= 3.0);
    globalCritical.forEach(cd => {
      HAZARD_MASTER.filter(h => h.domainId === cd.id).forEach(h => {
        inventory.push(['GERAL (EMPRESA)', h.hazard, h.risk, h.possibleDamages]);
      });
    });

    // Setores
    if (a.sectorBreakdown) {
      Object.entries(a.sectorBreakdown).forEach(([sName, sData]) => {
        const sCritical = sData.domains.filter(d => d.employeeMean >= 3.0);
        sCritical.forEach(cd => {
          HAZARD_MASTER.filter(h => h.domainId === cd.id).forEach(h => {
            inventory.push([sName, h.hazard, h.risk, h.possibleDamages]);
          });
        });
      });
    }
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(inventory), "Inventário PGR");

    XLSX.writeFile(workbook, `Relatorio_Conexa_${a.unitId.replace(/\s+/g, '_')}.xlsx`);
  };

  // Expande cada avaliação em linhas de perigos específicos, incluindo quebras por setor se houver
  const inventoryRows = assessments.flatMap(a => {
    const views = [{ 
      id: 'Geral', 
      label: 'Geral', 
      domains: a.domains, 
      riskScore: a.riskScore,
      probability: a.probability,
      severity: a.severity,
      gesId: a.gesId
    }];

    if (a.sectorBreakdown) {
      Object.entries(a.sectorBreakdown).forEach(([sName, sData]) => {
        views.push({
          id: sName,
          label: sName,
          domains: sData.domains,
          riskScore: sData.riskScore || a.riskScore,
          probability: sData.probability || a.probability,
          severity: sData.severity || a.severity,
          gesId: a.gesId
        });
      });
    }

    return views.flatMap(v => {
      if (v.riskScore < 6) return [];
      const criticalDomains = v.domains.filter(d => d.employeeMean >= 2.0);
      const hazards: typeof HAZARD_MASTER = [];
      criticalDomains.forEach(cd => {
        const relatedHazards = HAZARD_MASTER.filter(h => h.domainId === cd.id);
        hazards.push(...relatedHazards);
      });

      if (hazards.length === 0) {
        hazards.push({
          id: 'generic',
          domainId: 'generic',
          hazard: 'Fatores Psicossociais Inespecíficos',
          risk: 'Exposição a riscos psicossociais gerais identificados via triangulação.',
          possibleDamages: 'Estresse, ansiedade, queda de produtividade.',
          recommendation: 'Realizar investigação aprofundada dos fatores psicossociais identificados e implementar plano de ação preventivo.'
        });
      }

      return hazards.map(h => ({
        unitId: a.unitId,
        sectorId: v.label,
        gesId: v.gesId,
        probability: v.probability,
        severity: v.severity,
        riskScore: v.riskScore,
        hazard: h,
        assessmentId: a.id
      }));
    });
  });

  const getRiskColorClass = (riskValue: number) => {
    if (riskValue >= 20) return 'bg-rose-500 text-white';
    if (riskValue >= 15) return 'bg-orange-400 text-white';
    if (riskValue >= 6) return 'bg-amber-200 text-amber-900';
    return 'bg-emerald-100 text-emerald-800';
  };

  const getRiskLabel = (riskValue: number) => {
    if (riskValue >= 20) return 'CRÍTICO';
    if (riskValue >= 15) return 'ALTO';
    if (riskValue >= 6) return 'MODERADO';
    return 'BAIXO';
  };

  const handleCopyPGR = () => {
    navigator.clipboard.writeText("Inventário GRO copiado...");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Se um relatório estiver selecionado, mostra o "espelho"
  if (selectedAssessment) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <button 
            onClick={() => setSelectedAssessment(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <ChevronLeft size={16} /> Voltar para a lista
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={() => exportToExcel(selectedAssessment)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-sm active:scale-95"
            >
              <FileSpreadsheet size={14} /> Exportar Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              <Download size={14} /> Baixar PDF
            </button>
          </div>
        </div>

        <div id="printable-report" className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100 flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-black tracking-tight italic uppercase">Relatório Salvo</h2>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">
                Visualização de auditoria: {selectedAssessment.unitId} • Finalizado em {new Date(selectedAssessment.updatedAt || '').toLocaleDateString()}
              </p>
           </div>
           <div className="bg-white/20 px-4 py-2 rounded-lg border border-white/30">
              <span className="text-[10px] font-black uppercase tracking-widest">Status: CONCLUÍDO</span>
           </div>
        </div>

        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-sm">01</div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Análise Setorial (Tabulação)</h3>
            </div>
            <SectorAnalysisView 
              assessment={selectedAssessment}
              managerOverallMeanGlobal={selectedAssessment.managerOverallMean || 0}
              checklistCriticalityGlobal={((selectedAssessment.checklist?.nonConforming || 0) * 1 + (selectedAssessment.checklist?.partial || 0) * 0.5) / 
                Math.max(1, (selectedAssessment.checklist?.conforming || 0) + (selectedAssessment.checklist?.partial || 0) + (selectedAssessment.checklist?.nonConforming || 0))}
              defaultExpandedAll={true}
            />
          </section>

          <section className="pt-6 border-t border-slate-100">
             <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-sm">02</div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Relatório PGR Detalhado</h3>
            </div>
            <ReportGenerator 
              assessment={selectedAssessment}
              checklistCriticality={((selectedAssessment.checklist?.nonConforming || 0) * 1 + (selectedAssessment.checklist?.partial || 0) * 0.5) / 
                Math.max(1, (selectedAssessment.checklist?.conforming || 0) + (selectedAssessment.checklist?.partial || 0) + (selectedAssessment.checklist?.nonConforming || 0))}
              employeeOverallMean={selectedAssessment.employeeOverallMean || 0}
              managerOverallMean={selectedAssessment.managerOverallMean || 0}
            />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Centro de Conferência</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gestão de Inventários e Relatórios Salvos</p>
         </div>
         
         <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveSubTab('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <TableIcon size={14} /> Tabela GRO
            </button>
            <button 
              onClick={() => setActiveSubTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={14} /> Relatórios Salvos
            </button>
         </div>
      </div>

      {activeSubTab === 'table' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
             <button 
               onClick={handleCopyPGR}
               className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
             >
                {copied ? <Check size={14} /> : <ClipboardCopy size={14} />} 
                {copied ? 'Copiado!' : 'Copiar Tabela PGR'}
             </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden overflow-x-auto">
             <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                   <tr>
                      <th className="px-4 py-4 w-48">Local / Setor / GES</th>
                      <th className="px-4 py-4">Fator de Risco / Perigo</th>
                      <th className="px-4 py-4">Lesões ou Agravos (Danos)</th>
                      <th className="px-4 py-4 text-center">Prob.</th>
                      <th className="px-4 py-4 text-center">Sev.</th>
                      <th className="px-4 py-4 text-center">Nível (Risco)</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {inventoryRows.map((row, idx) => (
                     <tr key={`${row.assessmentId}-${row.sectorId}-${row.hazard.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                           <div className="flex items-center gap-2 mb-1">
                              <MapPin size={10} className="text-blue-600" />
                              <span className="text-[9px] font-black uppercase text-slate-500">{row.unitId || 'Unidade'}</span>
                           </div>
                           <p className="text-xs font-bold text-slate-900 uppercase">Setor {row.sectorId}</p>
                           <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-black text-slate-500 uppercase mt-1 inline-block">{row.gesId}</span>
                        </td>
                        <td className="px-4 py-4 max-w-sm">
                           <p className="text-xs font-black text-slate-800 uppercase leading-tight mb-1">{row.hazard.hazard}</p>
                           <p className="text-[9px] text-slate-500 uppercase tracking-tight leading-relaxed font-medium">
                              {row.hazard.risk}
                           </p>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                           <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                              {row.hazard.possibleDamages}
                           </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                           <span className="font-black text-slate-700">{row.probability}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                           <span className="font-black text-slate-700">{row.severity}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                           <div className={`px-2 py-1.5 rounded flex flex-col items-center justify-center ${getRiskColorClass(row.riskScore)}`}>
                              <span className="text-[10px] font-black uppercase tracking-widest">{getRiskLabel(row.riskScore)}</span>
                              <span className="text-[9px] font-black opacity-80 border-t border-current pt-0.5 mt-0.5 w-full text-center">{row.riskScore}</span>
                           </div>
                        </td>
                     </tr>
                   ))}
                   {inventoryRows.length === 0 && (
                     <tr>
                       <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-xs italic font-medium">
                         Nenhum risco psicossocial moderado ou superior identificado para inventário.
                       </td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>

          <div className="p-5 bg-slate-900 rounded-lg border-l-4 border-blue-600 flex gap-4">
             <ShieldAlert className="text-blue-500 shrink-0" />
             <div>
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Atenção (NR-01 e ISO 45003)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-medium tracking-tight">
                   Este inventário consolida apenas os riscos cujo nível calculado pela triangulação atingiu 
                   status <span className="text-amber-400 font-bold">MODERADO</span> ou superior (Risco &gt;= 6).
                </p>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.filter(a => a.status === 'CONCLUÍDA').map(a => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <FileText size={20} />
                  </div>
                  <span className="text-[8px] font-black px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 uppercase">Concluído</span>
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase mb-1 truncate">{a.unitId}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                  Finalizado: {new Date(a.updatedAt || '').toLocaleDateString()}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                   <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Risco Geral</p>
                      <p className="text-xs font-black text-slate-700">{getRiskLabel(a.riskScore)}</p>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-[8px] text-slate-400 font-black uppercase mb-0.5">Triangulação</p>
                      <p className="text-xs font-black text-slate-700">{a.triangulationScore?.toFixed(3)}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedAssessment(a)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-colors"
                >
                  Abrir Espelho do Relatório <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
          {assessments.filter(a => a.status === 'CONCLUÍDA').length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
               <FileText size={40} className="text-slate-300 mx-auto mb-4" />
               <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Nenhuma avaliação concluída para exibir</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
