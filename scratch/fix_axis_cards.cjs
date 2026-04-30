// Updates SurveyInput.tsx OVERVIEW section with rich done-state cards
const fs = require('fs');

let content = fs.readFileSync('src/components/SurveyInput.tsx', 'utf8');

// 1. Add Eye icon import
content = content.replace(
  `import { Users, UserCircle2, AlertCircle, Upload, CheckCircle2, ArrowRight, ArrowLeft, Database, FolderTree, Table as TableIcon, RefreshCw } from 'lucide-react';`,
  `import { Users, UserCircle2, AlertCircle, Upload, CheckCircle2, ArrowRight, ArrowLeft, Database, FolderTree, Table as TableIcon, RefreshCw, Eye, EyeOff, BarChart2, RefreshCcw } from 'lucide-react';`
);

// 2. Add previewAxis state after the existing states
content = content.replace(
  `  const [processing, setProcessing] = useState(false);`,
  `  const [processing, setProcessing] = useState(false);
  const [previewAxis, setPreviewAxis] = useState<string | null>(null);`
);

// 3. Replace the OVERVIEW axis cards section with the enhanced version
const OLD_CARDS = `          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id:'employee', label:'Eixo 1: Colaboradores', icon:Users, done:isDoneEmployee, desc:'Percepção de riscos psicossociais pelos funcionários' },
              { id:'manager', label:'Eixo 2: Gestores', icon:UserCircle2, done:isDoneManager, desc:'Visão da liderança sobre os fatores de risco' },
              { id:'checklist', label:'Eixo 3: Empresa', icon:Database, done:isDoneChecklist, desc:'Checklist de conformidade com normas e diretrizes' }
            ].map(axis => (
              <div key={axis.id} onClick={() => startAxis(axis.id as any)}
                className={\`relative p-6 rounded-2xl border-2 transition-all cursor-pointer group \${axis.done ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-md'}\`}>
                <div className={\`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all \${axis.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}\`}>
                  <axis.icon size={24} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={\`font-black uppercase tracking-tight \${axis.done ? 'text-emerald-900' : 'text-slate-800'}\`}>{axis.label}</h3>
                  {axis.done && <CheckCircle2 size={16} className="text-emerald-500" />}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{axis.desc}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className={\`text-[10px] font-black uppercase tracking-widest \${axis.done ? 'text-emerald-600' : 'text-slate-400 group-hover:text-blue-600'}\`}>{axis.done ? 'Concluído' : 'Processar Agora'}</span>
                  <ArrowRight size={14} className={axis.done ? 'text-emerald-400' : 'text-slate-200 group-hover:text-blue-400'} />
                </div>
              </div>
            ))}
          </div>`;

const NEW_CARDS = `          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                className={\`relative rounded-2xl border-2 transition-all overflow-hidden \${axis.done ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-emerald-100 shadow-md' : 'bg-white border-slate-100 shadow-sm'}\`}>
                
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className={\`w-12 h-12 rounded-xl flex items-center justify-center transition-all \${axis.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400'}\`}>
                      <axis.icon size={24} />
                    </div>
                    {axis.done && (
                      <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                        <CheckCircle2 size={10} /> Concluído
                      </div>
                    )}
                  </div>
                  <h3 className={\`font-black uppercase tracking-tight mb-1 \${axis.done ? 'text-emerald-900' : 'text-slate-800'}\`}>{axis.label}</h3>
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
                              <div className="h-1.5 rounded-full" style={{width:\`\${pct}%\`, backgroundColor: color}} />
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
                            <div className={\`h-1.5 rounded-full \${item.color}\`} style={{width:\`\${pct}%\`}} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Card Actions */}
                <div className={\`px-6 py-3 flex items-center justify-between border-t \${axis.done ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}\`}>
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
          </div>`;

if (content.includes(OLD_CARDS)) {
  content = content.replace(OLD_CARDS, NEW_CARDS);
  console.log('✅ Enhanced axis cards applied');
} else {
  console.warn('⚠ Old cards pattern not found');
}

fs.writeFileSync('src/components/SurveyInput.tsx', content, 'utf8');
console.log('🎉 SurveyInput.tsx updated with rich done-state cards');
