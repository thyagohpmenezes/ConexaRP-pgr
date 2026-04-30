// Fixes App.tsx useEffect dependencies to include assessments
const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const OLD_DEPS = `  }, [remoteCompanies, filteredAssessments, dataLoading, user, loading, profile]);`;
const NEW_DEPS = `  }, [remoteCompanies, filteredAssessments, dataLoading, user, loading, profile, assessments]);`;

if (content.includes(OLD_DEPS)) {
  content = content.replace(OLD_DEPS, NEW_DEPS);
  console.log('✅ App.tsx sync dependencies fixed');
}

fs.writeFileSync('src/App.tsx', content, 'utf8');
