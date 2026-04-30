const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Adicionar aba ao menu
if (content.includes("{ id: 'report', icon: FileText, label: 'PGR' }")) {
    content = content.replace(
        "{ id: 'report', icon: FileText, label: 'PGR' }",
        "{ id: 'sectoral', icon: LayoutGrid, label: 'Tabulação' },\n                 { id: 'report', icon: FileText, label: 'PGR' }"
    );
}

// 2. Adicionar conteúdo da aba
if (content.includes("{activeTab === 'report' && (")) {
    content = content.replace(
        "{activeTab === 'report' && (",
        `{activeTab === 'sectoral' && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <SectorAnalysisView assessment={currentAssessment} />
                       </motion.div>
                     )}

                     {activeTab === 'report' && (`
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log('App.tsx updated successfully');
