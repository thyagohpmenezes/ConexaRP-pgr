import React, { useState } from 'react';
import { Users, UserCircle2, AlertCircle, Upload, CheckCircle2, ArrowRight, ArrowLeft, Database, FolderTree, Table as TableIcon, RefreshCw, Eye, EyeOff, BarChart2, RefreshCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { DomainData, ChecklistData } from '../types';
import { DOMAINS, EMPLOYEE_POSITIVE_ITEMS, MANAGER_POSITIVE_ITEMS } from '../constants';

interface SurveyInputProps {
  domains: DomainData[];
  setDomains: (d: DomainData[]) => void;
  checklist: ChecklistData;
  setChecklist: (d: ChecklistData) => void;
  overallMeanEmployee: number;
  overallMeanManager: number;
  sectorBreakdown?: Record<string, import('../types').SectorAssessment>;
  setSectorBreakdown: (d: Record<string, import('../types').SectorAssessment>) => void;
  unitBreakdown?: Record<string, import('../types').UnitAssessment>;
  setUnitBreakdown?: (d: Record<string, import('../types').UnitAssessment>) => void;
  onNewSectors?: (names: string[]) => void;
  onNewUnits?: (names: string[]) => void;
  onComplete?: (domains: DomainData[], units: Record<string, import('../types').UnitAssessment>) => void;
}

type ViewState = 'OVERVIEW' | 'PROCESS_AXIS' | 'BATCH_UPLOAD' | 'DONE_VIEW';
type Step = 'UPLOAD' | 'MAPPING' | 'DONE';

interface FileState {
  file: File | null;
  fileName?: string; // Nome persistível para exibição após remontagem
  data: any[];
  columns: string[];
  mapping: Record<string, string>;
  status: 'empty' | 'loaded' | 'error';
}

// Columns to exclude from question detection
const EXCLUDE = ['nome','name','email','cpf','matrícula','matricula','data','date','timestamp','setor',
  'departamento','área','area','unidade','local','cargo','função','funcao','equipe','turno','ges','ghe',
  'filial','loja','regional','empresa','cnpj','id','grupo','divisão','divisao','posto','célula','celula',
  'resposta','respondente','funcionario','funcionário'];

function isLikelyLikert(col: string, rows: any[]): boolean {
  const lower = col.toLowerCase().trim();
  if (EXCLUDE.some(e => lower.includes(e))) return false;
  let ok = 0; let total = 0;
  rows.slice(0, 30).forEach((r: any) => {
    const v = r[col];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      total++;
      const n = parseFloat(String(v).replace(/[^0-9.,]/g,'').replace(',','.'));
      if (!isNaN(n) && n >= 1 && n <= 5) ok++;
    }
  });
  return total >= 3 && ok / total >= 0.6;
}

function autoDetect(cols: string[], rows: any[], type: 'employee'|'manager'|'checklist') {
  const map: Record<string,string> = {};
  if (type === 'checklist') {
    for (let i = 1; i <= 15; i++) {
      const f = cols.find(c => {
        const l = c.toLowerCase();
        return l.includes('item ' + i) || l.includes('c' + i) || l === String(i) || l === '0'+i;
      });
      if (f) map['c'+i] = f;
    }
    return map;
  }
  // 1st pass: pattern matching
  const used = new Set<string>();
  for (let i = 1; i <= 15; i++) {
    const f = cols.find(c => {
      if (used.has(c)) return false;
      const l = c.toLowerCase().trim();
      return l === String(i) || l === '0'+i || l === i+'.' ||
        l === 'q'+i || l === 'p'+i ||
        l.includes('item '+i) || l.includes('item'+i) ||
        l.includes('pergunta '+i) || l.includes('pergunta'+i) ||
        l.includes('questão '+i) || l.includes('questao '+i);
    });
    if (f) { map[String(i)] = f; used.add(f); }
  }
  // 2nd pass: heuristic for Likert scale columns
  const found = Object.keys(map).filter(k => !isNaN(Number(k))).length;
  if (found < 8) {
    const likertCols = cols.filter(c => !used.has(c) && isLikelyLikert(c, rows));
    console.log('[ConexaRP] Heuristic Likert cols:', likertCols);
    let qi = 1;
    for (const c of likertCols) {
      while (map[String(qi)] && qi <= 15) qi++;
      if (qi > 15) break;
      map[String(qi)] = c; used.add(c); qi++;
    }
  }
  // Sector detection
  const UNIT_P = ['unidade','filial','regional','loja','unid','un.'];
  const SECTOR_P = ['setor','departamento','área','area','seção','secao','dept','equipe','turno','cargo','função','funcao','ghe','ges','grupo','posto','célula','celula','divisão','divisao'];
  
  const uCol = cols.find(c => { const l=c.toLowerCase().trim(); return UNIT_P.some(p=>l.includes(p)); });
  if (uCol) map['unit'] = uCol;

  const sCol = cols.find(c => { 
    const l=c.toLowerCase().trim(); 
    return SECTOR_P.some(p=>l.includes(p)) && c !== uCol; 
  });
  if (sCol) map['sector'] = sCol;

  console.log('[ConexaRP] autoDetect result:', map);
  return map;
}



export default function SurveyInput({ domains, setDomains, checklist, setChecklist, overallMeanEmployee, overallMeanManager, sectorBreakdown = {}, setSectorBreakdown, unitBreakdown = {}, setUnitBreakdown, onNewSectors, onNewUnits, onComplete }: SurveyInputProps) {
  const [view, setView] = useState<ViewState>('BATCH_UPLOAD');
  const [step, setStep] = useState<Step>('UPLOAD');
  const [processing, setProcessing] = useState(false);

  // Estado dos arquivos persistido no localStorage.
  // O objeto File não pode ser serializado, mas os dados parseados (data, columns, mapping) podem.
  // Isso garante que os arquivos carregados sobrevivam à troca de abas ou remontagem do componente.
  const STORAGE_KEY = 'conexarp_batch_files';

  const emptyFileState = (): FileState => ({ file: null, data: [], columns: [], mapping: {}, status: 'empty' });

  const [files, setFilesRaw] = useState<Record<'employee' | 'manager' | 'checklist', FileState>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restaura dados mas file object fica null (não é serializável)
        return {
          employee:  { ...emptyFileState(), ...parsed.employee,  file: null },
          manager:   { ...emptyFileState(), ...parsed.manager,   file: null },
          checklist: { ...emptyFileState(), ...parsed.checklist, file: null },
        };
      }
    } catch {}
    return {
      employee:  emptyFileState(),
      manager:   emptyFileState(),
      checklist: emptyFileState(),
    };
  });

  // Persiste no localStorage sempre que os arquivos mudarem
  const setFiles = (updater: React.SetStateAction<Record<'employee' | 'manager' | 'checklist', FileState>>) => {
    setFilesRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        // Salva tudo exceto o objeto File (não serializável)
        const toStore = {
          employee:  { ...next.employee,  file: null },
          manager:   { ...next.manager,   file: null },
          checklist: { ...next.checklist, file: null },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch {}
      return next;
    });
  };

  // Limpa o cache de arquivos quando o processamento for concluído
  const clearFileCache = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const updateMapping = (type: 'employee'|'manager'|'checklist', field: string, col: string) => {
    setFiles(prev => ({
      ...prev,
      [type]: {
         ...prev[type],
         mapping: { ...prev[type].mapping, [field]: col }
      }
    }));
  };

  const isDoneEmployee = domains.length > 0 && domains.some(d => d.employeeMean > 0);
  const isDoneManager = domains.length > 0 && domains.some(d => d.managerMean > 0);
  const isDoneChecklist = (checklist.conforming + checklist.partial + checklist.nonConforming) > 0;

  const handleFileSelection = (type: 'employee' | 'manager' | 'checklist', file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      if (!data.length) return;
      const cols = Object.keys(data[0] as object);
      
      setFiles(prev => ({
        ...prev,
        [type]: {
          file,
          fileName: file.name,
          data,
          columns: cols,
          mapping: autoDetect(cols, data, type),
          status: 'loaded'
        }
      }));
    };
    reader.readAsBinaryString(file);
  };

  const cleanVal = (v: any): number => {
    if (v === undefined || v === null) return 0;
    const n = parseFloat(String(v).replace(/[^0-9.,]/g,'').replace(',','.'));
    return isNaN(n) ? 0 : n;
  };

  const handleProcessBatch = () => {
    setProcessing(true);
    setTimeout(() => {
      // 1. Process Checklist
      const checklistData = files.checklist.data;
      const checklistMap = files.checklist.mapping;
      const newChecklist = { conforming: 0, partial: 0, nonConforming: 0, notApplicable: 0 };
      
      if (checklistData.length > 0) {
        checklistData.forEach(row => {
          for (let i = 1; i <= 15; i++) {
            const col = checklistMap['c' + i]; if (!col) continue;
            const v = (row[col]?.toString() || '').toUpperCase().trim();
            if (v === 'C' || v === 'CONFORME') newChecklist.conforming++;
            else if (v === 'P' || v === 'PARCIAL') newChecklist.partial++;
            else if (v === 'NC' || v.includes('NÃO CONF') || v.includes('NAO CONF')) newChecklist.nonConforming++;
            else if (v === 'NA' || v.includes('NÃO SE APLICA')) newChecklist.notApplicable++;
          }
        });
        setChecklist(newChecklist);
      }

      // 2. Process Employee & Manager Data with Hierarchy
      const newUnits: Record<string, import('../types').UnitAssessment> = {};

      const processAxis = (type: 'employee' | 'manager') => {
        const fileState = files[type];
        if (fileState.status !== 'loaded') return;

        const isEmp = type === 'employee';
        const posItems = isEmp ? EMPLOYEE_POSITIVE_ITEMS : MANAGER_POSITIVE_ITEMS;
        const unitCol = fileState.mapping['unit'];
        const sectorCol = fileState.mapping['sector'];

        fileState.data.forEach(row => {
          const uName = unitCol ? (String(row[unitCol] || '').trim().toUpperCase() || 'MATRIZ') : 'MATRIZ';
          const sName = sectorCol ? (String(row[sectorCol] || '').trim().toUpperCase() || 'GERAL') : 'GERAL';

          if (!newUnits[uName]) {
            newUnits[uName] = { name: uName, sectors: {}, rowCount: 0 };
          }
          if (!newUnits[uName].sectors[sName]) {
            newUnits[uName].sectors[sName] = {
              domains: DOMAINS.map(d => ({ ...d, employeeMean: 0, managerMean: 0, criticalFrequency: 0 })),
              rowCount: 0,
              employeeOverallMean: 0,
              managerOverallMean: 0
            };
          }

          const sector = newUnits[uName].sectors[sName];
          if (isEmp) sector.rowCount++;

          // Calculate item scores for this row and update domain averages
          DOMAINS.forEach(def => {
            const domain = sector.domains.find(d => d.id === def.id);
            if (!domain) return;

            let sum = 0, cnt = 0, crit = 0;
            def.items.forEach(item => {
              const col = fileState.mapping[String(item)]; if (!col) return;
              let v = cleanVal(row[col]); if (v <= 0 || v > 5) return;
              if (posItems.includes(item)) v = 6 - v; // Inversion rule
              sum += v; cnt++; if (v >= 4) crit++;
            });

            if (cnt > 0) {
              const mean = sum / cnt;
              if (isEmp) {
                domain.employeeMean = (domain.employeeMean * (sector.rowCount - 1) + mean) / sector.rowCount;
                domain.criticalFrequency = (domain.criticalFrequency * (sector.rowCount - 1) + (crit / cnt * 100)) / sector.rowCount;
              } else {
                domain.managerMean = (domain.managerMean || 0) > 0 
                  ? (domain.managerMean + mean) / 2 
                  : mean;
              }
            }
          });
        });
      };

      processAxis('employee');
      processAxis('manager');

      // 3. Final calculations per Sector/Unit (Triangulation)
      Object.values(newUnits).forEach(unit => {
        let unitSum = 0;
        let unitCount = 0;

        Object.values(unit.sectors).forEach(sector => {
          const validEmployee = sector.domains.filter(d => d.employeeMean > 0);
          sector.employeeOverallMean = validEmployee.length > 0 
            ? validEmployee.reduce((a, b) => a + b.employeeMean, 0) / validEmployee.length 
            : 0;

          const validManager = sector.domains.filter(d => d.managerMean > 0);
          sector.managerOverallMean = validManager.length > 0 
            ? validManager.reduce((a, b) => a + b.managerMean, 0) / validManager.length 
            : 0;

          // Calculate Triangulation Score (0-1)
          const empScore = sector.employeeOverallMean > 0 ? (sector.employeeOverallMean - 1) / 4 : 0;
          const mngScore = sector.managerOverallMean > 0 ? (sector.managerOverallMean - 1) / 4 : 0;
          const chkScore = (newChecklist.nonConforming + newChecklist.partial) / (newChecklist.conforming + newChecklist.partial + newChecklist.nonConforming || 1);

          // Ponderação: Emp(4), Mng(3), Chk(4)
          let num = (empScore * 4) + (mngScore * 3) + (chkScore * 4);
          let den = 11;
          sector.triangulationScore = num / den;

          if (sector.employeeOverallMean > 0) {
            unitSum += sector.employeeOverallMean;
            unitCount++;
          }
        });

        unit.unitOverallMean = unitCount > 0 ? unitSum / unitCount : 0;
      });

      // Update Global State
      const globalDomains = DOMAINS.map(def => {
        let eSum=0, eCnt=0, mSum=0, mCnt=0, critSum=0;
        Object.values(newUnits).forEach(u => {
          Object.values(u.sectors).forEach(s => {
            const d = s.domains.find(dom => dom.id === def.id);
            if (d) {
              if (d.employeeMean > 0) { eSum += d.employeeMean; eCnt++; critSum += d.criticalFrequency; }
              if (d.managerMean > 0) { mSum += d.managerMean; mCnt++; }
            }
          });
        });
        return {
          ...def,
          employeeMean: eCnt > 0 ? eSum / eCnt : 0,
          managerMean: mCnt > 0 ? mSum / mCnt : 0,
          criticalFrequency: eCnt > 0 ? critSum / eCnt : 0,
          items: def.items
        };
      });

      setDomains(globalDomains);
      if (setUnitBreakdown) setUnitBreakdown(newUnits);
      
      const allSectors: Record<string, import('../types').SectorAssessment> = {};
      Object.values(newUnits).forEach(u => {
        Object.entries(u.sectors).forEach(([sk, sData]) => {
          allSectors[sk] = sData;
        });
      });
      setSectorBreakdown(allSectors);

      setSectorBreakdown(allSectors);

      // Limpa cache e avança sem desmontar a view pai ainda
      clearFileCache();
      setProcessing(false);
      setView('DONE_VIEW');
    }, 1500);
  };

  if (view === 'BATCH_UPLOAD') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic mb-3">Triangulação de Dados Conexa</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Carregue os 3 arquivos essenciais para iniciar a análise.<br />
              O sistema organizará automaticamente por Unidades e Setores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(['checklist', 'employee', 'manager'] as const).map((type) => {
              const config = {
                checklist: { label: 'Checklist Empresa', icon: Database, color: 'emerald', desc: '15 itens de conformidade' },
                employee: { label: 'Colaboradores', icon: Users, color: 'blue', desc: 'Pesquisa com 15 questões' },
                manager: { label: 'Gestores', icon: UserCircle2, color: 'amber', desc: 'Pesquisa com 15 questões' }
              }[type];

              const state = files[type];
              const Icon = config.icon;

              return (
                <div key={type} className={`relative p-6 rounded-2xl border-2 transition-all group ${state.status === 'loaded' ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-100 border-dashed hover:border-blue-300'}`}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${state.status === 'loaded' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Icon size={28} />
                    </div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight mb-1 text-sm">{config.label}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{config.desc}</p>
                    
                    {state.status === 'loaded' ? (
                      <div className="w-full space-y-3">
                        <div className="flex items-center gap-2 justify-center text-emerald-600 bg-emerald-50 py-2 rounded-lg border border-emerald-100">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Carregado</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">{state.fileName || 'Dados carregados'}</p>
                        <button 
                          onClick={() => {
                            setFiles(prev => ({ ...prev, [type]: { ...prev[type], status: 'empty', file: null, fileName: undefined, data: [] } }));
                          }}
                          className="text-[9px] font-black text-slate-400 uppercase hover:text-rose-500 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <label className="w-full cursor-pointer">
                        <div className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                          <Upload size={14} /> Selecionar
                        </div>
                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && handleFileSelection(type, e.target.files[0])} />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center pt-8 border-t border-slate-100">
            <button 
              onClick={() => setView('PROCESS_AXIS')}
              disabled={!(files.checklist.status === 'loaded' && files.employee.status === 'loaded' && files.manager.status === 'loaded')}
              className={`px-12 py-5 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-4 mx-auto ${(files.checklist.status === 'loaded' && files.employee.status === 'loaded' && files.manager.status === 'loaded') ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'}`}
            >
              <ArrowRight size={20} />
              Sincronizar Colunas e Setores
            </button>
            {!processing && !(files.checklist.status === 'loaded' && files.employee.status === 'loaded' && files.manager.status === 'loaded') && (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">* É necessário carregar os 3 arquivos para garantir a integridade da metodologia RP</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'PROCESS_AXIS') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic mb-3">Sincronização de Colunas</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Para a correta identificação de Unidades e Setores conforme a metodologia, revise e valide as colunas importadas.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['checklist', 'employee', 'manager'] as const).map(type => {
              const file = files[type];
              if (file.status !== 'loaded') return null;
              const isChk = type === 'checklist';
              const label = { checklist: 'Checklist', employee: 'Colaboradores', manager: 'Gestores' }[type];
              return (
                <div key={type} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col h-[500px]">
                  <h3 className="font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <Database size={16} className="text-blue-500" /> {label}
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {!isChk && (
                      <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Coluna de Unidade</label>
                          <select value={file.mapping['unit'] || ''} onChange={(e) => updateMapping(type, 'unit', e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 outline-none">
                            <option value="">-- Ignorar (Matriz) --</option>
                            {file.columns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Coluna de Setor</label>
                          <select value={file.mapping['sector'] || ''} onChange={(e) => updateMapping(type, 'sector', e.target.value)} className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:border-blue-500 outline-none">
                            <option value="">-- Ignorar (Geral) --</option>
                            {file.columns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Mapeamento de Questões</h4>
                      {Array.from({ length: 15 }).map((_, i) => {
                        const qKey = isChk ? `c${i+1}` : String(i+1);
                        return (
                          <div key={qKey} className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Q{i+1}</label>
                            <select value={file.mapping[qKey] || ''} onChange={(e) => updateMapping(type, qKey, e.target.value)} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none truncate">
                              <option value="">-- Não Mapeada --</option>
                              {file.columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-10 flex justify-between items-center pt-6 border-t border-slate-100">
            <button onClick={() => setView('BATCH_UPLOAD')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
              <ArrowLeft size={16} /> Voltar aos Arquivos
            </button>
            <button disabled={processing} onClick={handleProcessBatch} className={`px-10 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl flex items-center gap-2 ${processing ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'}`}>
              {processing ? <RefreshCw className="animate-spin" size={16} /> : <FolderTree size={16} />}
              {processing ? 'Processando Triangulação...' : 'Confirmar e Processar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'DONE_VIEW') {
    return (
      <div className="space-y-6 text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-4 border-white">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight mb-3">Análise Concluída!</h3>
        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest max-w-sm mx-auto mb-10 leading-relaxed">
          Os dados foram processados seguindo a metodologia RP.<br />
          A triangulação por Unidade e Setor já está disponível.
        </p>
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => {
            if (onComplete) {
              // Quando chamar onComplete, ele vai salvar no banco e trocar de aba para Análise
              onComplete(domains, unitBreakdown || {});
            }
          }}
            className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            Confirmar e Ver Painel
          </button>
          <button onClick={() => { clearFileCache(); setView('BATCH_UPLOAD'); }} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
            Refazer Importação
          </button>
        </div>
      </div>
    );
  }

  return null;
}
