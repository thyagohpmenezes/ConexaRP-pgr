import React, { useState, useEffect } from 'react';
import {
  DriveFolderItem,
  DriveSourceCandidate,
  GoogleWorkspaceBinding,
} from '../../domain/types';
import { researchProjectService } from '../../services/ResearchProjectService';
import {
  X,
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Link2,
  Loader2,
  ArrowLeft,
  Sparkles,
  Shield,
  ChevronRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBinding: (binding: GoogleWorkspaceBinding) => Promise<void>;
  currentBinding?: GoogleWorkspaceBinding;
  companyName: string;
}

export const GoogleDriveBrowserModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirmBinding,
  companyName,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'Meu Google Drive' },
  ]);
  const [folders, setFolders] = useState<DriveFolderItem[]>([]);
  const [candidates, setCandidates] = useState<DriveSourceCandidate[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolderItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Seleções do usuário para confirmação dos formulários
  const [collabFileId, setCollabFileId] = useState<string>('');
  const [managerFileId, setManagerFileId] = useState<string>('');

  const loadFolderContents = async (folderId: string) => {
    setLoading(true);
    try {
      const provider = researchProjectService.getProvider();
      const subFolders = await provider.listFolders(folderId);
      setFolders(subFolders);

      if (folderId !== 'root') {
        const foundFiles = await provider.discoverSources(folderId);
        setCandidates(foundFiles);
        // Auto-sugere com base no target identificado pela IA / convenção do provedor
        const colabSug = foundFiles.find((f) => f.suggestedTarget === 'COLABORADOR');
        const gestorSug = foundFiles.find((f) => f.suggestedTarget === 'GESTOR');
        setCollabFileId(colabSug?.fileId || (foundFiles[0]?.fileId || ''));
        setManagerFileId(gestorSug?.fileId || (foundFiles[1]?.fileId || ''));
      } else {
        setCandidates([]);
      }
    } catch (e) {
      console.error('Erro ao ler pastas do Google Drive:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentFolderId('root');
      setFolderHistory([{ id: 'root', name: 'Meu Google Drive' }]);
      setSelectedFolder(null);
      loadFolderContents('root');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnterFolder = (folder: DriveFolderItem) => {
    setCurrentFolderId(folder.id);
    setSelectedFolder(folder);
    setFolderHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
    loadFolderContents(folder.id);
  };

  const handleNavigateBack = (targetIdx: number) => {
    const target = folderHistory[targetIdx];
    setCurrentFolderId(target.id);
    setSelectedFolder(targetIdx === 0 ? null : { id: target.id, name: target.name });
    setFolderHistory((prev) => prev.slice(0, targetIdx + 1));
    loadFolderContents(target.id);
  };

  const handleSubmit = async () => {
    if (!selectedFolder) return;
    setSaving(true);

    const collabFile = candidates.find((c) => c.fileId === collabFileId);
    const managerFile = candidates.find((c) => c.fileId === managerFileId);

    const binding: GoogleWorkspaceBinding = {
      folderId: selectedFolder.id,
      folderName: selectedFolder.name,
      collabFormId: collabFile?.fileId,
      collabFormName: collabFile?.fileName,
      collabSheetId: collabFile?.linkedSheetId,
      managerFormId: managerFile?.fileId,
      managerFormName: managerFile?.fileName,
      managerSheetId: managerFile?.linkedSheetId,
    };

    try {
      await onConfirmBinding(binding);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar vínculo:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-1">
                <Shield size={12} /> Sincronização Google Workspace
              </span>
              <h3 className="text-xl font-black tracking-tight text-white uppercase mt-0.5">
                Conectar Pasta da Pesquisa
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Empresa alvo: <span className="text-white font-bold">{companyName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Navegação em Migalhas (Breadcrumbs) */}
        <div className="bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-black text-slate-600">
          {folderHistory.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <ChevronRight size={14} className="text-slate-400 shrink-0" />}
              <button
                onClick={() => handleNavigateBack(idx)}
                className={`hover:text-blue-600 transition-colors whitespace-nowrap px-2 py-1 rounded-lg ${
                  idx === folderHistory.length - 1
                    ? 'bg-blue-600 text-white pointer-events-none font-extrabold shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Corpo da Navegação */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 size={36} className="text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Navegando no Google Drive Corporativo...
              </p>
            </div>
          ) : (
            <>
              {/* Lista de Pastas */}
              {folders.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                    {currentFolderId === 'root'
                      ? 'Selecione a pasta do Projeto'
                      : 'Subpastas Disponíveis'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleEnterFolder(folder)}
                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all group shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Folder size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-900 truncate">
                              {folder.name}
                            </h4>
                            <p className="text-[10px] font-semibold text-slate-400">
                              Clique para explorar
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                currentFolderId !== 'root' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 font-bold text-center">
                    Esta pasta não possui subpastas. Veja abaixo os formulários e planilhas detectados.
                  </div>
                )
              )}

              {/* Arquivos Detectados & Confirmação por Dropdown */}
              {currentFolderId !== 'root' && (
                <div className="space-y-4 border-t border-slate-200 pt-6 animate-in fade-in duration-300">
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                    <Sparkles size={20} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs text-blue-950">
                      <p className="font-extrabold uppercase tracking-wide">
                        Descoberta Automática Concluída
                      </p>
                      <p className="text-slate-600 font-medium">
                        Identificamos os formulários e planilhas na pasta selecionada (<strong>{selectedFolder?.name}</strong>). Verifique as sugestões da Inteligência Artificial e confirme nos dropdowns abaixo quais arquivos alimentam cada público.
                      </p>
                    </div>
                  </div>

                  {candidates.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-2">
                      <AlertCircle size={28} className="text-amber-600 mx-auto" />
                      <p className="text-xs font-black text-amber-900 uppercase">
                        Nenhum formulário Google Forms localizado
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium">
                        Certifique-se de ter gerado os formulários no seu Google Workspace e colocado dentro desta pasta.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Dropdown 1: Colaboradores */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <FileText size={16} className="text-blue-600" />
                          Formulário para Colaboradores (Meta: ≥70% da empresa)
                        </label>
                        <select
                          value={collabFileId}
                          onChange={(e) => setCollabFileId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        >
                          <option value="">Selecione um arquivo detectado...</option>
                          {candidates.map((cand) => (
                            <option key={`colab-${cand.fileId}`} value={cand.fileId}>
                              {cand.fileName} {cand.suggestedTarget === 'COLABORADOR' ? '✨ (Sugestão Autoconfirmado)' : ''}
                            </option>
                          ))}
                        </select>
                        {collabFileId && (
                          <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-bold px-1 pt-1">
                            <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />
                            Planilha Google Sheets vinculada: <span className="font-extrabold">{candidates.find(c => c.fileId === collabFileId)?.linkedSheetName || 'Respostas.xlsx'}</span>
                          </div>
                        )}
                      </div>

                      {/* Dropdown 2: Gestores */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <FileText size={16} className="text-purple-600" />
                          Formulário para Gestores e Liderança (Meta: ≥1 resposta)
                        </label>
                        <select
                          value={managerFileId}
                          onChange={(e) => setManagerFileId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
                        >
                          <option value="">Selecione um arquivo detectado...</option>
                          {candidates.map((cand) => (
                            <option key={`mgr-${cand.fileId}`} value={cand.fileId}>
                              {cand.fileName} {cand.suggestedTarget === 'GESTOR' ? '✨ (Sugestão Autoconfirmado)' : ''}
                            </option>
                          ))}
                        </select>
                        {managerFileId && (
                          <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-bold px-1 pt-1">
                            <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />
                            Planilha Google Sheets vinculada: <span className="font-extrabold">{candidates.find(c => c.fileId === managerFileId)?.linkedSheetName || 'Respostas.xlsx'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={!selectedFolder || selectedFolder.id === 'root' || !collabFileId || saving}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Salvando Vínculo...
              </>
            ) : (
              <>
                <Link2 size={16} /> Salvar Vínculo do Google Workspace
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
