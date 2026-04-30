// Updates triangulation button to require all 3 axes (FIXED)
const fs = require('fs');

let content = fs.readFileSync('src/components/SurveyInput.tsx', 'utf8');

// Replace the disabled condition
content = content.replace(
  'disabled={!(isDoneEmployee && isDoneManager)}',
  'disabled={!(isDoneEmployee && isDoneManager && isDoneChecklist)}'
);

// Replace the className condition part 1
content = content.replace(
  '(isDoneEmployee && isDoneManager) ? \'bg-slate-900',
  '(isDoneEmployee && isDoneManager && isDoneChecklist) ? \'bg-slate-900'
);

// Replace the footer message condition
content = content.replace(
  '!(isDoneEmployee && isDoneManager) && <p className="text-[10px]',
  '!(isDoneEmployee && isDoneManager && isDoneChecklist) && <p className="text-[10px]'
);

fs.writeFileSync('src/components/SurveyInput.tsx', content, 'utf8');
console.log('✅ Triangulation button logic updated to check all 3 axes');
