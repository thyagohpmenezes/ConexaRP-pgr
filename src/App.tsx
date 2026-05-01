import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  Building2, 
  ClipboardList, 
  LayoutDashboard, 
  Settings,
  LogOut,
  Shield,
  Plus,
  ChevronRight,
  Database,
  Search,
  Bell,
  User,
  Activity,
  FileText
} from 'lucide-react';
import { useData } from './lib/useData';
import { useAuth } from './lib/AuthContext';
import { 
  Assessment, 
  Company, 
  AssessmentStatus 
} from './types';
import { DOMAINS } from './constants';

// Components
import Dashboard from './components/DashboardView';
import OrgManagement from './components/OrgManagement';
import SurveyInput from './components/SurveyInput';
import AnalysisView from './components/AnalysisView';
import SectorAnalysisView from './components/SectorAnalysisView';
import ReportGenerator from './components/ReportGenerator';
import InventoryView from './components/InventoryView';
import SettingsView from './components/SettingsView';
import LoginScreen from './components/LoginScreen';

type View = 'dashboard' | 'companies' | 'assessments' | 'inventory' | 'parameters';

export default function App() {
  const { user, profile, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [assessmentSubView, setAssessmentSubView] = useState<'dados' | 'analise' | 'tabulacao' | 'pgr'>('dados');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);

  const { 
    companies, 
    assessments, 
    loading: dataLoading, 
    saveAssessment, 
    createCompany, 
    updateCompany, 
    deleteCompany 
  } = useData();

  const filteredAssessments = useMemo(() => {
    if (!selectedCompanyId) return [];
    return assessments.filter(a => a.companyId === selectedCompanyId);
  }, [assessments, selectedCompanyId]);

  const currentAssessment = useMemo(() => {
    if (activeAssessmentId) return filteredAssessments.find(a => a.id === activeAssessmentId);
    return filteredAssessments[0] || null;
  }, [filteredAssessments, activeAssessmentId]);

  const currentCompany = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // Cálculos Automáticos para a Metodologia RP
  const checklistCriticality = useMemo(() => {
    if (!currentAssessment?.checklist) return 0;
    const { conforming, partial, nonConforming } = currentAssessment.checklist;
    const total = conforming + partial + nonConforming;
    if (total === 0) return 0;
    // Peso: Não Conforme (1.0), Parcial (0.5), Conforme (0)
    return (nonConforming * 1.0 + partial * 0.5) / total;
  }, [currentAssessment]);

  const employeeOverallMean = useMemo(() => {
    if (!currentAssessment?.domains) return 0;
    const validDomains = currentAssessment.domains.filter(d => d.employeeMean > 0);
    if (validDomains.length === 0) return 0;
    return validDomains.reduce((a, b) => a + b.employeeMean, 0) / validDomains.length;
  }, [currentAssessment]);

  const managerOverallMean = useMemo(() => {
    if (!currentAssessment?.domains) return 0;
    const validDomains = currentAssessment.domains.filter(d => d.managerMean > 0);
    if (validDomains.length === 0) return 0;
    return validDomains.reduce((a, b) => a + b.managerMean, 0) / validDomains.length;
  }, [currentAssessment]);

  const createNewAssessment = async (orgId: string) => {
    const id = crypto.randomUUID();
    const newAssessment: Assessment = {
      id,
      companyId: orgId,
      status: AssessmentStatus.IN_PROGRESS,
      domains: DOMAINS.map(d => ({ ...d, employeeMean: 0, managerMean: 0, criticalFrequency: 0 })),
      sectorBreakdown: {},
      checklist: { conforming: 0, partial: 0, nonConforming: 0, notApplicable: 0 },
      actions: [],
      triangulationScore: 0,
      riskScore: 0,
      probability: 1,
      severity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveAssessment(newAssessment);
    setActiveAssessmentId(id);
    setActiveView('assessments');
    setAssessmentSubView('dados');
  };

  if (dataLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando ConexaRP...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter leading-none italic uppercase">Conexa Risk</h1>
              <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-1">Especialista GRO</p>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-8 mt-4">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Empresa Ativa</p>
            <select 
              value={selectedCompanyId || ''} 
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            >
              <option value="">Selecione uma Empresa</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'companies', label: 'Empresas', icon: Building2 },
              { id: 'assessments', label: 'Avaliações', icon: Activity },
              { id: 'inventory', label: 'Inventário', icon: ClipboardList },
              { id: 'parameters', label: 'Parâmetros', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeView === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <span className="text-[10px] font-black">{user?.email?.[0].toUpperCase()}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black truncate">{user?.email}</p>
              {profile?.role === 'SuperAdmin' && (
                <span className="inline-block mt-0.5 mb-1 px-1.5 py-0.5 bg-amber-500 text-white rounded text-[8px] font-black uppercase tracking-widest shadow-sm">
                  SuperAdmin
                </span>
              )}
              <button onClick={signOut} className="text-[8px] text-slate-500 uppercase font-black hover:text-rose-400 flex items-center gap-1 mt-1">
                <LogOut size={10} /> Sair / Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] italic">
              {activeView === 'dashboard' ? 'Dashboard' : 
               activeView === 'companies' ? 'Gestão de Organizações' : 
               activeView === 'assessments' ? 'Avaliação Atual' : 
               activeView === 'inventory' ? 'Inventário de Riscos' : 'Parâmetros'}
            </h2>
            {currentCompany && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-px bg-slate-200 mx-2"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">{currentCompany.name} | {currentCompany.unit || 'Matriz'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Sistema Ativo</span>
             </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {activeView === 'dashboard' && <Dashboard companies={companies} assessments={assessments} />}
          
          {activeView === 'companies' && (
            <OrgManagement 
              companies={companies} 
              onCreateCompany={createCompany}
              onUpdateCompany={updateCompany}
              onDeleteCompany={deleteCompany}
              assessments={assessments}
            />
          )}

          {activeView === 'inventory' && <InventoryView assessments={assessments} companies={companies} />}
          {activeView === 'parameters' && <SettingsView />}

          {activeView === 'assessments' && (
            <div className="space-y-6">
              {!currentAssessment ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 text-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Database size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Nenhuma Avaliação Encontrada</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 font-medium">
                    Para iniciar, você deve primeiro cadastrar uma empresa na aba "Empresas", e então criar uma nova avaliação aqui.
                  </p>
                  <button 
                    disabled={!selectedCompanyId}
                    onClick={() => selectedCompanyId && createNewAssessment(selectedCompanyId)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:grayscale text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                  >
                    <Plus size={18} /> Iniciar Nova Avaliação
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                   {/* Tabs de Sub-navegação da Avaliação */}
                   <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit mb-8">
                      {[
                        { id: 'dados', label: 'Dados', icon: ClipboardList },
                        { id: 'analise', label: 'Análise', icon: Activity },
                        { id: 'tabulacao', label: 'Tabulação', icon: LayoutDashboard },
                        { id: 'pgr', label: 'PGR', icon: FileText }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setAssessmentSubView(tab.id as any)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            assessmentSubView === tab.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <tab.icon size={14} /> {tab.label}
                        </button>
                      ))}
                   </div>

                   {/* Renderização condicional simplificada para evitar tela branca */}
                   {assessmentSubView === 'dados' && (
                     <SurveyInput 
                        domains={currentAssessment.domains || []}
                        setDomains={(d) => saveAssessment({ id: currentAssessment.id, domains: d })}
                        checklist={currentAssessment.checklist || {conforming:0, partial:0, nonConforming:0, notApplicable:0}}
                        setChecklist={(c) => saveAssessment({ id: currentAssessment.id, checklist: c })}
                        overallMeanEmployee={employeeOverallMean}
                        overallMeanManager={managerOverallMean}
                        sectorBreakdown={currentAssessment.sectorBreakdown || {}}
                        setSectorBreakdown={(s) => saveAssessment({ id: currentAssessment.id, sectorBreakdown: s })}
                        onNewSectors={(names) => {
                          if (!currentCompany) return;
                          
                          let targetUnit = currentCompany.units?.find(u => u.id === currentAssessment.unitId || u.name === currentAssessment.unitId);
                          if (!targetUnit && currentCompany.units?.length > 0) {
                             targetUnit = currentCompany.units[0];
                          }

                          const updatedUnits = [...(currentCompany.units || [])];
                          
                          if (!targetUnit) {
                             targetUnit = { id: crypto.randomUUID(), name: 'Matriz', sectors: [] };
                             updatedUnits.push(targetUnit);
                          }

                          let hasChanges = false;
                          const newSectors = [...(targetUnit.sectors || [])];
                          
                          names.forEach(name => {
                             if (!newSectors.some(s => s.name.toUpperCase() === name.toUpperCase())) {
                                newSectors.push({ id: crypto.randomUUID(), name, ges: [] });
                                hasChanges = true;
                             }
                          });

                          if (hasChanges) {
                             const finalUnits = updatedUnits.map(u => u.id === targetUnit!.id ? { ...u, sectors: newSectors } : u);
                             updateCompany(currentCompany.id, { units: finalUnits });
                          }
                        }}
                        onComplete={(newDomains, newSectors) => {
                          saveAssessment({ id: currentAssessment.id, domains: newDomains, sectorBreakdown: newSectors });
                        }}
                     />
                   )}
                </div>
              )}
            </div>
          )}

          {/* Sub-views para Avaliação (Movidas para dentro do contexto de activeView === 'assessments' no futuro, mas aqui uso dupla verificação para segurança) */}
          {activeView === 'assessments' && assessmentSubView === 'analise' && currentAssessment && (
            <AnalysisView 
              domains={currentAssessment.domains}
              checklist={currentAssessment.checklist}
              checklistCriticality={checklistCriticality}
              employeeOverallMean={employeeOverallMean}
              managerOverallMean={managerOverallMean}
              assessment={currentAssessment}
              onUpdate={(updates) => saveAssessment({ id: currentAssessment.id, ...updates })}
            />
          )}

          {activeView === 'assessments' && assessmentSubView === 'tabulacao' && currentAssessment && (
            <SectorAnalysisView 
              assessment={currentAssessment}
              managerOverallMeanGlobal={managerOverallMean}
              checklistCriticalityGlobal={checklistCriticality}
            />
          )}

          {activeView === 'assessments' && assessmentSubView === 'pgr' && currentAssessment && (
            <ReportGenerator 
              assessment={currentAssessment}
              companyName={currentCompany?.name}
              unitName={currentCompany?.units?.[0]?.name || 'Matriz'}
              checklistCriticality={checklistCriticality}
              employeeOverallMean={employeeOverallMean}
              managerOverallMean={managerOverallMean}
              onConclude={() => saveAssessment({ id: currentAssessment.id, status: AssessmentStatus.COMPLETED })}
            />
          )}
        </div>
      </main>
    </div>
  );
}
