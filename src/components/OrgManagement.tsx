import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Users2, 
  Plus, 
  ChevronRight,
  MoreVertical,
  LayoutGrid,
  X,
  Edit2,
  Trash2,
  ArrowLeft,
  FolderTree,
  Tag,
  BarChart3,
  RefreshCw,
  MessageCircle,
  Mail,
  UserCheck,
  Users,
  CheckSquare,
  Phone,
  Link2,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { Company, Unit, Sector, Assessment } from '../types';
import { googleWorkspaceBackendService } from '../services/GoogleWorkspaceBackendService';

interface OrgManagementProps {
  companies: Company[];
  onCreateCompany: (data: Partial<Company>) => Promise<any>;
  onUpdateCompany: (id: string, data: Partial<Company>) => Promise<any>;
  onDeleteCompany: (id: string) => Promise<void>;
  assessments: Assessment[];
}

export default function OrgManagement({ companies, onCreateCompany, onUpdateCompany, onDeleteCompany, assessments }: OrgManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCnpj, setNewCompanyCnpj] = useState('');
  const [newCompanyEmail1, setNewCompanyEmail1] = useState('');
  const [newCompanyEmail2, setNewCompanyEmail2] = useState('');
  const [newCompanyEmail3, setNewCompanyEmail3] = useState('');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [newCompanyManagerUrl, setNewCompanyManagerUrl] = useState('');
  const [newCompanyEmployeeUrl, setNewCompanyEmployeeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyCnpj, setEditCompanyCnpj] = useState('');
  const [editCompanyEmail1, setEditCompanyEmail1] = useState('');
  const [editCompanyEmail2, setEditCompanyEmail2] = useState('');
  const [editCompanyEmail3, setEditCompanyEmail3] = useState('');
  const [editCompanyPhone, setEditCompanyPhone] = useState('');
  const [editCompanyManagerUrl, setEditCompanyManagerUrl] = useState('');
  const [editCompanyEmployeeUrl, setEditCompanyEmployeeUrl] = useState('');
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Focus View State
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const activeCompany = companies.find(c => c.id === activeCompanyId);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Units Management Modals
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  const [showSectorModal, setShowSectorModal] = useState<string | null>(null); // holds unitId
  const [newSectorName, setNewSectorName] = useState('');

  // Link de Checklist Global Fixo
  const GLOBAL_CHECKLIST_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc_checklist_global_conexarp/viewform';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenGlobalChecklist = () => {
    const customUrl = localStorage.getItem('conexarp_global_checklist_url') || GLOBAL_CHECKLIST_URL;
    window.open(customUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = (url: string | undefined, label: string) => {
    if (!url || url.trim() === '') {
      showToast(`⚠️ Nenhum ${label.toLowerCase()} cadastrado para esta empresa.`);
      return;
    }
    navigator.clipboard.writeText(url);
    showToast(`✅ ${label} copiado com sucesso!`);
  };

  const handleOpenWhatsApp = (phone: string | undefined, companyName: string) => {
    if (!phone || phone.trim() === '') {
      showToast('⚠️ WhatsApp não cadastrado para esta empresa.');
      return;
    }
    const cleanNumber = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá, referente às Pesquisas Psicossociais da empresa ${companyName}:`);
    const whatsappUrl = cleanNumber 
      ? `https://wa.me/55${cleanNumber}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenEmail = (c: Company) => {
    const emails = [c.email1, c.email2, c.email3].filter(Boolean);
    if (emails.length === 0) {
      showToast('⚠️ Nenhum e-mail cadastrado para esta empresa.');
      return;
    }
    const subject = encodeURIComponent(`Andamento das Pesquisas Psicossociais - ${c.name}`);
    const mailtoUrl = `mailto:${emails.join(',')}?subject=${subject}`;
    window.location.href = mailtoUrl;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;
    setIsSubmitting(true);
    try {
      await onCreateCompany({ 
        name: newCompanyName, 
        cnpj: newCompanyCnpj,
        email1: newCompanyEmail1,
        email2: newCompanyEmail2,
        email3: newCompanyEmail3,
        phone: newCompanyPhone,
        managerSurveyUrl: newCompanyManagerUrl,
        employeeSurveyUrl: newCompanyEmployeeUrl,
        units: [] 
      });
      setShowModal(false);
      // Reset
      setNewCompanyName('');
      setNewCompanyCnpj('');
      setNewCompanyEmail1('');
      setNewCompanyEmail2('');
      setNewCompanyEmail3('');
      setNewCompanyPhone('');
      setNewCompanyManagerUrl('');
      setNewCompanyEmployeeUrl('');
      showToast('✅ Empresa criada com sucesso!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyId || !editCompanyName) return;
    setIsSubmitting(true);
    try {
      await onUpdateCompany(editCompanyId, { 
        name: editCompanyName, 
        cnpj: editCompanyCnpj,
        email1: editCompanyEmail1,
        email2: editCompanyEmail2,
        email3: editCompanyEmail3,
        phone: editCompanyPhone,
        managerSurveyUrl: editCompanyManagerUrl,
        employeeSurveyUrl: editCompanyEmployeeUrl
      });
      setEditCompanyId(null);
      showToast('✅ Empresa e contatos atualizados com sucesso!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await onDeleteCompany(deleteId);
      setDeleteId(null);
      if (activeCompanyId === deleteId) setActiveCompanyId(null);
      showToast('Empresa excluída com sucesso.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (c: Company) => {
    setEditCompanyId(c.id);
    setEditCompanyName(c.name || '');
    setEditCompanyCnpj(c.cnpj || '');
    setEditCompanyEmail1(c.email1 || '');
    setEditCompanyEmail2(c.email2 || '');
    setEditCompanyEmail3(c.email3 || '');
    setEditCompanyPhone(c.phone || '');
    setEditCompanyManagerUrl(c.managerSurveyUrl || '');
    setEditCompanyEmployeeUrl(c.employeeSurveyUrl || '');
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !newUnitName) return;
    setIsSubmitting(true);
    try {
       const newUnit: Unit = { id: Date.now().toString(), name: newUnitName, sectors: [] };
       await onUpdateCompany(activeCompany.id, { units: [...(activeCompany.units || []), newUnit] });
       setShowUnitModal(false);
       setNewUnitName('');
    } catch(err) {
       console.error(err);
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleAddSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !showSectorModal || !newSectorName) return;
    setIsSubmitting(true);
    try {
       const newSector: Sector = { id: Date.now().toString(), name: newSectorName, ges: [] };
       const updatedUnits = activeCompany.units.map(u => 
          u.id === showSectorModal ? { ...u, sectors: [...(u.sectors || []), newSector] } : u
       );
       await onUpdateCompany(activeCompany.id, { units: updatedUnits });
       setShowSectorModal(null);
       setNewSectorName('');
    } catch(err) {
       console.error(err);
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
     if (!activeCompany || !window.confirm('Tem certeza que deseja excluir esta unidade?')) return;
     const updatedUnits = activeCompany.units.filter(u => u.id !== unitId);
     await onUpdateCompany(activeCompany.id, { units: updatedUnits });
  };

  const handleDeleteSector = async (unitId: string, sectorId: string) => {
     if (!activeCompany || !window.confirm('Tem certeza que deseja excluir este setor?')) return;
     const updatedUnits = activeCompany.units.map(u => 
        u.id === unitId ? { ...u, sectors: u.sectors.filter(s => s.id !== sectorId) } : u
     );
     await onUpdateCompany(activeCompany.id, { units: updatedUnits });
  };

  const handleAddGes = async (unitId: string, sectorId: string) => {
     const gesName = window.prompt('Digite o nome do GES (Grupo de Exposição Similar):');
     if (!gesName || !activeCompany) return;
     
     setIsSubmitting(true);
     try {
       const updatedUnits = activeCompany.units.map(u => 
          u.id === unitId ? { 
             ...u, 
             sectors: u.sectors.map(s => 
               s.id === sectorId && !s.ges?.includes(gesName) 
                 ? { ...s, ges: [...(s.ges || []), gesName] } 
                 : s
             ) 
          } : u
       );
       await onUpdateCompany(activeCompany.id, { units: updatedUnits });
     } catch(err) {
       console.error(err);
     } finally {
       setIsSubmitting(false);
     }
  };

  const handleRemoveGes = async (unitId: string, sectorId: string, gesName: string) => {
     if (!activeCompany || !window.confirm(`Remover GES "${gesName}"?`)) return;
     setIsSubmitting(true);
     try {
       const updatedUnits = activeCompany.units.map(u => 
          u.id === unitId ? { 
             ...u, 
             sectors: u.sectors.map(s => 
               s.id === sectorId 
                 ? { ...s, ges: s.ges?.filter(g => g !== gesName) || [] } 
                 : s
             ) 
          } : u
       );
       await onUpdateCompany(activeCompany.id, { units: updatedUnits });
     } catch(err) {
       console.error(err);
     } finally {
       setIsSubmitting(false);
     }
  };

  const [isSyncingMaster, setIsSyncingMaster] = useState(false);

  const handleSyncMasterSheet = async () => {
    setIsSyncingMaster(true);
    try {
      showToast('🔄 Conectando e sincronizando dados com a Planilha Mestra...');
      const syncResult = await googleWorkspaceBackendService.syncMasterSheet(undefined, true);
      const summaryEntries = Object.values(syncResult.companiesSummary || {});

      if (!summaryEntries || summaryEntries.length === 0) {
        showToast('⚠️ Nenhuma empresa encontrada na Planilha Mestra.');
        return;
      }

      const normalizeCompName = (str: string) => {
        return str
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Z0-9\s]/g, '')
          .replace(/\b(LTDA|SA|ME|EPP|EIRELI|SS)\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };

      let updatedCompaniesCount = 0;

      for (const compSummary of summaryEntries) {
        const compName = compSummary.empresaName;
        const compNameUpper = compName.toUpperCase().trim();
        const itemId = `master_${compNameUpper.replace(/\s+/g, '_')}`;
        const cleanSheetComp = normalizeCompName(compName);

        // 1. Verifica vínculo manual salvo na aba de pesquisas
        const manualLinkedCompanyId = localStorage.getItem(`conexarp_company_manual_link_${itemId}`);

        // 2. Localiza a empresa no ConexaRP (por vínculo manual prioritário ou correspondência de nome)
        const matchedCompany = manualLinkedCompanyId
          ? companies.find(c => c.id === manualLinkedCompanyId)
          : companies.find(c => {
              const dbNameUpper = c.name.toUpperCase().trim();
              const cleanDbComp = normalizeCompName(c.name);
              return (
                dbNameUpper === compNameUpper ||
                dbNameUpper.includes(compNameUpper) ||
                compNameUpper.includes(dbNameUpper) ||
                (cleanSheetComp.length > 2 && cleanDbComp === cleanSheetComp) ||
                (cleanSheetComp.length > 2 && (cleanDbComp.includes(cleanSheetComp) || cleanSheetComp.includes(cleanDbComp)))
              );
            });

        if (matchedCompany) {
          const updatesToApply: Partial<Company> = {};

          const email1 = compSummary.email1;
          const email2 = compSummary.email2;
          const email3 = compSummary.email3;
          const phone = compSummary.phone;
          const employeeSurveyUrl = compSummary.employeeSurveyUrl || (matchedCompany as any).collabForm?.formUrl;
          const managerSurveyUrl = compSummary.managerSurveyUrl || (matchedCompany as any).managerForm?.formUrl;

          if (email1 && email1.trim() && matchedCompany.email1 !== email1.trim()) updatesToApply.email1 = email1.trim();
          if (email2 && email2.trim() && matchedCompany.email2 !== email2.trim()) updatesToApply.email2 = email2.trim();
          if (email3 && email3.trim() && matchedCompany.email3 !== email3.trim()) updatesToApply.email3 = email3.trim();
          if (phone && phone.trim() && matchedCompany.phone !== phone.trim()) updatesToApply.phone = phone.trim();
          if (employeeSurveyUrl && employeeSurveyUrl.trim() && matchedCompany.employeeSurveyUrl !== employeeSurveyUrl.trim()) {
            updatesToApply.employeeSurveyUrl = employeeSurveyUrl.trim();
          }
          if (managerSurveyUrl && managerSurveyUrl.trim() && matchedCompany.managerSurveyUrl !== managerSurveyUrl.trim()) {
            updatesToApply.managerSurveyUrl = managerSurveyUrl.trim();
          }

          if (Object.keys(updatesToApply).length > 0) {
            await onUpdateCompany(matchedCompany.id, updatesToApply);
            updatedCompaniesCount++;
          }
        }
      }

      showToast(`✅ ${updatedCompaniesCount} empresa(s) sincronizadas com a Planilha Mestra!`);
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Erro ao ler Planilha Mestra: ${err.message || 'Falha de conexão'}`);
    } finally {
      setIsSyncingMaster(false);
    }
  };

  React.useEffect(() => {
    if (companies && companies.length > 0) {
      handleSyncMasterSheet();
    }
  }, []);

  const handleSyncHistoricalSectors = async () => {
    if (!companies || companies.length === 0 || !assessments || assessments.length === 0) {
      showToast('⚠️ Nenhuma empresa ou avaliação carregada para sincronização.');
      return;
    }

    setIsSubmitting(true);
    try {
      let updatedCount = 0;
      for (const comp of companies) {
        const compAssessments = assessments.filter(a => a.companyId === comp.id || (a as any).companyName?.toUpperCase() === comp.name?.toUpperCase());
        if (compAssessments.length === 0) continue;

        const currentUnits = [...(comp.units || [])];
        let unitsModified = false;

        compAssessments.forEach(ass => {
          if (ass.unitBreakdown) {
            Object.entries(ass.unitBreakdown).forEach(([unitName, unitData]: [string, any]) => {
              let targetUnit = currentUnits.find(u => u.name.toUpperCase().trim() === unitName.toUpperCase().trim());
              if (!targetUnit) {
                targetUnit = { id: Date.now().toString() + Math.random(), name: unitName, sectors: [] };
                currentUnits.push(targetUnit);
                unitsModified = true;
              }

              if (unitData.sectorBreakdown) {
                Object.keys(unitData.sectorBreakdown).forEach(sectorName => {
                  let targetSector = targetUnit!.sectors.find(s => s.name.toUpperCase().trim() === sectorName.toUpperCase().trim());
                  if (!targetSector) {
                    targetSector = { id: Date.now().toString() + Math.random(), name: sectorName, ges: [] };
                    targetUnit!.sectors.push(targetSector);
                    unitsModified = true;
                  }
                });
              }
            });
          }

          if (ass.sectorBreakdown && currentUnits.length > 0) {
            const firstUnit = currentUnits[0];
            Object.keys(ass.sectorBreakdown).forEach(sectorName => {
              let targetSector = firstUnit.sectors.find(s => s.name.toUpperCase().trim() === sectorName.toUpperCase().trim());
              if (!targetSector) {
                targetSector = { id: Date.now().toString() + Math.random(), name: sectorName, ges: [] };
                firstUnit.sectors.push(targetSector);
                unitsModified = true;
              }
            });
          }
        });

        if (unitsModified) {
          await onUpdateCompany(comp.id, { units: currentUnits });
          updatedCount++;
        }
      }

      showToast(`✅ Sincronização concluída! ${updatedCount} empresas foram atualizadas.`);
    } catch (e: any) {
      console.error(e);
      showToast('❌ Erro durante a sincronização de setores.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Focus View (Gerenciamento Detalhado de Unidades & Setores da Empresa Selecionada)
  if (activeCompany) {
     return (
        <div className="space-y-6 animate-in fade-in duration-200">
           <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                 <button onClick={() => setActiveCompanyId(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all" title="Voltar para Empresas">
                    <ArrowLeft size={20} />
                 </button>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                       <Building2 size={22} className="text-blue-600" />
                       {activeCompany.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                       CNPJ: {activeCompany.cnpj || 'Não informado'} | Estrutura de Unidades, Setores & GES
                    </p>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                 <button 
                    onClick={() => openEdit(activeCompany)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                 >
                    <Edit2 size={15} /> Editar Dados
                 </button>
                 <button 
                    onClick={() => setShowUnitModal(true)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                 >
                    <Plus size={15} /> Nova Unidade
                 </button>
              </div>
           </div>

           {/* Grid de Unidades */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(!activeCompany.units || activeCompany.units.length === 0) ? (
                 <div className="col-span-2 bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                       <MapPin size={24} />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Nenhuma Unidade Cadastrada</h4>
                    <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                       Clique no botão "Nova Unidade" para adicionar plantas, filiais ou escritórios desta organização.
                    </p>
                 </div>
              ) : (
                 activeCompany.units.map(unit => (
                    <div key={unit.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all space-y-4 p-6">
                       <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <MapPin size={18} />
                             </div>
                             <div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">{unit.name}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{(unit.sectors || []).length} Setores Mapeados</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-1">
                             <button onClick={() => setShowSectorModal(unit.id)} className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all text-xs font-black uppercase flex items-center gap-1">
                                <Plus size={14} /> Setor
                             </button>
                             <button onClick={() => handleDeleteUnit(unit.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Excluir Unidade">
                                <Trash2 size={15} />
                             </button>
                          </div>
                       </div>

                       {/* Setores */}
                       <div className="space-y-3">
                          {(!unit.sectors || unit.sectors.length === 0) ? (
                             <p className="text-xs text-slate-400 italic">Nenhum setor adicionado nesta unidade.</p>
                          ) : (
                             unit.sectors.map(sector => (
                                <div key={sector.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                                   <div className="flex justify-between items-center">
                                      <span className="font-black text-slate-800 uppercase text-xs flex items-center gap-1.5">
                                         <FolderTree size={14} className="text-slate-400" /> {sector.name}
                                      </span>
                                      <div className="flex items-center gap-1">
                                         <button onClick={() => handleAddGes(unit.id, sector.id)} className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1">
                                            <Plus size={11} /> GES
                                         </button>
                                         <button onClick={() => handleDeleteSector(unit.id, sector.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                                            <Trash2 size={13} />
                                         </button>
                                      </div>
                                   </div>

                                   {/* Tags de GES */}
                                   <div className="flex flex-wrap gap-1.5 pt-1">
                                      {(!sector.ges || sector.ges.length === 0) ? (
                                         <span className="text-[10px] text-slate-400 italic font-medium">Sem GES associado</span>
                                      ) : (
                                         sector.ges.map((g, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/70 border border-emerald-300/70 text-emerald-900 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-2xs">
                                               <Tag size={11} className="text-emerald-700" />
                                               {g}
                                               <button onClick={() => handleRemoveGes(unit.id, sector.id, g)} className="hover:text-rose-600 transition-colors ml-0.5">
                                                  <X size={11} />
                                               </button>
                                            </span>
                                         ))
                                      )}
                                   </div>
                                </div>
                             ))
                          )}
                       </div>
                    </div>
                 ))
              )}
           </div>

           {/* Modal Nova Unidade */}
           {showUnitModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
                 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                    <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/80">
                       <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Adicionar Nova Unidade</h3>
                       <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-rose-600 transition-colors">
                          <X size={18} />
                       </button>
                    </div>
                    <form onSubmit={handleAddUnit} className="p-6 space-y-4">
                       <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Nome da Unidade / Filial</label>
                          <input 
                             type="text" 
                             value={newUnitName}
                             onChange={e => setNewUnitName(e.target.value)}
                             required
                             placeholder="Ex: Matriz São Paulo ou Planta Industrial 01"
                             className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                             autoFocus
                          />
                       </div>
                       <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all"
                       >
                          {isSubmitting ? 'Salvando...' : 'Adicionar Unidade'}
                       </button>
                    </form>
                 </div>
              </div>
           )}

           {/* Modal Novo Setor */}
           {showSectorModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
                 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                    <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/80">
                       <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Adicionar Novo Setor</h3>
                       <button onClick={() => setShowSectorModal(null)} className="text-slate-400 hover:text-rose-600 transition-colors">
                          <X size={18} />
                       </button>
                    </div>
                    <form onSubmit={handleAddSector} className="p-6 space-y-4">
                       <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Nome do Setor / Departamento</label>
                          <input 
                             type="text" 
                             value={newSectorName}
                             onChange={e => setNewSectorName(e.target.value)}
                             required
                             placeholder="Ex: Produção, Recursos Humanos, Manutenção"
                             className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                             autoFocus
                          />
                       </div>
                       <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all"
                       >
                          {isSubmitting ? 'Salvando...' : 'Adicionar Setor'}
                       </button>
                    </form>
                 </div>
              </div>
           )}
        </div>
     );
  }

  return (
    <div className="space-y-6">
      {/* Header com Ações Globais */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
         <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
               <Building2 size={24} className="text-blue-600" />
               Gestão de Organizações
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
               Estrutura de Empresas, Contatos do Responsável e Links Metodológicos
            </p>
         </div>

         <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
             <button 
                onClick={handleSyncMasterSheet}
                disabled={isSyncingMaster}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 rounded-2xl text-xs font-black uppercase tracking-wider shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                title="Importar e atualizar contatos e links de pesquisas da Planilha Mestra do Google Sheets"
             >
                <RefreshCw size={14} className={isSyncingMaster ? "animate-spin text-blue-600" : "text-blue-600"} />
                {isSyncingMaster ? 'Sincronizando...' : 'Sincronizar Planilha Mestra'}
             </button>

            <button 
               onClick={handleSyncHistoricalSectors}
               disabled={isSubmitting}
               className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
               title="Puxar setores das avaliações históricas"
            >
               <RefreshCw size={14} className={isSubmitting ? "animate-spin" : ""} />
               Sincronizar Setores
            </button>

            {/* Requisito 3: Botão de Checklist Global */}
            <button 
               onClick={handleOpenGlobalChecklist}
               className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl text-xs font-black uppercase tracking-wider shadow-2xs hover:shadow-xs transition-all active:scale-95"
               title="Abrir o Checklist Global de Conformidade Psicossocial em nova aba"
            >
               <CheckSquare size={15} className="text-emerald-600" />
               Checklist Global
            </button>

            <button 
               onClick={() => setShowModal(true)}
               className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-slate-900/20 active:scale-95"
            >
               <Plus size={15} />
               Nova Empresa
            </button>
         </div>
      </div>

      {/* Requisito 1: Modal Unificado de Criação / Edição com Form Estilo Apple e Seções */}
      {(showModal || editCompanyId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/80 flex flex-col max-h-[90vh]">
             
             <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-base flex items-center gap-2">
                     <Building2 size={20} className="text-blue-600" />
                     {editCompanyId ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                     Gerencie dados cadastrais, contatos do responsável e links metodológicos de pesquisa.
                  </p>
                </div>
                <button 
                   type="button"
                   onClick={() => { setEditCompanyId(null); setShowModal(false); }} 
                   className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                   <X size={20} />
                </button>
             </div>

             <form onSubmit={editCompanyId ? handleUpdate : handleCreate} className="overflow-y-auto p-6 space-y-6 flex-1">
                
                {/* Seção 1: Dados Cadastrais */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Building2 size={16} className="text-slate-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                         1. Dados Cadastrais
                      </h4>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            Razão Social *
                         </label>
                         <input 
                            type="text" 
                            value={editCompanyId ? editCompanyName : newCompanyName}
                            onChange={e => editCompanyId ? setEditCompanyName(e.target.value) : setNewCompanyName(e.target.value)}
                            required
                            placeholder="Ex: Indústria Têxtil Ltda"
                            className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                         />
                      </div>

                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            CNPJ
                         </label>
                         <input 
                            type="text" 
                            value={editCompanyId ? editCompanyCnpj : newCompanyCnpj}
                            onChange={e => editCompanyId ? setEditCompanyCnpj(e.target.value) : setNewCompanyCnpj(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                         />
                      </div>
                   </div>
                </div>

                {/* Seção 2: Contatos do Responsável */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Phone size={16} className="text-slate-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                         2. Contatos do Responsável
                      </h4>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            E-mail 1 (Principal)
                         </label>
                         <input 
                            type="email" 
                            value={editCompanyId ? editCompanyEmail1 : newCompanyEmail1}
                            onChange={e => editCompanyId ? setEditCompanyEmail1(e.target.value) : setNewCompanyEmail1(e.target.value)}
                            placeholder="responsavel@empresa.com.br"
                            className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                         />
                      </div>

                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            WhatsApp / Telefone do Responsável
                         </label>
                         <input 
                            type="text" 
                            value={editCompanyId ? editCompanyPhone : newCompanyPhone}
                            onChange={e => editCompanyId ? setEditCompanyPhone(e.target.value) : setNewCompanyPhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                         />
                      </div>

                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            E-mail 2 (Secundário - Opcional)
                         </label>
                         <input 
                            type="email" 
                            value={editCompanyId ? editCompanyEmail2 : newCompanyEmail2}
                            onChange={e => editCompanyId ? setEditCompanyEmail2(e.target.value) : setNewCompanyEmail2(e.target.value)}
                            placeholder="rh@empresa.com.br"
                            className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                         />
                      </div>

                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            E-mail 3 (Adicional - Opcional)
                         </label>
                         <input 
                            type="email" 
                            value={editCompanyId ? editCompanyEmail3 : newCompanyEmail3}
                            onChange={e => editCompanyId ? setEditCompanyEmail3(e.target.value) : setNewCompanyEmail3(e.target.value)}
                            placeholder="diretoria@empresa.com.br"
                            className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                         />
                      </div>
                   </div>
                </div>

                {/* Seção 3: Links de Pesquisa Específicos */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Link2 size={16} className="text-slate-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                         3. Links de Pesquisa Específicos
                      </h4>
                   </div>

                   <div className="space-y-4">
                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            Link da Pesquisa (Gestores)
                         </label>
                         <input 
                            type="url" 
                            value={editCompanyId ? editCompanyManagerUrl : newCompanyManagerUrl}
                            onChange={e => editCompanyId ? setEditCompanyManagerUrl(e.target.value) : setNewCompanyManagerUrl(e.target.value)}
                            placeholder="https://forms.google.com/..."
                            className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                         />
                      </div>

                      <div>
                         <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                            Link da Pesquisa (Colaboradores)
                         </label>
                         <input 
                            type="url" 
                            value={editCompanyId ? editCompanyEmployeeUrl : newCompanyEmployeeUrl}
                            onChange={e => editCompanyId ? setEditCompanyEmployeeUrl(e.target.value) : setNewCompanyEmployeeUrl(e.target.value)}
                            placeholder="https://forms.google.com/..."
                            className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                   <button 
                      type="button" 
                      onClick={() => { setEditCompanyId(null); setShowModal(false); }}
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                   >
                      Cancelar
                   </button>
                   <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                   >
                      {isSubmitting ? 'Salvando...' : (editCompanyId ? 'Salvar Alterações' : 'Cadastrar Empresa')}
                   </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Trash2 size={32} />
                </div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight mb-2">Excluir Empresa?</h3>
                <p className="text-slate-500 text-xs mb-6 font-medium">
                  Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todas as unidades e setores vinculados serão removidos.
                </p>
                <div className="flex gap-3">
                   <button 
                      onClick={() => setDeleteId(null)}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-slate-200 transition-colors"
                   >
                      Cancelar
                   </button>
                   <button 
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-rose-500 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-rose-600/20"
                   >
                      {isSubmitting ? 'Excluindo...' : 'Excluir'}
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Requisito 2: Cards das Empresas com Rodapé de Ações Rápidas & Feedback Toast */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
         {companies.map(company => (
           <div 
             key={company.id} 
             className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
           >
             {/* Header do Card */}
             <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-3">
                   <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 text-blue-600 shadow-2xs">
                     <Building2 size={22} />
                   </div>
                   <div className="flex gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => openEdit(company)}
                         className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                         title="Editar Empresa & Links"
                      >
                         <Edit2 size={15} />
                      </button>
                      <button 
                         onClick={() => setDeleteId(company.id)}
                         className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                         title="Excluir Empresa"
                      >
                         <Trash2 size={15} />
                      </button>
                   </div>
                </div>

                <h3 className="font-black text-slate-900 uppercase tracking-tight text-base leading-snug mb-1">
                   {company.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                   <span>CNPJ: {company.cnpj || 'Não informado'}</span>
                   {company.phone && (
                     <span className="text-emerald-600 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                        📱 {company.phone}
                     </span>
                   )}
                </div>
             </div>
             
             {/* Corpo do Card: Unidades */}
             <div className="p-4 space-y-3 flex-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                   <span className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> Unidades ({company.units?.length || 0})</span>
                </div>
                
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                   {(!company.units || company.units.length === 0) ? (
                      <p className="text-[11px] text-slate-400 italic">Nenhuma unidade cadastrada.</p>
                   ) : (
                      company.units.map(unit => (
                        <div key={unit.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-2xl group/unit hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setActiveCompanyId(company.id)}>
                           <div>
                              <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{unit.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{(unit.sectors || []).length} Setores | GES Ativos</p>
                           </div>
                           <ChevronRight size={14} className="text-slate-300 group-hover/unit:text-blue-500 transform group-hover/unit:translate-x-1 transition-all" />
                        </div>
                      ))
                   )}
                </div>
             </div>
             
             {/* Rodapé 1: Botão de Gerenciar Unidades */}
             <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100">
                <button 
                   onClick={() => setActiveCompanyId(company.id)} 
                   className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700 tracking-wider hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-1.5"
                >
                   <FolderTree size={13} /> Gerenciar Unidades & Setores
                </button>
             </div>

             {/* Rodapé 2: Barra Discreta de Ações Rápidas (WhatsApp, Mail, Copiar Link Gestor, Copiar Link Colab) */}
             <div className="px-4 py-3 bg-slate-100/70 backdrop-blur-sm border-t border-slate-200/60 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                   {/* WhatsApp */}
                   <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(company.phone, company.name)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-xl border border-emerald-200/70 shadow-2xs transition-all active:scale-95 flex items-center justify-center group/wa"
                      title={company.phone ? `WhatsApp: ${company.phone}` : 'Abrir WhatsApp'}
                   >
                      <MessageCircle size={15} className="group-hover/wa:scale-110 transition-transform" />
                   </button>

                   {/* Email */}
                   <button
                      type="button"
                      onClick={() => handleOpenEmail(company)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-xl border border-blue-200/70 shadow-2xs transition-all active:scale-95 flex items-center justify-center group/mail"
                      title={company.email1 ? `E-mail: ${company.email1}` : 'Enviar E-mail'}
                   >
                      <Mail size={15} className="group-hover/mail:scale-110 transition-transform" />
                   </button>
                </div>

                <div className="flex items-center gap-1.5">
                   {/* Copiar Link Gestor */}
                   <button
                      type="button"
                      onClick={() => handleCopyLink(company.managerSurveyUrl, 'Link Gestor')}
                      className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 ${
                         company.managerSurveyUrl 
                           ? 'bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200 hover:border-amber-300' 
                           : 'bg-slate-100 text-slate-400 border-slate-200/60 opacity-60'
                      }`}
                      title="Copiar Link da Pesquisa dos Gestores"
                   >
                      <UserCheck size={13} className={company.managerSurveyUrl ? 'text-amber-600' : 'text-slate-400'} />
                      <span>Gestor</span>
                   </button>

                   {/* Copiar Link Colab */}
                   <button
                      type="button"
                      onClick={() => handleCopyLink(company.employeeSurveyUrl, 'Link Colaborador')}
                      className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 ${
                         company.employeeSurveyUrl 
                           ? 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border-slate-200 hover:border-blue-300' 
                           : 'bg-slate-100 text-slate-400 border-slate-200/60 opacity-60'
                      }`}
                      title="Copiar Link da Pesquisa dos Colaboradores"
                   >
                      <Users size={13} className={company.employeeSurveyUrl ? 'text-blue-600' : 'text-slate-400'} />
                      <span>Colab</span>
                   </button>
                </div>
             </div>

           </div>
         ))}

         {/* Card Botão Adicionar Nova Empresa */}
         <button 
           onClick={() => setShowModal(true)} 
           className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition-all group min-h-[260px]"
         >
            <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors group-hover:shadow-sm border border-slate-200/60">
               <Plus size={28} />
            </div>
            <span className="text-xs font-black uppercase tracking-wider leading-none">Cadastrar Nova Empresa</span>
         </button>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
           <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
           <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}