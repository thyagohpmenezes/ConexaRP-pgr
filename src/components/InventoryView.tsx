import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Search,
  Filter,
  ArrowRight,
  ClipboardCopy,
  Check
} from 'lucide-react';
import { Assessment, MatrixColor } from '../types';
import { HAZARD_MASTER } from '../constants';

interface InventoryViewProps {
  assessments: Assessment[];
}

export default function InventoryView({ assessments }: InventoryViewProps) {
  const [copied, setCopied] = useState(false);

  // Expande cada avaliação em linhas de perigos específicos, incluindo quebras por setor se houver
  const inventoryRows = assessments.flatMap(a => {
    // Lista de visões para processar: Geral + Setores se houver
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
          riskScore: sData.riskScore || a.riskScore, // Fallback pro global se não triangulado individualmente
          probability: sData.probability || a.probability,
          severity: sData.severity || a.severity,
          gesId: a.gesId
        });
      });
    }

    return views.flatMap(v => {
      // Filtrar apenas se o risco dessa visão for >= 6
      if (v.riskScore < 6) return [];

      // Pegar domínios que tiveram employeeMean >= 2.0 (acima de Baixo Risco)
      const criticalDomains = v.domains.filter(d => d.employeeMean >= 2.0);
      
      // Mapear esses domínios para os perigos do HAZARD_MASTER
      const hazards: typeof HAZARD_MASTER = [];
      criticalDomains.forEach(cd => {
        const relatedHazards = HAZARD_MASTER.filter(h => h.domainId === cd.id);
        hazards.push(...relatedHazards);
      });

      // Se nenhum domínio se destacou mas o risco global deu alto, usa um genérico
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
        hazard: h
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
    // In a real app, this would format the table as CSV or formatted text
    navigator.clipboard.writeText("Inventário GRO copiado...");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Inventário de Riscos (PGR)</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Modelo de exportação formatado</p>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={handleCopyPGR}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
               {copied ? <Check size={14} /> : <ClipboardCopy size={14} />} 
               {copied ? 'Copiado!' : 'Copiar Tabela PGR'}
            </button>
         </div>
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
                 <tr key={`${row.unitId}-${row.sectorId}-${row.hazard.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
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
  );
}
