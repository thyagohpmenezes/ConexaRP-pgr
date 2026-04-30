const fs = require('fs');

// ─── 1. Modify SurveyInput to use a single onComplete callback ───
let surveyContent = fs.readFileSync('src/components/SurveyInput.tsx', 'utf8');

// Add onComplete to interface
surveyContent = surveyContent.replace(
  `  setSectorBreakdown: (data: Record<string, import('../types').SectorAssessment>) => void;\n  onNewSectors?: (sectorNames: string[]) => void;`,
  `  setSectorBreakdown: (data: Record<string, import('../types').SectorAssessment>) => void;\n  onNewSectors?: (sectorNames: string[]) => void;\n  onComplete?: (domains: DomainData[], sectorBreakdown: Record<string, import('../types').SectorAssessment>) => void;`
);

// Add onComplete to destructuring
surveyContent = surveyContent.replace(
  `  sectorBreakdown = {},\n  setSectorBreakdown,\n  onNewSectors`,
  `  sectorBreakdown = {},\n  setSectorBreakdown,\n  onNewSectors,\n  onComplete`
);

// Replace the two separate calls with one atomic call
const OLD_SAVE = `      setDomains(updatedDomains);
      // Only save sectorBreakdown if we actually found sectors
      const hasNewSectors = Object.keys(updatedSectorBreakdown).length > 0;
      if (hasNewSectors) {
        setSectorBreakdown(updatedSectorBreakdown);
      }`;

const NEW_SAVE = `      // ── ATOMIC SAVE: use single callback to avoid Firebase race condition ──
      const hasNewSectors = Object.keys(updatedSectorBreakdown).length > 0;
      if (onComplete) {
        onComplete(updatedDomains, hasNewSectors ? updatedSectorBreakdown : sectorBreakdown);
      } else {
        setDomains(updatedDomains);
        if (hasNewSectors) setSectorBreakdown(updatedSectorBreakdown);
      }`;

if (surveyContent.includes(OLD_SAVE)) {
  surveyContent = surveyContent.replace(OLD_SAVE, NEW_SAVE);
  console.log('✅ SurveyInput: atomic save applied');
} else {
  console.warn('⚠ SurveyInput: old save pattern not found');
}

fs.writeFileSync('src/components/SurveyInput.tsx', surveyContent, 'utf8');

// ─── 2. Modify App.tsx to handle onComplete atomically ───
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Find the SurveyInput render in App.tsx and add onComplete prop
const OLD_SURVEY_RENDER = `                           sectorBreakdown={currentAssessment.sectorBreakdown}
                           setSectorBreakdown={updateSectorBreakdown}
                           onNewSectors={handleNewSectors}`;

const NEW_SURVEY_RENDER = `                           sectorBreakdown={currentAssessment.sectorBreakdown}
                           setSectorBreakdown={updateSectorBreakdown}
                           onNewSectors={handleNewSectors}
                           onComplete={(newDomains, newSectorBreakdown) => {
                             if (!currentAssessment) return;
                             const updated = { ...currentAssessment, domains: newDomains, sectorBreakdown: newSectorBreakdown };
                             setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? updated : a));
                             saveAssessment({ id: currentAssessment.id, domains: newDomains, sectorBreakdown: newSectorBreakdown });
                             console.log('[ConexaRP] Atomic save: domains=', newDomains.length, 'sectors=', Object.keys(newSectorBreakdown));
                           }}`;

if (appContent.includes(OLD_SURVEY_RENDER)) {
  appContent = appContent.replace(OLD_SURVEY_RENDER, NEW_SURVEY_RENDER);
  console.log('✅ App.tsx: onComplete handler added');
} else {
  console.warn('⚠ App.tsx: SurveyInput render not found');
  // Try to find what's actually there
  const idx = appContent.indexOf('setSectorBreakdown={updateSectorBreakdown}');
  if (idx !== -1) {
    console.log('Found setSectorBreakdown at char', idx);
    console.log('Context:', appContent.substring(idx - 100, idx + 200));
  }
}

fs.writeFileSync('src/App.tsx', appContent, 'utf8');
console.log('\n🎉 Atomic save fix complete');
