import React from 'react';
import { ClipboardCheck, PieChart, AlertCircle, CheckCircle2, XCircle, Slash } from 'lucide-react';
import { ChecklistData } from '../types';

interface ChecklistInputProps {
  data: ChecklistData;
  setData: (data: ChecklistData) => void;
  criticality: number;
}

export default function ChecklistInput({ data, setData, criticality }: ChecklistInputProps) {
  const updateValue = (field: keyof ChecklistData, val: string) => {
    const num = parseInt(val) || 0;
    setData({ ...data, [field]: num });
  };

  const getStatus = (crit: number) => {
    if (crit < 0.2) return { text: 'Baixo Risco', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' };
    if (crit < 0.5) return { text: 'Médio Risco', color: 'text-amber-600 bg-amber-50 border-amber-100', bar: 'bg-amber-500' };
    return { text: 'Alto Risco', color: 'text-rose-600 bg-rose-50 border-rose-100', bar: 'bg-rose-500' };
  };

  const total = data.conforming + data.partial + data.nonConforming;
  const status = getStatus(criticality);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-slate-900 text-white rounded">
              <ClipboardCheck size={16} />
            </div>
            <h2 className="text-sm font-bold uppercase text-slate-800 tracking-tight">Checklist Organizacional</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <CheckCircle2 size={12} className="text-emerald-500" />
                Conforme (C)
              </label>
              <input 
                type="number" 
                value={data.conforming}
                onChange={(e) => updateValue('conforming', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none transition-all text-lg font-black"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <PieChart size={12} className="text-amber-500" />
                Parcial (P)
              </label>
              <input 
                type="number" 
                value={data.partial}
                onChange={(e) => updateValue('partial', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none transition-all text-lg font-black"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <XCircle size={12} className="text-rose-500" />
                Não Conforme (NC)
              </label>
              <input 
                type="number" 
                value={data.nonConforming}
                onChange={(e) => updateValue('nonConforming', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none transition-all text-lg font-black text-rose-600"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-slate-300">
                <Slash size={12} className="text-slate-300" />
                N/A
              </label>
              <input 
                type="number" 
                value={data.notApplicable}
                onChange={(e) => updateValue('notApplicable', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none transition-all text-lg font-black text-slate-300"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
          <div className="text-[10px] text-slate-500 leading-normal uppercase tracking-tight">
            <span className="font-black text-slate-700 block mb-1 underline">Métrica de Criticidade</span>
            Ponderação: C=0 | P=0.5 | NC=1. O índice final é a soma ponderada dividida pelo total de itens aplicáveis. 
            Resultados &gt;50% indicam necessidade de intervenção imediata no GRO.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900 p-6 rounded-lg text-center shadow-lg border-b-4 border-blue-600">
          <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Índice Criticidade</h3>
          <div className="text-4xl font-black text-white mb-2 leading-none">
            {(criticality * 100).toFixed(0)}<span className="text-xs text-slate-400">%</span>
          </div>
          
          <div className={`py-1 rounded text-[10px] font-black uppercase tracking-widest mb-4 inline-block px-2 ${status.color}`}>
            {status.text}
          </div>

          <div className="space-y-2 mt-4 text-left">
             <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                <span>Distribuição</span>
                <span>{total} Válidos</span>
             </div>
             <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500"
                  style={{ width: `${total > 0 ? (data.conforming / total * 100) : 0}%` }}
                />
                <div 
                  className="h-full bg-amber-500"
                  style={{ width: `${total > 0 ? (data.partial / total * 100) : 0}%` }}
                />
                <div 
                  className="h-full bg-rose-500"
                  style={{ width: `${total > 0 ? (data.nonConforming / total * 100) : 0}%` }}
                />
             </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <PieChart size={12} className="text-blue-600" />
            Vulnerabilidade
          </h3>
          <div className="space-y-2">
             <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Conformidade</span>
                <span className="text-xs font-black">{(total > 0 ? (data.conforming / total * 100) : 0).toFixed(0)}%</span>
             </div>
             <div className="flex items-center justify-between border-t border-slate-50 pt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Não Conforme</span>
                <span className="text-xs font-black text-rose-500">{(total > 0 ? ((data.partial + data.nonConforming) / total * 100) : 0).toFixed(0)}%</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
