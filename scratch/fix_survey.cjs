const fs = require('fs');

const path = 'src/components/SurveyInput.tsx';
let content = fs.readFileSync(path, 'utf8');

// ─── FIX 1: Add useMemo to imports ───
content = content.replace(
  `import React, { useState } from 'react';`,
  `import React, { useState, useMemo } from 'react';`
);

// ─── FIX 2: Add Step type for SECTOR_SELECT ───
content = content.replace(
  `type Step = 'UPLOAD' | 'MAPPING' | 'ANALYSIS';`,
  `type Step = 'UPLOAD' | 'SECTOR_SELECT' | 'MAPPING' | 'ANALYSIS';`
);

// ─── FIX 3: Replace handleFileUpload to go to SECTOR_SELECT first ───
const OLD_UPLOAD_END = `        setMapping(initialMapping);
        setCurrentStep('MAPPING');
      }
    };
    reader.readAsBinaryString(file);
  };`;

const NEW_UPLOAD_END = `        // Auto-detect sector column
        const SECTOR_PATTERNS = [
          'setor', 'departamento', 'área', 'area', 'unidade', 'local',
          'seção', 'secao', 'dept', 'depto', 'equipe', 'time', 'turno',
          'cargo', 'função', 'funcao', 'ghe', 'ges', 'grupo', 'posto',
          'célula', 'celula', 'loja', 'filial', 'regional', 'divisão', 'divisao'
        ];
        const autoSectorCol = cols.find(c => {
          const lower = c.toLowerCase().trim();
          return SECTOR_PATTERNS.some(p => lower.includes(p));
        });
        if (autoSectorCol) initialMapping['sector'] = autoSectorCol;
        console.log('[ConexaRP] Colunas:', cols, '| Setor detectado:', autoSectorCol || 'NENHUM');
        
        setMapping(initialMapping);
        // Go to sector selection step for employee data, else go to mapping
        setCurrentStep(targetType === 'employee' ? 'SECTOR_SELECT' : 'MAPPING');
      }
    };
    reader.readAsBinaryString(file);
  };`;

if (content.includes(OLD_UPLOAD_END)) {
  content = content.replace(OLD_UPLOAD_END, NEW_UPLOAD_END);
  console.log('✅ FIX 3 applied: handleFileUpload goes to SECTOR_SELECT');
} else {
  console.warn('⚠ FIX 3 skipped: target not found');
}

// ─── FIX 4: Guard setSectorBreakdown against empty ───
const OLD_SETSTEP = `      setDomains(updatedDomains);
      setSectorBreakdown(updatedSectorBreakdown);`;

const NEW_SETSTEP = `      setDomains(updatedDomains);
      // Only save sectorBreakdown if we actually found sectors
      const hasNewSectors = Object.keys(updatedSectorBreakdown).length > 0;
      if (hasNewSectors) {
        setSectorBreakdown(updatedSectorBreakdown);
      }`;

if (content.includes(OLD_SETSTEP)) {
  content = content.replace(OLD_SETSTEP, NEW_SETSTEP);
  console.log('✅ FIX 4 applied: guard against empty sectorBreakdown');
} else {
  console.warn('⚠ FIX 4 skipped: target not found');
}

// ─── FIX 5: Add SECTOR_SELECT step UI before the MAPPING step ───
const SECTOR_SELECT_STEP = `
        {currentStep === 'SECTOR_SELECT' && (
          <motion.div
            key="sector_select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden">
              <div className="p-5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight flex items-center gap-2">
                    <FolderTree size={16} /> Qual coluna representa o Setor / Departamento?
                  </h3>
                  <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest mt-1">
                    Selecione a coluna do arquivo que identifica o setor de cada colaborador
                  </p>
                </div>
                <button onClick={() => setCurrentStep('MAPPING')} className="text-[10px] font-black text-blue-600 uppercase hover:text-blue-400 transition-colors">
                  Pular →
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* No sector option */}
                <div
                  onClick={() => { setMapping(prev => { const m = {...prev}; delete m['sector']; return m; }); }}
                  className={\`p-4 rounded-xl border-2 cursor-pointer transition-all \${
                    !mapping['sector']
                      ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-200'
                      : 'border-slate-100 bg-white hover:border-slate-300'
                  }\`}
                >
                  <p className="text-[11px] font-black text-slate-500 uppercase mb-1">Sem divisão por setor</p>
                  <p className="text-[10px] text-slate-400 font-medium">Análise geral apenas (sem tabulação setorial)</p>
                </div>

                {/* Column options */}
                {columns.map(col => {
                  const sampleVals = [...new Set(rawData.slice(0, 5).map((r: any) => r[col]).filter(Boolean))];
                  const isSelected = mapping['sector'] === col;
                  return (
                    <div
                      key={col}
                      onClick={() => setMapping(prev => ({ ...prev, sector: col }))}
                      className={\`p-4 rounded-xl border-2 cursor-pointer transition-all \${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-slate-100 bg-white hover:border-blue-300'
                      }\`}
                    >
                      <p className={\`text-[11px] font-black uppercase mb-1 \${isSelected ? 'text-blue-700' : 'text-slate-700'}\`}>{col}</p>
                      <p className="text-[9px] text-slate-400 font-medium truncate">
                        Ex: {sampleVals.slice(0, 3).join(' · ')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Live sector preview */}
              {mapping['sector'] && (() => {
                const sectorSet = new Set<string>(
                  rawData.map((r: any) => r[mapping['sector']]).filter(Boolean).map((v: any) => String(v).trim().toUpperCase())
                );
                const sectors = Array.from(sectorSet);
                return (
                  <div className="px-5 pb-5">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-2">
                        ✓ {sectors.length} setor(es) identificado(s) — {rawData.length} respostas serão distribuídas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sectors.map(s => (
                          <span key={s} className="text-[9px] font-black bg-white border border-emerald-200 text-emerald-800 px-2 py-1 rounded-full uppercase">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="px-5 pb-5 flex justify-end">
                <button
                  onClick={() => setCurrentStep('MAPPING')}
                  className="px-6 py-2 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow hover:bg-blue-500 transition-all flex items-center gap-2"
                >
                  Confirmar e Continuar <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

`;

// Insert SECTOR_SELECT step before the MAPPING step
const MAPPING_TRIGGER = `        {currentStep === 'MAPPING' && (`;
if (content.includes(MAPPING_TRIGGER)) {
  content = content.replace(MAPPING_TRIGGER, SECTOR_SELECT_STEP + `        {currentStep === 'MAPPING' && (`);
  console.log('✅ FIX 5 applied: SECTOR_SELECT step inserted');
} else {
  console.warn('⚠ FIX 5 skipped: MAPPING trigger not found');
}

// ─── FIX 6: Update step indicator to include SECTOR_SELECT ───
const OLD_STEPS = `{ id: 'UPLOAD', label: 'Upload', icon: Upload },
            { id: 'MAPPING', label: 'Sincronização', icon: Database },
            { id: 'ANALYSIS', label: 'Análise Parcial', icon: CheckCircle2 }`;

const NEW_STEPS = `{ id: 'UPLOAD', label: 'Upload', icon: Upload },
            { id: 'SECTOR_SELECT', label: 'Setores', icon: FolderTree },
            { id: 'MAPPING', label: 'Sincronização', icon: Database },
            { id: 'ANALYSIS', label: 'Análise Parcial', icon: CheckCircle2 }`;

if (content.includes(OLD_STEPS)) {
  content = content.replace(OLD_STEPS, NEW_STEPS);
  console.log('✅ FIX 6 applied: step indicator updated');
} else {
  console.warn('⚠ FIX 6 skipped: step indicator not found');
}

fs.writeFileSync(path, content, 'utf8');
console.log('\n🎉 All fixes applied to SurveyInput.tsx');
