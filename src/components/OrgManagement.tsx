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
  BarChart3
} from 'lucide-react';
import { Company, Unit, Sector, Assessment } from '../types';
interface OrgManagementProps {
  companies: Company[];
  onCreateCompany: (name: string, cnpj: string) => Promise<void>;
  onUpdateCompany: (id: string, data: Partial<Company>) => Promise<void>;
  onDeleteCompany: (id: string) => Promise<void>;
  assessments: Assessment[];
}

export default function OrgManagement({ companies, onCreateCompany, onUpdateCompany, onDeleteCompany, assessments }: OrgManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCnpj, setNewCompanyCnpj] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyCnpj, setEditCompanyCnpj] = useState('');
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Focus View State
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const activeCompany = companies.find(c => c.id === activeCompanyId);

  // Units Management Modals
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  const [showSectorModal, setShowSectorModal] = useState<string | null>(null); // holds unitId
  const [newSectorName, setNewSectorName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newCompanyCnpj) return;
    setIsSubmitting(true);
    try {
      await onCreateCompany(newCompanyName, newCompanyCnpj);
      setShowModal(false);
      setNewCompanyName('');
      setNewCompanyCnpj('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyId || !editCompanyName || !editCompanyCnpj) return;
    setIsSubmitting(true);
    try {
      await onUpdateCompany(editCompanyId, { name: editCompanyName, cnpj: editCompanyCnpj });
      setEditCompanyId(null);
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (c: Company) => {
    setEditCompanyId(c.id);
    setEditCompanyName(c.name);
    setEditCompanyCnpj(c.cnpj);
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

  if (activeCompany) {
     return (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                 <button onClick={() => setActiveCompanyId(null)} className="p-2 justify-center bg-slate-50 text-slate-500 rounded hover:bg-slate-100 transition-colors">
                    <ArrowLeft size={18} />
                 </button>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">{activeCompany.name}</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gestão de Unidades e Setores | CNPJ: {activeCompany.cnpj}</p>
                 </div>
              </div>
              <button 
                 onClick={() => setShowUnitModal(true)}
                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg active:scale-95"
              >
                 <Plus size={14} />
                 Nova Unidade
              </button>
           </div>

           {/* UNITS AND SECTORS DISPLAY */}
           {!(activeCompany.units?.length > 0) ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-16 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-white shadow-sm border border-slate-200 text-slate-400 flex items-center justify-center rounded-full mb-4">
                    <MapPin size={24} />
                 </div>
                 <h3 className="font-black text-slate-800 uppercase tracking-tight mb-2">Nenhuma unidade cadastrada</h3>
                 <p className="text-sm text-slate-500 mb-6 max-w-sm">Cadastre a primeira unidade operacional (ex: Matriz, Filial Norte, Planta Industrial) para começar a estruturar os setores.</p>
                 <button onClick={() => setShowUnitModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-colors shadow shadow-blue-600/20">
                    Cadastrar Unidade
                 </button>
              </div>
           ) : (
              <div className="space-y-6">
                 {activeCompany.units.map(unit => (
                    <div key={unit.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                       <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <Building2 size={20} />
                             </div>
                             <div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                   {unit.name}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{(unit.sectors || []).length} Setores cadastrados</p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => setShowSectorModal(unit.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 rounded text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center gap-1.5 shadow-sm">
                                <Plus size={12} /> Setor
                             </button>
                             <button onClick={() => handleDeleteUnit(unit.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded bg-white border border-slate-200 shadow-sm transition-colors">
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                       
                       <div className="p-4">
                          {!(unit.sectors?.length > 0) ? (
                             <p className="text-xs text-slate-400 font-medium italic text-center py-4 bg-slate-50/50 rounded border border-dashed border-slate-200">
                                Nenhum setor cadastrado nesta unidade.
                             </p>
                          ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {unit.sectors.map(sector => (
                                   <div key={sector.id} className="flex items-start justify-between p-3 border border-slate-100 rounded-lg bg-white hover:border-blue-200 transition-colors group">
                                      <div className="flex gap-3 items-start">
                                         <FolderTree size={16} className="text-slate-400 mt-0.5" />
                                         <div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5 flex items-center gap-2">
                                               {sector.name}
                                               {(() => {
                                                  const assessment = assessments.find(a => 
                                                     a.companyId === activeCompany.id && 
                                                     a.unitId === unit.name
                                                  );
                                                  const sectorData = assessment?.sectorBreakdown?.[sector.name];
                                                  const score = sectorData?.triangulationScore || 0;
                                                  
                                                  if (score > 0) {
                                                     const color = score >= 0.7 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                                   score >= 0.4 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                                   'bg-rose-50 text-rose-600 border-rose-100';
                                                     return (
                                                        <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase flex items-center gap-1 ${color}`} title="Índice de Convergência">
                                                           <BarChart3 size={8} /> {score.toFixed(3)}
                                                        </span>
                                                     );
                                                  }
                                                  return null;
                                               })()}
                                            </h4>
                                            <div className="flex flex-wrap gap-1 items-center">
                                               {sector.ges?.map((ges, idx) => (
                                                  <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase flex items-center gap-1 group/ges">
                                                     <Tag size={8} /> {ges}
                                                     <button 
                                                        onClick={() => handleRemoveGes(unit.id, sector.id, ges)}
                                                        className="opacity-0 group-hover/ges:opacity-100 hover:text-rose-500 transition-opacity ml-1"
                                                     >
                                                        <X size={10} />
                                                     </button>
                                                  </span>
                                               ))}
                                               <button 
                                                  onClick={() => handleAddGes(unit.id, sector.id)} 
                                                  className="px-1.5 py-0.5 border border-dashed border-slate-300 text-slate-400 rounded text-[8px] font-black uppercase hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                                               >
                                                  <Plus size={8} /> ADD GES
                                               </button>
                                            </div>
                                         </div>
                                      </div>
                                      <button onClick={() => handleDeleteSector(unit.id, sector.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1 transition-all">
                                         <Trash2 size={12} />
                                      </button>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           )}

           {/* ADD UNIT MODAL */}
           {showUnitModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                  <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                     <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Nova Unidade</h3>
                     <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <X size={18} />
                     </button>
                  </div>
                  <form onSubmit={handleAddUnit} className="p-5 space-y-4">
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Nome da Unidade</label>
                        <input 
                           type="text" 
                           value={newUnitName}
                           onChange={e => setNewUnitName(e.target.value)}
                           required
                           placeholder="Ex: Filial Sul"
                           className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                        />
                     </div>
                     <div className="pt-2">
                        <button 
                           type="submit" 
                           disabled={isSubmitting}
                           className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 transition-all"
                        >
                           {isSubmitting ? 'Salvando...' : 'Criar Unidade'}
                        </button>
                     </div>
                  </form>
                </div>
             </div>
           )}

           {/* ADD SECTOR MODAL */}
           {showSectorModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                  <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                     <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Novo Setor</h3>
                     <button onClick={() => setShowSectorModal(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <X size={18} />
                     </button>
                  </div>
                  <form onSubmit={handleAddSector} className="p-5 space-y-4">
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Nome do Setor</label>
                        <input 
                           type="text" 
                           value={newSectorName}
                           onChange={e => setNewSectorName(e.target.value)}
                           required
                           placeholder="Ex: Operações de Solda"
                           className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                        />
                     </div>
                     <div className="pt-2">
                        <button 
                           type="submit" 
                           disabled={isSubmitting}
                           className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 transition-all"
                        >
                           {isSubmitting ? 'Salvando...' : 'Criar Setor'}
                        </button>
                     </div>
                  </form>
                </div>
             </div>
           )}

        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Estrutura Organizacional</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gestão de Empresas, Unidades e Setores</p>
         </div>
         <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
         >
            <Plus size={14} />
            Nova Empresa
         </button>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Cadastrar Nova Empresa</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                   <X size={18} />
                </button>
             </div>
             <form onSubmit={handleCreate} className="p-5 space-y-4">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Razão Social</label>
                   <input 
                      type="text" 
                      value={newCompanyName}
                      onChange={e => setNewCompanyName(e.target.value)}
                      required
                      placeholder="Ex: Indústria Têxtil Ltda"
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">CNPJ</label>
                   <input 
                      type="text" 
                      value={newCompanyCnpj}
                      onChange={e => setNewCompanyCnpj(e.target.value)}
                      required
                      placeholder="00.000.000/0001-00"
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                   />
                </div>
                <div className="pt-2">
                   <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 transition-all"
                   >
                      {isSubmitting ? 'Salvando...' : 'Adicionar Empresa'}
                   </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editCompanyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Editar Empresa</h3>
                <button onClick={() => setEditCompanyId(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                   <X size={18} />
                </button>
             </div>
             <form onSubmit={handleUpdate} className="p-5 space-y-4">
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Razão Social</label>
                   <input 
                      type="text" 
                      value={editCompanyName}
                      onChange={e => setEditCompanyName(e.target.value)}
                      required
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">CNPJ</label>
                   <input 
                      type="text" 
                      value={editCompanyCnpj}
                      onChange={e => setEditCompanyCnpj(e.target.value)}
                      required
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                   />
                </div>
                <div className="pt-2">
                   <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 text-white rounded text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 transition-all"
                   >
                      {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                   </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Trash2 size={32} />
                </div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight mb-2">Excluir Empresa?</h3>
                <p className="text-slate-500 text-sm mb-6">Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todas as unidades e setores vinculados serão perdidos.</p>
                <div className="flex gap-3">
                   <button 
                      onClick={() => setDeleteId(null)}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                   >
                      Cancelar
                   </button>
                   <button 
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-rose-600 text-white rounded font-black uppercase tracking-widest text-xs hover:bg-rose-500 transition-colors flex justify-center items-center gap-2"
                   >
                      {isSubmitting ? 'Excluindo...' : 'Excluir'}
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {companies.map(company => (
           <div key={company.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
             <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-3">
                   <div className="p-2 bg-white rounded border border-slate-200 text-blue-600">
                     <Building2 size={24} />
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={() => openEdit(company)}
                         className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                         title="Editar"
                      >
                         <Edit2 size={16} />
                      </button>
                      <button 
                         onClick={() => setDeleteId(company.id)}
                         className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                         title="Excluir"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{company.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNPJ: {company.cnpj}</p>
             </div>
             
             <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                   <span className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> Unidades</span>
                   <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{company.units?.length || 0}</span>
                </div>
                
                <div className="space-y-1">
                   {company.units?.map(unit => (
                     <div key={unit.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded group/unit hover:border-blue-300 transition-colors cursor-pointer">
                        <div>
                           <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{unit.name}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">{(unit.sectors || []).length} Setores | GES Ativos</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover/unit:text-blue-500 transform group-hover/unit:translate-x-1 transition-all" />
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                <button onClick={() => setActiveCompanyId(company.id)} className="w-full py-2 bg-white border border-slate-200 rounded text-[10px] font-black uppercase text-slate-600 tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
                   Gerenciar Unidades
                </button>
             </div>
           </div>
         ))}

         {/* Add New Placeholder */}
         <button onClick={() => setShowModal(true)} className="border-2 border-dashed border-slate-200 rounded-lg p-12 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all group">
            <div className="p-3 bg-slate-50 rounded-full group-hover:bg-white transition-colors">
               <Plus size={32} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Adicionar Nova Empresa Cliente</span>
         </button>
      </div>
    </div>
  );
}