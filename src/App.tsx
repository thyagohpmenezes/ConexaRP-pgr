/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  Users, 
  Layers, 
  FileText, 
  BarChart3,
  Building2,
  LayoutDashboard,
  ShieldAlert,
  Settings,
  AlertCircle,
  FolderTree,
  LayoutGrid
} from 'lucide-react';
import { DOMAINS, INITIAL_DOMAIN_DATA, SOURCE_WEIGHTS } from './constants';
import { 
  DomainData, 
  ChecklistData, 
  AssessmentStatus,
  Assessment,
  Company,
  RiskLevel,
  Sector
} from './types';

// Helper components
import SurveyInput from './components/SurveyInput';
import ChecklistInput from './components/ChecklistInput';
import AnalysisView from './components/AnalysisView';
import ReportGenerator from './components/ReportGenerator';
import SectorAnalysisView from './components/SectorAnalysisView';
import DashboardView from './components/DashboardView';
import OrgManagement from './components/OrgManagement';
import InventoryView from './components/InventoryView';
import SettingsView from './components/SettingsView';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Network, ArrowRight } from 'lucide-react';

import { useData } from './lib/useData';

function AppContent() {
  const { user, profile, loading, loginWithGoogle, logout } = useAuth();
  const { companies: remoteCompanies, assessments: remoteAssessments, loading: dataLoading, saveAssessment, createAssessment, createCompany, updateCompany, deleteCompany, resetDatabase } = useData();
  const [activeView, setActiveView] = useState<'dashboard' | 'org' | 'assessments' | 'inventory' | 'settings'>('dashboard');
  const [activeTab, setActiveTab] = useState<'survey' | 'checklist' | 'triangulation' | 'sectoral' | 'report'>('survey');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(localStorage.getItem('selectedCompanyId'));
  const [selectedSector, setSelectedSector] = useState<string>('Geral');

  const filteredAssessments = useMemo(() => {
    if (!selectedCompanyId) return [];
    return remoteAssessments.filter(a => a.companyId === selectedCompanyId);
  }, [remoteAssessments, selectedCompanyId]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Synchronize local state with remote data carefully
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
  }, [remoteCompanies, filteredAssessments, dataLoading, user, loading, profile, assessments]);

  const handleSelectCompany = (id: string | null) => {
    setSelectedCompanyId(id);
    if (id) {
      localStorage.setItem('selectedCompanyId', id);
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
  };

  const currentAssessment = assessments[0];

  const activeSectorData = useMemo(() => {
    if (!currentAssessment) return null;
    if (selectedSector === 'Geral') return currentAssessment;
    return currentAssessment.sectorBreakdown?.[selectedSector] || currentAssessment;
  }, [currentAssessment, selectedSector]);
  const activeDomains = activeSectorData?.domains || currentAssessment?.domains || [];

  const updateDomains = (newDomains: DomainData[]) => {
    if (!currentAssessment) return;
    if (selectedSector === 'Geral') {
      setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? { ...a, domains: newDomains } : a));
      saveAssessment({ id: currentAssessment.id, domains: newDomains });
    } else {
      const sectorData = currentAssessment.sectorBreakdown?.[selectedSector] || { domains: newDomains };
      const updatedSector = { ...sectorData, domains: newDomains };
      const newBreakdown = { ...currentAssessment.sectorBreakdown, [selectedSector]: updatedSector };
      setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? { ...a, sectorBreakdown: newBreakdown } : a));
      saveAssessment({ id: currentAssessment.id, sectorBreakdown: newBreakdown });
    }
  };

  const updateSectorBreakdown = (breakdown: Record<string, import('./types').SectorAssessment>) => {
    if (!currentAssessment) return;
    const finalBreakdown = breakdown || {};
    setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? { ...a, sectorBreakdown: finalBreakdown } : a));
    saveAssessment({ id: currentAssessment.id, sectorBreakdown: finalBreakdown });
  };

  const updateChecklist = (newChecklist: ChecklistData) => {
    if (!currentAssessment) return;
    // Checklist is usually company-wide in this context, but let's keep it consistent
    setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? { ...a, checklist: newChecklist } : a));
    saveAssessment({ id: currentAssessment.id, checklist: newChecklist });
  };

  const employeeOverallMean = useMemo(() => {
    if (!activeDomains.length) return 0;
    return activeDomains.reduce((acc, d) => acc + d.employeeMean, 0) / activeDomains.length;
  }, [activeDomains]);

  const managerOverallMean = useMemo(() => {
    const globalDomains = currentAssessment?.domains || [];
    if (!globalDomains.length) return 0;
    return globalDomains.reduce((acc, d) => acc + (d.managerMean || 0), 0) / globalDomains.length;
  }, [currentAssessment?.domains]);

  const checklistCriticality = useMemo(() => {
    if (!currentAssessment) return 0;
    const total = currentAssessment.checklist.conforming + currentAssessment.checklist.partial + currentAssessment.checklist.nonConforming;
    if (total === 0) return 0;
    return (currentAssessment.checklist.nonConforming * 1 + currentAssessment.checklist.partial * 0.5) / total;
  }, [currentAssessment?.checklist]);

  const activeAssessmentMerged = useMemo(() => {
    if (!currentAssessment) return null as unknown as Assessment;
    
    let base = currentAssessment;
    if (selectedSector !== 'Geral') {
      const sectorData = currentAssessment.sectorBreakdown?.[selectedSector];
      if (sectorData) {
        base = { 
          ...currentAssessment, 
          ...sectorData, 
          sectorBreakdown: currentAssessment.sectorBreakdown // Preserve reference to all sectors
        } as Assessment;
      }
    }

    // Se o score for zero, tentamos um cálculo virtual rápido para o relatório não ficar vazio
    if (base.triangulationScore === 0 && activeDomains.length > 0) {
      const colabScore = (employeeOverallMean - 1) / 4;
      const gestorScore = managerOverallMean > 0 ? (managerOverallMean - 1) / 4 : 0;
      const checkScore = checklistCriticality; // Higher criticality = Higher risk score

      let weightedSum = 0;
      let weightTotal = 0;

      // Colaboradores (Peso 4)
      if (employeeOverallMean > 0) {
        weightedSum += colabScore * 4;
        weightTotal += 4;
      }
      
      // Gestores (Peso 3 - Sempre Global conforme regra)
      if (managerOverallMean > 0) {
        weightedSum += gestorScore * 3;
        weightTotal += 3;
      }

      // Checklist (Peso 4 - Sempre Global)
      weightedSum += checkScore * 4;
      weightTotal += 4;

      base.triangulationScore = weightTotal > 0 ? weightedSum / weightTotal : 0;
      
      // Matriz 5x5 Virtual
      const prob = Math.min(5, Math.max(1, Math.ceil(base.triangulationScore * 5)));
      const sev = Math.min(5, Math.max(1, Math.ceil(base.triangulationScore * 5)));
      base.probability = prob;
      base.severity = sev;
      base.riskScore = prob * sev;
      
      base.grauConvergencia = weightTotal >= 11 ? 'FORTE' : 'MODERADA';
    }

    return base;
  }, [currentAssessment, selectedSector, employeeOverallMean, managerOverallMean, checklistCriticality, activeDomains]);

  const handleNewSectors = async (sectorNames: string[]) => {
    if (!selectedCompanyId || !currentAssessment) return;
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;

    // Find the unit mentioned in assessment
    const unitIndex = company.units.findIndex(u => u.name === currentAssessment.unitId);
    if (unitIndex === -1) return;

    const unit = company.units[unitIndex];
    const existingSectorNames = unit.sectors.map(s => s.name.toUpperCase());
    
    const newSectors: Sector[] = [];
    sectorNames.forEach(name => {
      if (!existingSectorNames.includes(name.toUpperCase())) {
        newSectors.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: name,
          ges: []
        });
      }
    });

    if (newSectors.length > 0) {
      const updatedUnits = [...company.units];
      updatedUnits[unitIndex] = {
        ...unit,
        sectors: [...unit.sectors, ...newSectors]
      };
      await updateCompany(selectedCompanyId, { units: updatedUnits });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500 uppercase tracking-widest text-sm italic">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Network size={120} />
           </div>
           <div className="flex items-center gap-2 mb-8 relative z-10">
              <div className="p-2 bg-blue-600 rounded-lg">
                 <ClipboardCheck size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter italic uppercase">
                 Nexus<span className="text-blue-500">GR</span>
              </h1>
           </div>
           <p className="text-slate-400 text-sm italic leading-relaxed mb-8 relative z-10">
             Plataforma de inteligência metodológica para Gestão de Riscos Ocupacionais (GRO) e identificação de Anomalias Psicossociais.
           </p>
           <button 
             onClick={loginWithGoogle}
             className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-lg flex items-center justify-center gap-2 transition-colors relative z-10"
           >
             Acessar Plataforma <ArrowRight size={14} />
           </button>
        </div>
      </div>
    );
  }

  if (dataLoading && assessments.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
        <div className="font-bold text-slate-500 uppercase tracking-widest text-sm italic animate-pulse">
          Sincronizando Dados Básicos...
        </div>
        <button 
          onClick={logout}
          className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-[0.2em] border border-slate-200 px-4 py-2 rounded-full transition-all"
        >
          Sair / Trocar de Conta
        </button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex overflow-hidden h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-60 bg-slate-900 flex flex-col h-full shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
           <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-900/20">
              <ShieldAlert size={24} />
           </div>
           <div className="hidden lg:block overflow-hidden">
              <h1 className="font-black text-white text-sm tracking-tight leading-none truncate">Conexa Risk</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Especialista GRO</p>
           </div>
        </div>

        {/* Company Selector */}
        <div className="p-4 border-b border-slate-800">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 hidden lg:block">Empresa Ativa</p>
          <select 
            value={selectedCompanyId || ''}
            onChange={(e) => handleSelectCompany(e.target.value || null)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-[10px] font-bold py-2 px-2 rounded outline-none focus:border-blue-500 transition-all"
          >
            <option value="">SELECIONE UMA EMPRESA</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 p-3 space-y-1">
           {[
             { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
             { id: 'org', icon: Building2, label: 'Empresas' },
             { id: 'assessments', icon: BarChart3, label: 'Avaliações' },
             { id: 'inventory', icon: Layers, label: 'Inventário' },
             { id: 'settings', icon: Settings, label: 'Parâmetros' }
           ].map(item => (
             <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group overflow-hidden ${
                  activeView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
             >
                <item.icon size={20} className={activeView === item.id ? 'text-white' : 'group-hover:text-blue-400'} />
                <span className="hidden lg:block text-xs font-black uppercase tracking-widest">{item.label}</span>
             </button>
           ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
           <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white shrink-0 uppercase">{user?.email?.charAt(0) || 'U'}</div>
              <div className="hidden lg:block min-w-0">
                 <p className="text-[10px] text-white font-black truncate leading-none mb-1">{user?.email}</p>
                 <button onClick={logout} className="text-[8px] text-slate-500 hover:text-rose-400 uppercase font-black truncate text-left w-full">SAIR / LOGOUT</button>
              </div>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 justify-between shrink-0">
          <div>
             {activeView === 'dashboard' && <h2 className="text-lg font-black text-slate-900 uppercase italic">Painel Executivo</h2>}
             {activeView === 'org' && <h2 className="text-lg font-black text-slate-900 uppercase italic">Gestores de Clientes</h2>}
              {activeView === 'assessments' && (
                <div className="flex items-center gap-4">
                   <h2 className="text-lg font-black text-slate-900 uppercase italic">Avaliação Atual</h2>
                   <div className="h-4 w-px bg-slate-200" />
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                     {companies.find(c => c.id === currentAssessment?.companyId)?.name || 'Empresa'} | 
                     {currentAssessment?.unitId || 'Unidade'}
                   </p>
                   {currentAssessment?.sectorBreakdown && Object.keys(currentAssessment.sectorBreakdown).length > 0 && (
                     <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1 ml-2">
                       <FolderTree size={12} className="text-blue-600" />
                       <select 
                         value={selectedSector}
                         onChange={(e) => setSelectedSector(e.target.value)}
                         className="bg-transparent text-[10px] font-black text-blue-700 uppercase tracking-widest outline-none cursor-pointer"
                       >
                         <option value="Geral">Visão: Global (Empresa)</option>
                         {Object.keys(currentAssessment.sectorBreakdown).map(sName => (
                           <option key={sName} value={sName}>Setor: {sName}</option>
                         ))}
                       </select>
                     </div>
                   )}
                </div>
              )}
          </div>

          {activeView === 'assessments' && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'survey', icon: Users, label: 'Dados' },
                { id: 'checklist', icon: ClipboardCheck, label: 'Checklist' },
                { id: 'triangulation', icon: BarChart3, label: 'Análise' },
                { id: 'sectoral', icon: LayoutGrid, label: 'Tabulação' },
                 { id: 'report', icon: FileText, label: 'PGR' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Geral</p>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-widest border border-emerald-100">SISTEMA ATIVO</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <DashboardView assessments={assessments} activeAssessment={activeAssessmentMerged} />
              </motion.div>
            )}

            {activeView === 'org' && (
              <motion.div key="org" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <OrgManagement 
                  companies={companies} 
                  onCreateCompany={async (name, cnpj) => {
                    await createCompany({ name, cnpj, units: [] });
                  }}
                  onUpdateCompany={updateCompany}
                  onDeleteCompany={deleteCompany}
                  assessments={assessments}
                />
              </motion.div>
            )}

            {activeView === 'assessments' && (
              <div key="assessments">
                {!currentAssessment ? (
                  <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
                     <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                        <FolderTree size={32} />
                     </div>
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nenhuma avaliação encontrada</h3>
                     <p className="text-sm text-slate-500 mt-2 mb-8 max-w-sm">Para iniciar, você deve primeiro cadastrar uma empresa e seus setores na aba "Empresas", e então criar uma nova avaliação aqui.</p>
                     
                     {companies.length > 0 ? (
                       <button 
                         onClick={async () => {
                           if (!selectedCompanyId) return;
                           const company = companies.find(c => c.id === selectedCompanyId);
                           if (!company) return;

                           const unit = company.units?.[0];
                           const sector = unit?.sectors?.[0];
                           const ges = sector?.ges?.[0];

                           await createAssessment({
                             companyId: company.id,
                             unitId: unit?.name || 'Geral',
                             sectorId: sector?.name || 'Geral',
                             gesId: ges || 'GES-1',
                             status: AssessmentStatus.ANALYZING,
                             startDate: new Date().toISOString().split('T')[0],
                             domains: INITIAL_DOMAIN_DATA,
                             checklist: { conforming: 0, partial: 0, nonConforming: 0, notApplicable: 0 },
                             triangulationScore: 0,
                             probability: 1,
                             severity: 1,
                             riskScore: 1,
                             actions: []
                           });
                         }}
                         className="px-10 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                       >
                         Iniciar Nova Avaliação
                       </button>
                     ) : (
                       <button 
                         onClick={() => setActiveView('org')}
                         className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                       >
                         Ir para Gestão de Empresas
                       </button>
                     )}
                  </div>
                ) : (
                  <>
                    {activeTab === 'survey' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <SurveyInput 
                          domains={activeDomains} 
                          setDomains={updateDomains} 
                          checklist={currentAssessment.checklist || { conforming: 0, partial: 0, nonConforming: 0, notApplicable: 0 }}
                          setChecklist={updateChecklist}
                          overallMeanEmployee={employeeOverallMean}
                          overallMeanManager={managerOverallMean}
                          sectorBreakdown={currentAssessment.sectorBreakdown}
                          setSectorBreakdown={updateSectorBreakdown}
                          onNewSectors={handleNewSectors}
                          onComplete={(newDomains, newSectorBreakdown) => {
                            if (!currentAssessment) return;
                            const payload = { id: currentAssessment.id, domains: newDomains, sectorBreakdown: newSectorBreakdown };
                            setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? { ...a, ...payload } : a));
                            saveAssessment(payload);
                            console.log('[ConexaRP] Atomic save ✅ sectors:', Object.keys(newSectorBreakdown));
                          }}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'checklist' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <ChecklistInput 
                          data={currentAssessment.checklist} 
                          setData={updateChecklist} 
                          criticality={checklistCriticality}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'triangulation' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <AnalysisView 
                          domains={activeDomains} 
                          checklist={currentAssessment.checklist}
                          checklistCriticality={checklistCriticality}
                          employeeOverallMean={employeeOverallMean}
                          managerOverallMean={managerOverallMean}
                          assessment={activeAssessmentMerged}
                          onUpdate={(updates) => {
                             if (selectedSector === 'Geral') {
                               setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? { ...a, ...updates } : a));
                               saveAssessment({ id: currentAssessment.id, ...updates });
                             } else {
                               const sectorData = currentAssessment.sectorBreakdown?.[selectedSector] || { domains: activeDomains };
                               const updatedSector = { ...sectorData, ...updates };
                               const newBreakdown = { ...currentAssessment.sectorBreakdown, [selectedSector]: updatedSector };
                               setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? { ...a, sectorBreakdown: newBreakdown } : a));
                               saveAssessment({ id: currentAssessment.id, sectorBreakdown: newBreakdown });
                             }
                          }}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'sectoral' && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                         <SectorAnalysisView 
                           assessment={currentAssessment} 
                           managerOverallMeanGlobal={managerOverallMean}
                           checklistCriticalityGlobal={checklistCriticality}
                         />
                       </motion.div>
                     )}

                     {activeTab === 'report' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <ReportGenerator 
                          assessment={activeAssessmentMerged}
                          checklistCriticality={checklistCriticality}
                          employeeOverallMean={employeeOverallMean}
                          managerOverallMean={managerOverallMean}
                          onConclude={() => {
                             setActiveView('dashboard');
                             setAssessments(prev => prev.map(a => a.id === currentAssessment.id ? { ...a, status: AssessmentStatus.COMPLETED } : a));
                             saveAssessment({ id: currentAssessment.id, status: AssessmentStatus.COMPLETED });
                          }}
                        />
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeView === 'inventory' && (
              <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <InventoryView assessments={assessments} />
              </motion.div>
            )}

            {activeView === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SettingsView 
                  companies={companies}
                  onDeleteCompany={deleteCompany}
                  onResetDatabase={resetDatabase}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
