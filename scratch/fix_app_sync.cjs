// Fixes App.tsx state synchronization to prevent overwriting local updates with old remote data
const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Refine the useEffect that syncs remote data to local state
const OLD_SYNC = `  React.useEffect(() => {
    if (loading || !user || !profile) return;
    
    if (!dataLoading) {
      setCompanies(remoteCompanies);
      setAssessments(filteredAssessments);
    }
  }, [remoteCompanies, filteredAssessments, dataLoading, companies.length, user, loading, profile]);`;

const NEW_SYNC = `  // Synchronize local state with remote data carefully
  React.useEffect(() => {
    if (loading || !user || !profile) return;
    
    if (!dataLoading) {
      setCompanies(remoteCompanies);
      
      // Optimistic Update Check: 
      // Only overwrite local assessments if remote has a newer update or different count.
      // We check updatedAt (Firestore timestamp) if available.
      const shouldUpdate = assessments.length === 0 || 
                           filteredAssessments.length !== assessments.length ||
                           filteredAssessments.some((ra, i) => {
                             const local = assessments.find(la => la.id === ra.id);
                             if (!local) return true;
                             // If remote has a timestamp and local doesn't, or remote is newer
                             const remoteTime = ra.updatedAt?.seconds || 0;
                             const localTime = local.updatedAt?.seconds || 0;
                             return remoteTime > localTime;
                           });

      if (shouldUpdate) {
        console.log('[ConexaRP] Syncing remote assessments to local state');
        setAssessments(filteredAssessments);
      }
    }
  }, [remoteCompanies, filteredAssessments, dataLoading, user, loading, profile]);`;

if (content.includes(OLD_SYNC)) {
  content = content.replace(OLD_SYNC, NEW_SYNC);
  console.log('✅ App.tsx sync logic refined');
} else {
  console.warn('⚠ Sync logic pattern not found');
}

// 2. Ensure SurveyInput correctly triggers the triangulation button by checking if we have enough data
// Actually, the button is in SurveyInput's overview. 
// Let's make sure the isDone checks are robust.

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('🎉 App.tsx updated');
