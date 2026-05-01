import React, { useState } from 'react';
import {
  LayoutGrid, Users, AlertTriangle, BarChart2, 
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Shield
} from 'lucide-react';
import { Assessment, DomainData } from '../types';
import { HAZARD_MASTER } from '../constants';

interface SectorAnalysisViewProps {
  assessment: Assessment;
  managerOverallMeanGlobal: number;
  checklistCriticalityGlobal: number;
  defaultExpandedAll?: boolean;
}

const RISK_LABEL = (v: number) => v >= 20 ? 'CRÍTICO' : v >= 15 ? 'ALTO' : v >= 6 ? 'MODERADO' : 'BAIXO';
const RISK_COLOR = (v: number) => v >= 20 ? '#ef4444' : v >= 15 ? '#f97316' : v >= 6 ? '#eab308' : '#22c55e';
const RISK_BG   = (v: number) => v >= 20 ? 'bg-rose-100 text-rose-700 border-rose-200' : v >= 15 ? 'bg-orange-100 text-orange-700 border-orange-200' : v >= 6 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';

/**
 * Cálculo de Métricas por Setor (Triangulação 4-3-4)
 * - Eixo 1 (Colaboradores): Média do Setor
 * - Eixo 2 (Gestores): Média Global
 * - Eixo 3 (Checklist): Média Global
 */
function calcSectorMetrics(sectorData: any, managerMeanGlobal: number, checklistCriticalityGlobal: number) {
  const eMean = sectorData.employeeOverallMean || 0;
  
  // 1. Normalização (Escala 1-5 vira 0-1)
  const colabNormalized = eMean > 0 ? (eMean - 1) / 4 : 0;
  const gestorNormalized = managerMeanGlobal > 0 ? (managerMeanGlobal - 1) / 4 : 0;
  const checklistNormalized = checklistCriticalityGlobal;

  // 2. Pesos Metodologia RP
  const pColab = 4;
  const pGestor = 3;
  const pCheck = 4;

  let somaPonderada = 0;
  let somaPesos = 0;

  if (eMean > 0) { somaPonderada += colabNormalized * pColab; somaPesos += pColab; }
  if (managerMeanGlobal > 0) { somaPonderada += gestorNormalized * pGestor; somaPesos += pGestor; }
  
  somaPonderada += checklistNormalized * pCheck;
  somaPesos += pCheck;

  const tScore = somaPesos > 0 ? somaPonderada / somaPesos : 0;
  
  // 3. Escalonamento 1-5 (Conforme Metodologia)
  const val = Math.min(5, Math.max(1, Math.ceil(tScore * 5)));
  
  return { 
    tScore, 
    rScore: val * val, // Risco = Probabilidade (val) x Severidade (val)
    eMean,
    prob: val,
    sev: val
  };
}

function MiniBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function SectorAnalysisView({ assessment, managerOverallMeanGlobal, checklistCriticalityGlobal, defaultExpandedAll }: SectorAnalysisViewProps) {
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'sample'>('risk');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const { sectorBreakdown, triangulationScore, riskScore } = assessment;
  const sectors = Object.entries(sectorBreakdown || {});

  const sorted = [...sectors].sort(([an, ad], [bn, bd]) => {
    const { rScore: ar } = calcSectorMetrics(ad, managerOverallMeanGlobal, checklistCriticalityGlobal);
    const { rScore: br } = calcSectorMetrics(bd, managerOverallMeanGlobal, checklistCriticalityGlobal);
    let cmp = 0;
    if (sortBy === 'risk') cmp = ar - br;
    else if (sortBy === 'sample') cmp = (ad.rowCount || 0) - (bd.rowCount || 0);
    else cmp = an.localeCompare(bn);
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const totalSample = sectors.reduce((a, [, d]) => a + (d.rowCount || 0), 0);

  if (sectors.length === 0) {
    return (
      <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <LayoutGrid size={32} />
        </div>
        <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight mb-2">Nenhum setor analisado ainda</h3>
        <p className="text-sm text-slate-400 font-medium max-w-md mx-auto mb-6">
          Para ver o panorama por setor, vá em <strong>DADOS → Eixo 1</strong>, faça o upload e selecione a coluna Setor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Triangulação Global', value: triangulationScore.toFixed(3), sub: 'Referência Unidade', color: 'text-blue-600' },
          { label: 'Setores Mapeados', value: sectors.length.toString(), sub: 'Departamentos', color: 'text-slate-700' },
          { label: 'Amostra Total', value: totalSample.toString(), sub: 'Participantes', color: 'text-slate-700' },
          { label: 'Status Geral', value: RISK_LABEL(riskScore), sub: `Score ${riskScore}`, color: riskScore >= 15 ? 'text-rose-600' : 'text-emerald-600' }
        ].map(k => (
          <div key={k.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Comparative Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <LayoutGrid size={16} className="text-blue-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Panorama Setorial — Metodologia ConexaRP</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest font-black">
                <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('name')}>Setor {sortBy === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('sample')}>Amostra {sortBy === 'sample' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                <th className="px-4 py-4 text-center">Eixo 1 (Média)</th>
                <th className="px-4 py-4 text-center">Triangulação</th>
                <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('risk')}>Score {sortBy === 'risk' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                <th className="px-4 py-4 text-center">Risco PGR</th>
                <th className="px-4 py-4 text-center">Desvio</th>
                <th className="px-4 py-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="bg-blue-50/40 font-black text-blue-700 text-xs">
                <td className="px-6 py-3 uppercase">Média Geral Unidade</td>
                <td className="px-4 py-3 text-center italic">{totalSample}</td>
                <td className="px-4 py-3 text-center">—</td>
                <td className="px-4 py-3 text-center">{triangulationScore.toFixed(3)}</td>
                <td className="px-4 py-3 text-center">{riskScore}</td>
                <td className="px-4 py-3 text-center"><span className="text-[8px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">REFERÊNCIA</span></td>
                <td className="px-4 py-3 text-center">—</td>
                <td className="px-4 py-3 text-center">—</td>
              </tr>
              {sorted.map(([name, data]) => {
                const { tScore, rScore: rs, eMean } = calcSectorMetrics(data, managerOverallMeanGlobal, checklistCriticalityGlobal);
                const diff = tScore - triangulationScore;
                const isOpen = defaultExpandedAll || expandedSector === name;
                const criticalDomains = (data.domains || []).filter((d: DomainData) => d.employeeMean >= 3.0);
                return (
                  <React.Fragment key={name}>
                    <tr className={`hover:bg-slate-50 transition-colors ${isOpen ? 'bg-slate-50' : ''}`}>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{name}</td>
                      <td className="px-4 py-4 text-center"><span className="font-black text-slate-700">{data.rowCount || 0}</span></td>
                      <td className="px-4 py-4 text-center font-bold text-slate-600">{eMean > 0 ? eMean.toFixed(2) : '—'}</td>
                      <td className="px-4 py-4 text-center font-bold text-slate-900">{tScore.toFixed(3)}</td>
                      <td className="px-4 py-4 text-center font-black text-slate-900">{rs.toFixed(0)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[8px] font-black px-2 py-1 rounded-full border ${RISK_BG(rs)}`}>{RISK_LABEL(rs)}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {Math.abs(diff) < 0.005 
                          ? <span className="text-slate-400"><Minus size={14} className="mx-auto" /></span>
                          : diff > 0 
                            ? <span className="text-rose-500 font-black text-[9px] flex items-center justify-center gap-1"><TrendingUp size={12}/> +{diff.toFixed(3)}</span>
                            : <span className="text-emerald-600 font-black text-[9px] flex items-center justify-center gap-1"><TrendingDown size={12}/> {diff.toFixed(3)}</span>
                        }
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => setExpandedSector(isOpen ? null : name)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500 transition-all">
                          {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="bg-slate-50/80 border-y border-slate-100 px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <BarChart2 size={12} className="text-blue-500" /> Perfil de Domínios — {name}
                              </p>
                              <div className="space-y-3">
                                {(data.domains || []).map((d: DomainData) => (
                                  <div key={d.id}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[9px] font-bold text-slate-600 truncate">{d.name}</span>
                                      <span className={`text-[9px] font-black ${d.employeeMean >= 3.5 ? 'text-rose-600' : d.employeeMean >= 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {d.employeeMean > 0 ? d.employeeMean.toFixed(2) : '—'}
                                      </span>
                                    </div>
                                    <MiniBar value={d.employeeMean} max={5} color={d.employeeMean >= 3.5 ? '#ef4444' : d.employeeMean >= 2.5 ? '#f59e0b' : '#22c55e'} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertTriangle size={12} className="text-rose-500" /> Alertas de Risco do Setor
                              </p>
                              <div className="space-y-2">
                                {criticalDomains.length > 0 ? (
                                  criticalDomains.map((cd: DomainData, i: number) => (
                                    <div key={i} className="bg-white border-l-4 border-l-rose-500 border border-slate-200 rounded-r-lg p-3">
                                      <p className="text-[9px] font-black text-rose-700 uppercase">{cd.name}</p>
                                      <p className="text-[8px] text-slate-500 mt-1">Domínio crítico com média {cd.employeeMean.toFixed(2)}. Requer ação prioritária.</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
                                    <Shield size={24} className="text-emerald-400 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-emerald-700 uppercase">Riscos Sob Controle</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
