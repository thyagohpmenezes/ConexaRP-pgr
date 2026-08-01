// src/services/GoogleWorkspaceBackendService.ts
import { supabase } from '../lib/supabase';
import { MasterSheetRow, MasterCompanyMonitoring, MasterSyncResult } from '../domain/types';

export type { MasterSheetRow, MasterCompanyMonitoring, MasterSyncResult };

// Exportações legadas para compatibilidade
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
  masterSheetId?: string;
  rootFolderId?: string;
  summary: {
    totalFolders: number;
    totalForms: number;
    employeeForms: number;
    managerForms: number;
    totalResponses: number;
  };
  tree?: WorkspaceDiscoveredFolder;
  rows?: MasterSheetRow[];
  companiesSummary?: Record<string, MasterCompanyMonitoring>;
  error?: string;
}

const DEFAULT_SPREADSHEET_ID = '1oeP_TJk4es0gbeBAPnebYkGecVAjzFG5EkC1dSUSde0';
const MASTER_SHEET_STORAGE_KEY = 'conexarp_master_sheet_id';
const LEGACY_FOLDER_KEY = 'conexarp_google_workspace_root_folder_id';
const CACHE_PAYLOAD_KEY = 'conexarp_master_sheet_cache_payload';
const CACHE_TIME_KEY = 'conexarp_master_sheet_cache_time';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache SWR para UI instantânea

export class GoogleWorkspaceBackendService {
  getMasterSheetId(): string {
    const custom = localStorage.getItem(MASTER_SHEET_STORAGE_KEY) || localStorage.getItem(LEGACY_FOLDER_KEY);
    if (custom && custom.trim() && custom.trim() !== '1A2b3C4d5E6f7G8h9I0j') {
      return custom.trim();
    }
    return DEFAULT_SPREADSHEET_ID;
  }

  setMasterSheetId(sheetId: string): void {
    const clean = sheetId.trim();
    localStorage.setItem(MASTER_SHEET_STORAGE_KEY, clean);
    localStorage.setItem(LEGACY_FOLDER_KEY, clean);
  }

  // Métodos legados mantidos como alias para compatibilidade retroativa perfeita
  getRootFolderId(): string {
    return this.getMasterSheetId();
  }

  setRootFolderId(folderId: string): void {
    this.setMasterSheetId(folderId);
  }

  /**
   * Atualiza a Coluna D (Total de Colaboradores) de uma empresa na Planilha Mestra do Google Sheets
   */
  async updateTotalEmployees(empresaName: string, totalEmployees: number): Promise<{ success: boolean; message?: string }> {
    const sheetId = this.getMasterSheetId();
    try {
      console.log(`[GoogleWorkspaceBackendService] Enviando atualização da Coluna D para "${empresaName}": ${totalEmployees} colab.`);
      const res = await supabase.functions.invoke('google-workspace-sync', {
        body: {
          action: 'update_total_employees',
          masterSheetId: sheetId,
          spreadsheetId: sheetId,
          empresa: empresaName,
          totalEmployees
        }
      });

      if (res.data && res.data.success) {
        try {
          localStorage.removeItem(CACHE_PAYLOAD_KEY);
          localStorage.removeItem(CACHE_TIME_KEY);
        } catch {}
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message || 'Falha ao atualizar no Google Sheets' };
    } catch (err: any) {
      console.error('[GoogleWorkspaceBackendService] Erro ao atualizar Coluna D:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Sincroniza e lê a Planilha Automática Mestra de Monitoramento em UMA ÚNICA requisição remota,
   * utilizando cache inteligente SWR para carregamento de UI instantâneo.
   */
  async syncMasterSheet(targetSheetId?: string, forceRefresh = false, quickTest = false): Promise<MasterSyncResult> {
    let sheetId = targetSheetId || this.getMasterSheetId();

    if (!sheetId) {
      sheetId = DEFAULT_SPREADSHEET_ID;
    }

    this.setMasterSheetId(sheetId);

    // 1. Verificação de Cache Local SWR para renderização instantânea (0ms)
    if (forceRefresh) {
      try {
        localStorage.removeItem(CACHE_PAYLOAD_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
      } catch {}
    } else if (!quickTest) {
      try {
        const cachedStr = localStorage.getItem(CACHE_PAYLOAD_KEY);
        const cachedTimeStr = localStorage.getItem(CACHE_TIME_KEY);

        if (cachedStr && cachedTimeStr) {
          const age = Date.now() - parseInt(cachedTimeStr, 10);
          if (age < CACHE_TTL_MS) {
            const parsed = JSON.parse(cachedStr) as MasterSyncResult;
            if (parsed && parsed.success && (parsed.companiesCount > 0 || (parsed.rows && parsed.rows.length > 0))) {
              console.log(`[GoogleWorkspaceBackendService] Utilizando dados em cache local SWR (${Math.round(age / 1000)}s de idade).`);
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn('Falha ao ler cache da planilha mestra:', e);
      }
    }

    const timeoutMs = quickTest ? 15000 : 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[GoogleWorkspaceBackendService] Solicitando leitura da Planilha Mestra "${sheetId}" ao Supabase...`);

      let data: any = null;
      let error: any = null;

      try {
        const res = await supabase.functions.invoke('google-workspace-sync', {
          body: { masterSheetId: sheetId, spreadsheetId: sheetId, rootFolderId: sheetId, quickTest }
        });
        data = res.data;
        error = res.error;
      } catch (sdkErr: any) {
        console.warn('[GoogleWorkspaceBackendService] SDK invoke falhou, tentando fetch direto:', sdkErr.message);
      }

      // Fallback HTTP POST direto
      if (error || !data) {
        const directRes = await fetch('https://tbxcrjbdovdgdsjwumqy.supabase.co/functions/v1/google-workspace-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'sb_publishable_2B2bmjKvVqtIqWHGl5JHpw_wKQpZQ49'
          },
          body: JSON.stringify({ masterSheetId: sheetId, spreadsheetId: sheetId, rootFolderId: sheetId, quickTest }),
          signal: controller.signal
        });

        if (!directRes.ok) {
          const textErr = await directRes.text();
          throw new Error(`Servidor retornou HTTP ${directRes.status}: ${textErr}`);
        }

        data = await directRes.json();
        error = null;
      }

      clearTimeout(timeoutId);

      if (error) {
        throw new Error(error.message || 'Falha ao sincronizar com a Planilha Mestra no Supabase Edge Function.');
      }

      if (!data || !data.success) {
        // Se a chamada falhou com o ID customizado, força o reset para a Planilha Mestra Oficial
        if (sheetId !== DEFAULT_SPREADSHEET_ID) {
          console.warn(`[GoogleWorkspaceBackendService] Falha com o ID "${sheetId}". Reiniciando com a Planilha Mestra Oficial...`);
          this.setMasterSheetId(DEFAULT_SPREADSHEET_ID);
          return this.syncMasterSheet(DEFAULT_SPREADSHEET_ID, true, quickTest);
        }
        throw new Error(data?.message || data?.details || 'Retorno inválido do servidor na sincronização da Planilha Mestra.');
      }

      // Salva em cache local SWR se o retorno tiver empresas válidas
      if (!quickTest && data.success) {
        try {
          localStorage.setItem(CACHE_PAYLOAD_KEY, JSON.stringify(data));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch {}
      }

      return data as MasterSyncResult;
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      // Tenta auto-recuperação com a Planilha Mestra Oficial se falhar
      if (sheetId !== DEFAULT_SPREADSHEET_ID) {
        console.warn(`[GoogleWorkspaceBackendService] Erro capturado. Tentando recuperação com ID Oficial (${DEFAULT_SPREADSHEET_ID})...`);
        this.setMasterSheetId(DEFAULT_SPREADSHEET_ID);
        return this.syncMasterSheet(DEFAULT_SPREADSHEET_ID, true, quickTest);
      }

      if (err.name === 'AbortError') {
        throw new Error('A requisição à Edge Function excedeu o tempo limite.');
      }
      throw err;
    }
  }

  // Alias para manter compatibilidade com chamadas existentes de syncGoogleWorkspace
  async syncGoogleWorkspace(sheetId?: string, forceRefresh = false, quickTest = false): Promise<any> {
    const result = await this.syncMasterSheet(sheetId, forceRefresh, quickTest);
    return {
      ...result,
      rootFolderId: result.masterSheetId || sheetId,
      tree: {
        id: 'master-root',
        name: result.sheetTitle || 'Planilha Mestra',
        path: ['Planilha Mestra'],
        forms: [],
        subFolders: []
      }
    };
  }
}

export const googleWorkspaceBackendService = new GoogleWorkspaceBackendService();
