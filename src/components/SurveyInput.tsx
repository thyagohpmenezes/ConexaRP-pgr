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
  onNewSectors?: (names: string[]) => void;
  onComplete?: (domains: DomainData[], sectors: Record<string, import('../types').SectorAssessment>) => void;
}

type ViewState = 'OVERVIEW' | 'PROCESS_AXIS';
type Step = 'UPLOAD' | 'MAPPING' | 'DONE';

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
  const SECTOR_P = ['setor','departamento','área','area','unidade','local','seção','secao','dept','equipe','turno','cargo','função','funcao','ghe','ges','grupo','posto','célula','celula','loja','filial','regional','divisão','divisao'];
  const sCol = cols.find(c => { const l=c.toLowerCase().trim(); return SECTOR_P.some(p=>l.includes(p)); });
  if (sCol) map['sector'] = sCol;
  console.log('[ConexaRP] autoDetect result:', map);
  return map;
}

export default function SurveyInput({ domains, setDomains, checklist, setChecklist, overallMeanEmployee, overallMeanManager, sectorBreakdown = {}, setSectorBreakdown, onNewSectors, onComplete }: SurveyInputProps) {
  const [view, setView] = useState<ViewState>('OVERVIEW');
  const [step, setStep] = useState<Step>('UPLOAD');
  const [axisType, setAxisType] = useState<'employee'|'manager'|'checklist'>('employee');
  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>({});
  const [processing, setProcessing] = useState(false);
  const [previewAxis, setPreviewAxis] = useState<string | null>(null);

  const isDoneEmployee = domains.length > 0 && domains.some(d => d.employeeMean > 0);
  const isDoneManager = domains.length > 0 && domains.some(d => d.managerMean > 0);
  const isDoneChecklist = (checklist.conforming + checklist.partial + checklist.nonConforming) > 0;

  const startAxis = (t: 'employee'|'manager'|'checklist') => {
    setAxisType(t); setRawData([]); setColumns([]); setMapping({}); setStep('UPLOAD'); setView('PROCESS_AXIS');
  };

  const cleanVal = (v: any): number => {
    if (v === undefined || v === null) return 0;
    const n = parseFloat(String(v).replace(/[^0-9.,]/g,'').replace(',','.'));
    return isNaN(n) ? 0 : n;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      if (!data.length) return;
      const cols = Object.keys(data[0] as object);
      setRawData(data); setColumns(cols);
      setMapping(autoDetect(cols, data, axisType));
      setStep('MAPPING');
    };
    reader.readAsBinaryString(file);
  };

  const handleProcess = () => {
    setProcessing(true);
    setTimeout(() => {
      if (axisType === 'checklist') {
        const c = { conforming:0, partial:0, nonConforming:0, notApplicable:0 };
        rawData.forEach(row => {
          for (let i=1;i<=15;i++) {
            const col = mapping['c'+i]; if (!col) continue;
            const v = (row[col]?.toString()||'').toUpperCase().trim();
            if (v==='C'||v==='CONFORME') c.conforming++;
            else if (v==='P'||v==='PARCIAL') c.partial++;
            else if (v==='NC'||v.includes('NÃO CONF')||v.includes('NAO CONF')) c.nonConforming++;
            else if (v==='NA'||v.includes('NÃO SE APLICA')) c.notApplicable++;
          }
        });
        setChecklist(c);
      } else {
        const isEmp = axisType === 'employee';
        const posItems = isEmp ? EMPLOYEE_POSITIVE_ITEMS : MANAGER_POSITIVE_ITEMS;
        const sectorCol = mapping['sector'];
        const rowsBySector: Record<string,any[]> = { '_global_': rawData };
        if (sectorCol) {
          rawData.forEach(row => {
            const s = String(row[sectorCol]||'').trim().toUpperCase() || 'NÃO INFORMADO';
            if (!rowsBySector[s]) rowsBySector[s] = [];
            rowsBySector[s].push(row);
          });
        }
        const calcDomains = (rows: any[], base: DomainData[]): DomainData[] => {
          const result = base.map(d => ({...d}));
          DOMAINS.forEach(def => {
            let sum=0,cnt=0,crit=0;
            rows.forEach(row => {
              def.items.forEach(item => {
                const col = mapping[String(item)]; if (!col) return;
                let v = cleanVal(row[col]); if (v<=0||v>5) return;
                if (posItems.includes(item)) v = 6-v;
                sum+=v; cnt++; if (v>=4) crit++;
              });
            });
            const idx = result.findIndex(d=>d.id===def.id);
            if (idx!==-1 && cnt>0) {
              const mean = sum/cnt;
              if (isEmp) result[idx] = {...result[idx], employeeMean:mean, criticalFrequency:(crit/cnt)*100};
              else result[idx] = {...result[idx], managerMean:mean};
            }
          });
          return result;
        };
        const newDomains = calcDomains(rawData, [...domains]);
        const newSectors: Record<string,import('../types').SectorAssessment> = {...sectorBreakdown};
        if (sectorCol) {
          Object.keys(rowsBySector).filter(k=>k!=='_global_').forEach(sk => {
            const sRows = rowsBySector[sk];
            const base = newSectors[sk]?.domains || DOMAINS.map(d=>({...d,employeeMean:0,managerMean:0,criticalFrequency:0}));
            const sDomains = calcDomains(sRows, base);
            const mean = sDomains.filter(d=>d.employeeMean>0).reduce((a,d)=>a+d.employeeMean,0) / Math.max(1,sDomains.filter(d=>d.employeeMean>0).length);
            newSectors[sk] = { 
              ...newSectors[sk], 
              domains: sDomains, 
              rowCount: isEmp ? sRows.length : (newSectors[sk]?.rowCount || sRows.length), 
              employeeOverallMean: isEmp ? mean : (newSectors[sk]?.employeeOverallMean || 0), 
              managerOverallMean: !isEmp ? mean : (newSectors[sk]?.managerOverallMean || 0) 
            };
          });
          const found = Object.keys(rowsBySector).filter(k=>k!=='_global_');
          if (onNewSectors && found.length) onNewSectors(found);
        }
        if (onComplete) {
          onComplete(newDomains, newSectors);
        } else {
          setDomains(newDomains);
          if (Object.keys(newSectors).length) setSectorBreakdown(newSectors);
        }
      }
      setProcessing(false); setStep('DONE');
    }, 800);
  };

  if (view === 'OVERVIEW') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic mb-2">Processo de Avaliação Conexa</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Siga os passos abaixo selecionando cada eixo para realizar o upload e tabulação.<br />
              Após concluir os 3 eixos, a triangulação final será gerada.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              { 
                id:'employee', label:'Eixo 1: Colaboradores', icon:Users, done:isDoneEmployee, 
                desc:'Percepção de riscos psicossociais pelos funcionários',
                stats: isDoneEmployee ? [
                  { label:'Média Geral', value: overallMeanEmployee.toFixed(2) },
                  { label:'Domínios', value: domains.filter(d=>d.employeeMean>0).length + '/10' },
                  { label:'Setores', value: Object.keys(sectorBreakdown||{}).length.toString() }
                ] : []
              },
              { 
                id:'manager', label:'Eixo 2: Gestores', icon:UserCircle2, done:isDoneManager, 
                desc:'Visão da liderança sobre os fatores de risco',
                stats: isDoneManager ? [
                  { label:'Média Gestores', value: overallMeanManager.toFixed(2) },
                  { label:'Domínios', value: domains.filter(d=>d.managerMean>0).length + '/10' }
                ] : []
              },
              { 
                id:'checklist', label:'Eixo 3: Empresa', icon:Database, done:isDoneChecklist, 
                desc:'Checklist de conformidade com normas e diretrizes',
                stats: isDoneChecklist ? [
                  { label:'Conformes', value: checklist.conforming.toString() },
                  { label:'Parciais', value: checklist.partial.toString() },
                  { label:'Não Conf.', value: checklist.nonConforming.toString() }
                ] : []
              }
            ] as const).map(axis => (
              <div key={axis.id}
                className={`relative rounded-2xl border-2 transition-all overflow-hidden ${axis.done ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-emerald-100 shadow-md' : 'bg-white border-slate-100 shadow-sm'}`}>
                
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${axis.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                      <axis.icon size={24} />
                    </div>
                    {axis.done && (
                      <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                        <CheckCircle2 size={10} /> Concluído
                      </div>
                    )}
                  </div>
                  <h3 className={`font-black uppercase tracking-tight mb-1 ${axis.done ? 'text-emerald-900' : 'text-slate-800'}`}>{axis.label}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{axis.desc}</p>

                  {/* Stats pills when done */}
                  {axis.done && axis.stats.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {axis.stats.map(s => (
                        <div key={s.label} className="bg-white border border-emerald-100 rounded-lg px-2.5 py-1.5 shadow-sm">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                          <p className="text-[13px] font-black text-emerald-700">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Domain preview when done + expanded */}
                {axis.done && axis.id !== 'checklist' && previewAxis === axis.id && (
                  <div className="px-6 pb-4 border-t border-emerald-100 pt-4 bg-white/60">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <BarChart2 size={10} className="text-blue-500" /> Médias por Domínio
                    </p>
                    <div className="space-y-1.5">
                      {domains.filter(d => axis.id === 'employee' ? d.employeeMean > 0 : d.managerMean > 0).map(d => {
                        const val = axis.id === 'employee' ? d.employeeMean : d.managerMean;
                        const pct = Math.min(100, (val / 5) * 100);
                        const color = val >= 3.5 ? '#ef4444' : val >= 2.5 ? '#f59e0b' : '#22c55e';
                        return (
                          <div key={d.id}>
                            <div className="flex justify-between text-[8px] font-bold text-slate-600 mb-0.5">
                              <span className="truncate max-w-[150px]">{d.name}</span>
                              <span style={{color}}>{val.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="h-1.5 rounded-full" style={{width:`${pct}%`, backgroundColor: color}} />
                            </div>
                          </div>
                        );
                      })}
                      {axis.id === 'employee' && Object.keys(sectorBreakdown||{}).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Setores detectados</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(sectorBreakdown||{}).map(([name, data]) => (
                              <span key={name} className="text-[8px] font-black bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                                {name} ({(data as any).rowCount||0})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {axis.done && axis.id === 'checklist' && previewAxis === axis.id && (
                  <div className="px-6 pb-4 border-t border-emerald-100 pt-4 bg-white/60">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Resultado do Checklist</p>
                    {[
                      { label:'Conformes', val: checklist.conforming, color:'bg-emerald-400' },
                      { label:'Parciais', val: checklist.partial, color:'bg-amber-400' },
                      { label:'Não Conformes', val: checklist.nonConforming, color:'bg-rose-400' },
                    ].map(item => {
                      const total = checklist.conforming + checklist.partial + checklist.nonConforming;
                      const pct = total > 0 ? Math.round((item.val/total)*100) : 0;
                      return (
                        <div key={item.label} className="mb-1.5">
                          <div className="flex justify-between text-[8px] font-bold text-slate-600 mb-0.5">
                            <span>{item.label}</span><span>{item.val} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${item.color}`} style={{width:`${pct}%`}} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Card Actions */}
                <div className={`px-6 py-3 flex items-center justify-between border-t ${axis.done ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}>
                  {axis.done ? (
                    <>
                      <button onClick={() => setPreviewAxis(previewAxis === axis.id ? null : axis.id)}
                        className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase hover:text-blue-600 transition-colors">
                        {previewAxis === axis.id ? <EyeOff size={12}/> : <Eye size={12}/>}
                        {previewAxis === axis.id ? 'Ocultar' : 'Ver Dados'}
                      </button>
                      <button onClick={() => startAxis(axis.id as any)}
                        className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase hover:text-slate-700 transition-colors">
                        <RefreshCcw size={12}/> Atualizar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startAxis(axis.id as any)}
                      className="w-full flex items-center justify-between text-[10px] font-black text-blue-600 uppercase hover:text-blue-500 transition-colors">
                      <span>Processar Agora</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <button disabled={!(isDoneEmployee && isDoneManager && isDoneChecklist)}
              className={`px-10 py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3 mx-auto ${(isDoneEmployee && isDoneManager && isDoneChecklist) ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}>
              <FolderTree size={20} /> Gerar Triangulação Final
            </button>
            {!(isDoneEmployee && isDoneManager && isDoneChecklist) && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">* Complete os 3 eixos de dados acima para liberar a triangulação</p>}
          </div>
        </div>
      </div>
    );
  }

  // PROCESS_AXIS view
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <button onClick={() => { setView('OVERVIEW'); setStep('UPLOAD'); }} className="p-2 bg-slate-50 text-slate-500 rounded hover:bg-slate-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight italic">
            {axisType==='employee' ? 'Sincronização: Colaboradores' : axisType==='manager' ? 'Sincronização: Gestores' : 'Sincronização: Checklist Empresa'}
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Passo atual de processamento</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          {(['UPLOAD','MAPPING','DONE'] as Step[]).map((s, idx) => {
            const icons = [Upload, TableIcon, CheckCircle2];
            const labels = ['Upload','Mapeamento','Concluído'];
            const Icon = icons[idx];
            return (
              <React.Fragment key={s}>
                <div className={`flex flex-col items-center gap-2 ${step===s ? 'text-blue-600' : step==='DONE' && idx<2 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step===s ? 'border-blue-600 bg-blue-50' : step==='DONE'&&idx<2 ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{labels[idx]}</span>
                </div>
                {idx<2 && <div className="h-px bg-slate-200 flex-1 mb-6" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step==='UPLOAD' && (
          <motion.div key="upload" initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}} exit={{opacity:0}} className="max-w-xl mx-auto">
            <label className="flex flex-col items-center justify-center p-16 bg-white border-4 border-dashed border-slate-100 rounded-3xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-center group">
              <div className="p-6 bg-slate-50 rounded-full text-slate-400 group-hover:text-blue-600 group-hover:bg-white transition-all mb-6 shadow-sm"><Upload size={48} /></div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">
                Importar Arquivo ({axisType==='employee'?'Colaboradores':axisType==='manager'?'Gestores':'Checklist'})
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed max-w-xs">Arraste ou clique para selecionar seu arquivo XLSX ou CSV.</p>
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFile} />
            </label>
          </motion.div>
        )}

        {step==='MAPPING' && (
          <motion.div key="mapping" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Vincular Colunas do Arquivo</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {rawData.length} linhas detectadas | {Object.keys(mapping).filter(k=>!isNaN(Number(k))&&mapping[k]).length} perguntas mapeadas
                    {mapping['sector'] ? ` | Setor: "${mapping['sector']}"` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep('UPLOAD')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 rounded">Voltar</button>
                  <button onClick={handleProcess} disabled={processing}
                    className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg hover:bg-blue-500 flex items-center gap-2">
                    {processing ? <RefreshCw className="animate-spin" size={14}/> : <ArrowRight size={14}/>}
                    {processing ? 'Tabulando...' : 'Finalizar Eixo'}
                  </button>
                </div>
              </div>
              <div className="p-0 max-h-[500px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest font-black">
                      <th className="px-6 py-4">Item</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Coluna no Arquivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {Array.from({length:15}).map((_,i) => {
                      const k = axisType==='checklist' ? 'c'+(i+1) : String(i+1);
                      const mapped = !!mapping[k];
                      return (
                        <tr key={k} className={mapped?'bg-white':'bg-slate-50/50'}>
                          <td className="px-6 py-3">
                            <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded mr-2">#{i+1}</span>
                            <span className="text-xs font-bold text-slate-600">{axisType==='checklist'?`Item ${i+1}`:`Pergunta ${i+1}`}</span>
                          </td>
                          <td className="px-6 py-3">
                            {mapped ? <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase"><CheckCircle2 size={12}/>Vinculado</span>
                              : <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase"><AlertCircle size={12}/>Não Identificado</span>}
                          </td>
                          <td className="px-6 py-3">
                            <select value={mapping[k]||''} onChange={e=>setMapping({...mapping,[k]:e.target.value})}
                              className="w-full max-w-xs text-[11px] p-2 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 font-bold">
                              <option value="">-- Selecione --</option>
                              {columns.map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                    {axisType!=='checklist' && (
                      <tr className={`border-t-2 ${mapping['sector']?'bg-emerald-50 border-emerald-200':'bg-rose-50 border-rose-200'}`}>
                        <td className="px-6 py-3">
                          <span className={`text-[11px] font-black px-2 py-1 rounded mr-2 ${mapping['sector']?'text-emerald-700 bg-emerald-100':'text-rose-700 bg-rose-100'}`}>SETOR</span>
                          <span className="text-xs font-bold text-slate-600">Coluna de Setor / Departamento</span>
                          {!mapping['sector'] && <p className="text-[9px] text-rose-500 font-bold uppercase mt-1">Opcional — necessário para tabulação por setores</p>}
                        </td>
                        <td className="px-6 py-3">
                          {mapping['sector'] ? <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase"><CheckCircle2 size={12}/>Vinculado</span>
                            : <span className="text-[9px] text-slate-400 font-bold">Não detectado</span>}
                        </td>
                        <td className="px-6 py-3">
                          <select value={mapping['sector']||''} onChange={e=>setMapping({...mapping,sector:e.target.value})}
                            className="w-full max-w-xs text-[11px] p-2 bg-white border border-slate-200 rounded outline-none focus:border-blue-500 font-bold">
                            <option value="">-- Análise Global Apenas --</option>
                            {columns.map(c=><option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {step==='DONE' && (
          <motion.div key="done" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="space-y-6 text-center py-12">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-2">Eixo Processado!</h3>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest max-w-sm mx-auto mb-8">
              Os dados de {axisType==='employee'?'Colaboradores':axisType==='manager'?'Gestores':'Checklist'} foram tabulados com sucesso.
            </p>
            <button onClick={() => { setView('OVERVIEW'); setStep('UPLOAD'); }}
              className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-slate-800 transition-all shadow-xl">
              Voltar ao Painel Geral
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
