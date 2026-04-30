import sys
import os

path = r'e:\Thyago Pacheco\Desktop\PROJETOS - SAAS\ConexaRP-main\src\App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Adicionar aba ao menu
if "{ id: 'report', icon: FileText, label: 'PGR' }" in content:
    content = content.replace(
        "{ id: 'report', icon: FileText, label: 'PGR' }",
        "{ id: 'sectoral', icon: LayoutGrid, label: 'Tabulação' },\n                 { id: 'report', icon: FileText, label: 'PGR' }"
    )

# 2. Adicionar conteúdo da aba
if "{activeTab === 'report' && (" in content:
    content = content.replace(
        "{activeTab === 'report' && (",
        """{activeTab === 'sectoral' && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <SectorAnalysisView assessment={currentAssessment} />
                       </motion.div>
                     )}

                     {activeTab === 'report' && ("""
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx updated successfully")
