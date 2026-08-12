// src/components/InventoryView.tsx
import React, { useState, useEffect } from 'react';
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
import { Assessment, Company, MatrixColor } from '../types';
import { HAZARD_MASTER } from '../constants';
import SectorAnalysisView from './SectorAnalysisView';
import ReportGenerator from './ReportGenerator';
import * as XLSX from 'xlsx';

interface InventoryViewProps {
  assessments: Assessment[];
  companies: Company[];
  selectedCompanyId?: string | null;
}

export default function InventoryView({ assessments, companies, selectedCompanyId }: InventoryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'table' | 'reports'>('table');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(() => {
    if (selectedCompanyId && assessments && assessments.length > 0) {
      const match = assessments.find(a => a.companyId === selectedCompanyId);
      if (match) return match;
    }
    return null;
  });
  const [copied, setCopied] = useState(false);

  // Auto-seleciona a avaliação quando selectedCompanyId muda (ex: botão "Visualizar Relatório" na aba Pesquisas)
  useEffect(() => {
    if (selectedCompanyId && assessments && assessments.length > 0) {
      const match = assessments.find(a => a.companyId === selectedCompanyId);
      if (match) {
        setSelectedAssessment(match);
      }
    }
  }, [selectedCompanyId, assessments]);

  const exportToExcel = (a: Assessment) => {
    const workbook = XLSX.utils.book_new();

    // 1. Aba Resumo
    const summaryData = [
      ['RELATÓRIO DE AVALIAÇÃO PSICOSSOCIAL - METODOLOGIA RP'],
      ['Unidade:', a.unitId || 'Matriz'],
      ['Data:', new Date(a.updatedAt || a.createdAt || Date.now()).toLocaleDateString('pt-BR')],
      ['Status:', 'CONCLUÍDO'],
      [''],
      ['SCORES GERAIS'],
      ['Triangulação:', a.triangulationScore?.toFixed(3)],
      ['Risco Calculado:', a.riskScore],
      ['Nível:', a.riskScore >= 17 ? 'CRÍTICO' : a.riskScore >= 10 ? 'ALTO' : a.riskScore >= 6 ? 'MODERADO' : 'BAIXO']
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), "Resumo");

    // 2. Aba Inventário de Riscos PGR
    const inventory: any[] = [['UNIDADE', 'SETOR', 'PERIGO', 'RISCO (DESCRIÇÃO)', 'DANOS / AGRAVOS']];

    const uName = a.unitId || 'MATRIZ';

    const globalDomains = a.domains || [];
    const isDomainRelevant = (d: any) => {
      const empMean = d.employeeMean || 0;
      const globalDomain = globalDomains.find(gd => gd.id === d.id);
      const mgrMean = (d.managerMean && d.managerMean > 0) ? d.managerMean : (globalDomain?.managerMean || 0);

      const isCritical = empMean >= 3.0;
      const hasDivergence = empMean > 0 && mgrMean > 0 && Math.abs(empMean - mgrMean) >= 1.0;

      return isCritical || hasDivergence;
    };

    if (a.unitBreakdown && Object.keys(a.unitBreakdown).length > 0) {
      Object.entries(a.unitBreakdown).forEach(([unitKey, uData]) => {
        const sectors = uData.sectors || {};
        Object.entries(sectors).forEach(([sName, sData]) => {
          const relevantDomains = (sData.domains || []).filter(isDomainRelevant);
          relevantDomains.forEach(d => {
            const hazards = HAZARD_MASTER.filter(h => h.domainId === d.id);
            hazards.forEach(h => {
              inventory.push([unitKey, sName, h.hazard, h.risk, h.possibleDamages]);
            });
          });
        });
      });
    } else if (a.sectorBreakdown && Object.keys(a.sectorBreakdown).length > 0) {
      Object.entries(a.sectorBreakdown).forEach(([sName, sData]) => {
        const relevantDomains = (sData.domains || []).filter(isDomainRelevant);
        relevantDomains.forEach(d => {
          const hazards = HAZARD_MASTER.filter(h => h.domainId === d.id);
          hazards.forEach(h => {
            inventory.push([uName, sName, h.hazard, h.risk, h.possibleDamages]);
          });
        });
      });
    } else {
      const sName = 'GERAL (EMPRESA)';
      const relevantDomains = (a.domains || []).filter(isDomainRelevant);
      relevantDomains.forEach(d => {
        const hazards = HAZARD_MASTER.filter(h => h.domainId === d.id);
        hazards.forEach(h => {
          inventory.push([uName, sName, h.hazard, h.risk, h.possibleDamages]);
        });
      });
    }

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(inventory), "Inventário PGR");

    const safeName = (a.unitId || 'Matriz').replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Relatorio_Conexa_${safeName}.xlsx`);
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
        unitId: a.unitId || 'Matriz',
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

  const [showPdfDropdown, setShowPdfDropdown] = useState(false);

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    const unitName = selectedAssessment?.unitId ? String(selectedAssessment.unitId).replace(/\s+/g, '_') : 'Matriz';
    document.title = `Relatorio_Conexa_${unitName}_Completo`;
    window.print();
    document.title = originalTitle;
  };

  const formatDateStr = (dateVal?: string) => {
    if (!dateVal) return new Date().toLocaleDateString('pt-BR');
    const parsed = new Date(dateVal);
    if (isNaN(parsed.getTime())) return new Date().toLocaleDateString('pt-BR');
    return parsed.toLocaleDateString('pt-BR');
  };

  // Se um relatório estiver selecionado, mostra o "espelho" do relatório executivo final
  if (selectedAssessment) {
    return (
      <div className="space-y-6" id="pdf-export-container">
        <div className="flex justify-between items-center no-print" data-html2canvas-ignore="true">
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
              onClick={handleDownloadPdf}
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
                Visualização de auditoria: {selectedAssessment.unitId || 'Matriz'} • Finalizado em {formatDateStr(selectedAssessment.updatedAt || selectedAssessment.createdAt)}
              </p>
           </div>
           <div className="bg-white/20 px-4 py-2 rounded-lg border border-white/30">
              <span className="text-[10px] font-black uppercase tracking-widest">Status: CONCLUÍDO</span>
           </div>
        </div>

        <div className="space-y-12">
          <section id="pdf-section-1">
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

          <section id="pdf-section-2" className="pt-6 border-t border-slate-100">
             <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-sm">02</div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Relatório PGR Detalhado</h3>
            </div>
            <ReportGenerator 
              assessment={selectedAssessment}
              companyName={companies.find(c => c.id === selectedAssessment.companyId)?.name}
              unitName={selectedAssessment.unitId || 'Matriz'}
              checklistCriticality={((selectedAssessment.checklist?.nonConforming || 0) * 1 + (selectedAssessment.checklist?.partial || 0) * 0.5) / 
                Math.max(1, (selectedAssessment.checklist?.conforming || 0) + (selectedAssessment.checklist?.partial || 0) + (selectedAssessment.checklist?.nonConforming || 0))}
              employeeOverallMean={selectedAssessment.employeeOverallMean || 0}
              managerOverallMean={selectedAssessment.managerOverallMean || 0}
              onConclude={() => {}}
            />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header do Módulo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Inventário de Riscos GRO / PGR</h2>
          <p className="text-slate-500 text-xs font-medium mt-1">Consolidação automática dos fatores de risco psicossociais alinhados à NR-01.</p>
        </div>
        
        {/* Toggle de Visualização de Sub-abas */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'table' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TableIcon size={14} /> Tabela GRO/PGR
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'reports' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText size={14} /> Relatórios Salvos ({assessments.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'reports' ? (
        /* VISUALIZAÇÃO DOS RELATÓRIOS SALVOS EM GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((a) => {
            const comp = companies.find(c => c.id === a.companyId);
            return (
              <div 
                key={a.id} 
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-[9px] uppercase tracking-wider rounded-lg border border-blue-100">
                      {comp?.name || 'Empresa'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {formatDateStr(a.updatedAt || a.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 uppercase text-sm group-hover:text-blue-600 transition-colors">
                      {a.unitId || 'Matriz'}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                      Score de Risco: <strong className="text-slate-700">{a.riskScore}</strong> ({getRiskLabel(a.riskScore)})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAssessment(a)}
                  className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 hover:border-blue-600"
                >
                  Visualizar Espelho <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO TABULAR DO INVENTÁRIO GRO/PGR */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Exibindo <strong className="text-slate-900">{inventoryRows.length}</strong> Perigos Mapeados
            </span>
            <button
              onClick={handleCopyPGR}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs transition-all"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <ClipboardCopy size={14} />}
              {copied ? 'Copiado!' : 'Copiar para PGR'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Unidade / Setor</th>
                  <th className="py-3 px-4">Fator de Risco (Perigo)</th>
                  <th className="py-3 px-4">Possíveis Danos</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Classificação</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {inventoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      Nenhum risco crítico encontrado nas avaliações atuais.
                    </td>
                  </tr>
                ) : (
                  inventoryRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">{row.unitId}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{row.sectorId}</div>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{row.hazard.hazard}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{row.hazard.risk}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 max-w-xs text-[11px]">
                        {row.hazard.possibleDamages}
                      </td>
                      <td className="py-4 px-4 text-center font-black text-slate-900">
                        {row.riskScore}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getRiskColorClass(row.riskScore)}`}>
                          {getRiskLabel(row.riskScore)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            const target = assessments.find(a => a.id === row.assessmentId);
                            if (target) setSelectedAssessment(target);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Ver relatório completo"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
