import React, { useState } from 'react';
import {
  LayoutGrid, Users, AlertTriangle, BarChart2, 
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Shield
} from 'lucide-react';
import { Assessment, DomainData } from '../types';
import { HAZARD_MASTER, DOMAINS } from '../constants';

interface SectorAnalysisViewProps {
  assessment: Assessment;
  managerOverallMeanGlobal: number;
  checklistCriticalityGlobal: number;
}

const RISK_LABEL = (v: number) => v >= 17 ? 'CRÍTICO' : v >= 10 ? 'ALTO' : v >= 6 ? 'MODERADO' : 'BAIXO';
const RISK_COLOR = (v: number) => v >= 17 ? '#ef4444' : v >= 10 ? '#f97316' : v >= 6 ? '#eab308' : '#22c55e';
const RISK_BG   = (v: number) => v >= 17 ? 'bg-rose-100 text-rose-700 border-rose-200' : v >= 10 ? 'bg-orange-100 text-orange-700 border-orange-200' : v >= 6 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';

function calcMetrics(data: any, mMean: number, checkScore: number) {
  const eMean = data.employeeOverallMean || 0;
  const colabScore = eMean > 0 ? (eMean - 1) / 4 : 0;
  const gestorScore = mMean > 0 ? (mMean - 1) / 4 : 0;
  let ws = 0, wt = 0;
  if (eMean > 0) { ws += colabScore * 4; wt += 4; }
  if (mMean > 0) { ws += gestorScore * 3; wt += 3; }
  ws += checkScore * 4; wt += 4;
  const tScore = wt > 0 ? ws / wt : 0;
  const prob = Math.min(5, Math.max(1, Math.ceil(tScore * 5)));
  return { tScore, rScore: prob * prob, eMean };
}

function MiniBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function SectorAnalysisView({ assessment, managerOverallMeanGlobal, checklistCriticalityGlobal }: SectorAnalysisViewProps) {
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'sample'>('risk');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { sectorBreakdown, triangulationScore, riskScore } = assessment;
  const sectors = Object.entries(sectorBreakdown || {});

  const sorted = [...sectors].sort(([an, ad], [bn, bd]) => {
    const { rScore: ar } = calcMetrics(ad, managerOverallMeanGlobal, checklistCriticalityGlobal);
    const { rScore: br } = calcMetrics(bd, managerOverallMeanGlobal, checklistCriticalityGlobal);
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

  // No sectors yet
  if (sectors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <LayoutGrid size={32} />
        </div>
        <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight mb-2">Nenhum setor analisado ainda</h3>
        <p className="text-sm text-slate-400 font-medium max-w-md mx-auto mb-6">
          Para ver o panorama por setor, vá em <strong>DADOS → Eixo 1: Colaboradores</strong>, faça o upload do arquivo e selecione a coluna que identifica o setor de cada colaborador.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left max-w-sm mx-auto">
          <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Formato esperado do arquivo:</p>
          <div className="font-mono text-[10px] text-blue-800 space-y-1">
            <div>Nome | <strong>Setor</strong> | Q1 | Q2 | ... | Q15</div>
            <div>João Silva | <strong>Açougue</strong> | 4 | 3 | ... | 2</div>
            <div>Maria Lima | <strong>Administração</strong> | 2 | 1 | ... | 3</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Média Global', value: triangulationScore.toFixed(3), sub: 'Referência empresa', color: 'text-blue-600' },
          { label: 'Setores Analisados', value: sectors.length.toString(), sub: 'Departamentos', color: 'text-slate-700' },
          { label: 'Respostas Totais', value: totalSample.toString(), sub: 'Colaboradores mapeados', color: 'text-slate-700' },
          { label: 'Risco Geral', value: RISK_LABEL(riskScore), sub: `Score ${riskScore}`, color: riskScore >= 10 ? 'text-rose-600' : 'text-emerald-600' }
        ].map(k => (
          <div key={k.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Tabela Comparativa — Panorama por Setor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/40 border-b border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest font-black">
                <th className="px-6 py-4 cursor-pointer hover:text-slate-600" onClick={() => handleSort('name')}>
                  Setor {sortBy === 'name' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="px-4 py-4 text-center cursor-pointer hover:text-slate-600" onClick={() => handleSort('sample')}>
                  Respostas {sortBy === 'sample' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="px-4 py-4 text-center">Média Colab.</th>
                <th className="px-4 py-4 text-center">Convergência</th>
                <th className="px-4 py-4 text-center cursor-pointer hover:text-slate-600" onClick={() => handleSort('risk')}>
                  Score Risco {sortBy === 'risk' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="px-4 py-4 text-center">Status PGR</th>
                <th className="px-4 py-4 text-center">vs. Global</th>
                <th className="px-4 py-4 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {/* Global reference row */}
              <tr className="bg-blue-50/40 font-black text-blue-700 text-xs">
                <td className="px-6 py-3 uppercase">Média Geral (Empresa)</td>
                <td className="px-4 py-3 text-center italic text-blue-500">TOTAL</td>
                <td className="px-4 py-3 text-center">—</td>
                <td className="px-4 py-3 text-center">{triangulationScore.toFixed(3)}</td>
                <td className="px-4 py-3 text-center">{riskScore}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-[8px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full uppercase border border-blue-200">Referência</span>
                </td>
                <td className="px-4 py-3 text-center text-slate-400">—</td>
                <td className="px-4 py-3 text-center">—</td>
              </tr>
              {sorted.map(([name, data]) => {
                const { tScore, rScore: rs, eMean } = calcMetrics(data, managerOverallMeanGlobal, checklistCriticalityGlobal);
                const diff = tScore - triangulationScore;
                const isOpen = expandedSector === name;
                const criticalDomains = (data.domains || []).filter((d: DomainData) => d.employeeMean >= 3.0);
                return (
                  <React.Fragment key={name}>
                    <tr className={`hover:bg-slate-50 transition-colors ${isOpen ? 'bg-slate-50' : ''}`}>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{name}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-black text-slate-700">{data.rowCount || 0}</span>
                        <span className="text-[9px] text-slate-400 ml-1">{totalSample > 0 ? Math.round(((data.rowCount||0)/totalSample)*100) : 0}%</span>
                      </td>
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
                        <button onClick={() => setExpandedSector(isOpen ? null : name)}
                          className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all">
                          {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="bg-slate-50/80 border-y border-slate-100 px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Domain bar chart */}
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <BarChart2 size={10} className="text-blue-500" /> Resultado por Domínio — {name}
                              </p>
                              <div className="space-y-2">
                                {(data.domains || []).map((d: DomainData) => (
                                  <div key={d.id}>
                                    <div className="flex justify-between items-center mb-0.5">
                                      <span className="text-[9px] font-bold text-slate-600 truncate max-w-[180px]">{d.name}</span>
                                      <span className={`text-[9px] font-black ${d.employeeMean >= 3.5 ? 'text-rose-600' : d.employeeMean >= 2.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {d.employeeMean > 0 ? d.employeeMean.toFixed(2) : '—'}
                                      </span>
                                    </div>
                                    <MiniBar value={d.employeeMean} max={5} color={d.employeeMean >= 3.5 ? '#ef4444' : d.employeeMean >= 2.5 ? '#f59e0b' : '#22c55e'} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Critical hazards */}
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <AlertTriangle size={10} className="text-rose-500" /> Fatores Críticos Identificados
                              </p>
                              {criticalDomains.length > 0 ? (
                                <div className="space-y-2">
                                  {criticalDomains.flatMap((cd: DomainData) => HAZARD_MASTER.filter(h => h.domainId === cd.id)).slice(0, 4).map((h, i) => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-lg p-3">
                                      <p className="text-[9px] font-black text-rose-700 uppercase mb-1">{h.hazard}</p>
                                      <p className="text-[8px] text-slate-500 leading-relaxed">{h.possibleDamages}</p>
                                    </div>
                                  ))}
                                  {criticalDomains.flatMap((cd: DomainData) => HAZARD_MASTER.filter(h => h.domainId === cd.id)).length === 0 && (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                                      <Shield size={16} className="text-emerald-400 mx-auto mb-1" />
                                      <p className="text-[9px] font-bold text-emerald-600">Nenhum fator crítico mapeado</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                                  <Shield size={20} className="text-emerald-400 mx-auto mb-2" />
                                  <p className="text-[10px] font-black text-emerald-700 uppercase">Riscos Sob Controle</p>
                                  <p className="text-[8px] text-emerald-500 mt-1">Nenhum domínio com média ≥ 3.0</p>
                                </div>
                              )}
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

      {/* Bar chart — sector comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={16} className="text-blue-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Gráfico Comparativo — Score de Risco por Setor</h3>
        </div>
        <div className="space-y-3">
          {sorted.map(([name, data]) => {
            const { rScore: rs } = calcMetrics(data, managerOverallMeanGlobal, checklistCriticalityGlobal);
            const pct = Math.min(100, (rs / 25) * 100);
            return (
              <div key={name} className="flex items-center gap-4">
                <span className="text-[9px] font-black text-slate-600 uppercase w-32 shrink-0 truncate">{name}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className="h-5 rounded-full flex items-center px-2 transition-all duration-500"
                    style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: RISK_COLOR(rs) }}>
                    <span className="text-[8px] font-black text-white">{rs.toFixed(0)}</span>
                  </div>
                </div>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${RISK_BG(rs)} w-20 text-center shrink-0`}>{RISK_LABEL(rs)}</span>
              </div>
            );
          })}
          {/* Global reference */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
            <span className="text-[9px] font-black text-blue-600 uppercase w-32 shrink-0">Média Global</span>
            <div className="flex-1 bg-blue-50 rounded-full h-5 overflow-hidden border-2 border-blue-200">
              <div className="h-5 rounded-full bg-blue-400 flex items-center px-2"
                style={{ width: `${Math.max(Math.min(100,(riskScore/25)*100),8)}%` }}>
                <span className="text-[8px] font-black text-white">{riskScore}</span>
              </div>
            </div>
            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-blue-100 text-blue-700 border-blue-200 w-20 text-center shrink-0">Referência</span>
          </div>
        </div>
        <p className="text-[8px] text-slate-400 font-medium italic mt-4">* Score calculado conforme Metodologia Conexa Risk: Colaboradores (Setorial) × Peso 4 + Gestores (Global) × Peso 3 + Checklist (Global) × Peso 4</p>
      </div>
    </div>
  );
}
