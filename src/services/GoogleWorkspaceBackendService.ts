// src/services/GoogleWorkspaceBackendService.ts
import { supabase } from '../lib/supabase';

export interface WorkspaceFormMetrics {
  totalRows: number;
  responseCount: number;
}

export interface WorkspaceDiscoveredForm {
  id: string;
  name: string;
  formType: 'EMPLOYEE' | 'MANAGER' | 'CHECKLIST' | 'UNKNOWN';
  folderId: string;
  folderPath: string[];
  linkedSheetId?: string;
  linkedSheetName?: string;
  webViewLink?: string;
  metrics?: WorkspaceFormMetrics;
}

export interface WorkspaceDiscoveredFolder {
  id: string;
  name: string;
  path: string[];
  forms: WorkspaceDiscoveredForm[];
  subFolders: WorkspaceDiscoveredFolder[];
}

export interface GoogleWorkspaceSyncResult {
  success: boolean;
  scannedAt: string;
  rootFolderId: string;
  summary: {
    totalFolders: number;
    totalForms: number;
    employeeForms: number;
    managerForms: number;
    totalResponses: number;
  };
  tree: WorkspaceDiscoveredFolder;
  error?: string;
}

const SETTINGS_KEY = 'conexarp_google_workspace_root_folder_id';

export class GoogleWorkspaceBackendService {
  getRootFolderId(): string {
    return localStorage.getItem(SETTINGS_KEY) || '';
  }

  setRootFolderId(folderId: string): void {
    localStorage.setItem(SETTINGS_KEY, folderId.trim());
  }

  async syncGoogleWorkspace(rootFolderId?: string): Promise<GoogleWorkspaceSyncResult> {
    const targetFolderId = rootFolderId || this.getRootFolderId();

    if (!targetFolderId) {
      throw new Error('A ID da Pasta Raiz do Google Drive não está configurada.');
    }

    // Salva como padrão
    this.setRootFolderId(targetFolderId);

    const { data, error } = await supabase.functions.invoke('google-workspace-sync', {
      body: { rootFolderId: targetFolderId }
    });

    if (error) {
      console.error('Erro na chamada da Edge Function google-workspace-sync:', error);
      throw new Error(error.message || 'Falha ao executar sincronização do Google Workspace no backend.');
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Retorno inválido do servidor na sincronização.');
    }

    return data as GoogleWorkspaceSyncResult;
  }
}

export const googleWorkspaceBackendService = new GoogleWorkspaceBackendService();
