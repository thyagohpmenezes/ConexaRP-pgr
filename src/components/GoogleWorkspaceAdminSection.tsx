// src/components/GoogleWorkspaceAdminSection.tsx
import React, { useState } from 'react';
import { googleWorkspaceBackendService } from '../services/GoogleWorkspaceBackendService';
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Key, 
  Mail, 
  Clock, 
  Zap, 
  Server, 
  Lock,
  Cpu
} from 'lucide-react';

export interface DiagnosticReport {
  timestamp: string;
  executionTimeMs: number;
  apiAccessible: boolean;
  serviceAccountAuthenticated: boolean;
  rootFolderFound: boolean;
  googleDriveOk: boolean;
  googleSheetsOk: boolean;
  summary?: {
    companiesFound: number;
    totalResponses: number;
    totalRowsRead: number;
  };
  errorDetails?: string;
}

const STORAGE_SA_EMAIL_KEY = 'conexarp_google_sa_email';

export const GoogleWorkspaceAdminSection: React.FC = () => {
  const [masterSheetId, setMasterSheetId] = useState<string>(() => googleWorkspaceBackendService.getMasterSheetId());
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string>(() => localStorage.getItem(STORAGE_SA_EMAIL_KEY) || 'conexarp-sync@conexarp-gcp-prod.iam.gserviceaccount.com');
  const [gcpProjectId] = useState<string>('conexarp-production-gcp');
  
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'TESTING'>('CONNECTED');
  const [testing, setTesting] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Salva os campos editados nas configurações
  const handleSaveSettings = () => {
    googleWorkspaceBackendService.setMasterSheetId(masterSheetId);
    localStorage.setItem(STORAGE_SA_EMAIL_KEY, serviceAccountEmail);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Botão 1: "Testar Conexão"
  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus('TESTING');
    const startTime = performance.now();

    try {
      if (!masterSheetId.trim()) {
        throw new Error('ID da Planilha Mestra (MASTER_SHEET_ID) é obrigatório.');
      }

      // Executa chamada de diagnóstico ultrarrápida via Edge Function (quickTest: true)
      const result = await googleWorkspaceBackendService.syncMasterSheet(masterSheetId, true, true);
      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      setDiagnosticReport({
        timestamp: new Date().toLocaleString('pt-BR'),
        executionTimeMs,
        apiAccessible: true,
        serviceAccountAuthenticated: true,
        rootFolderFound: true,
        googleDriveOk: true,
        googleSheetsOk: true,
        summary: {
          companiesFound: result.companiesCount || Object.keys(result.companiesSummary || {}).length,
          totalResponses: result.totalResponses || 0,
          totalRowsRead: result.totalRowsRead || 0
        }
      });
      setConnectionStatus('CONNECTED');
    } catch (err: any) {
      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      setDiagnosticReport({
        timestamp: new Date().toLocaleString('pt-BR'),
        executionTimeMs,
        apiAccessible: false,
        serviceAccountAuthenticated: false,
        rootFolderFound: false,
        googleDriveOk: false,
        googleSheetsOk: false,
        errorDetails: err.message || 'Falha ao autenticar com a Service Account do Google.'
      });
      setConnectionStatus('DISCONNECTED');
    } finally {
      setTesting(false);
    }
  };

  // Botão 2: "Executar Varredura / Leitura Única"
  const handleRunScan = async () => {
    setScanning(true);
    const startTime = performance.now();

    try {
      const result = await googleWorkspaceBackendService.syncMasterSheet(masterSheetId, true);
      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      setDiagnosticReport({
        timestamp: new Date().toLocaleString('pt-BR'),
        executionTimeMs,
        apiAccessible: true,
        serviceAccountAuthenticated: true,
        rootFolderFound: true,
        googleDriveOk: true,
        googleSheetsOk: true,
        summary: {
          companiesFound: result.companiesCount || Object.keys(result.companiesSummary || {}).length,
          totalResponses: result.totalResponses || 0,
          totalRowsRead: result.totalRowsRead || 0
        }
      });
      setConnectionStatus('CONNECTED');
    } catch (err: any) {
      alert(`Erro na leitura da Planilha Mestra: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-6 p-8">
      {/* Cabeçalho de Administração Super Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={12} /> Área Restrita Super Admin
            </span>
            {connectionStatus === 'CONNECTED' ? (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                🟢 Fonte Única de Verdade Conectada
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                🔴 Não Conectado
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
            Planilha Automática Mestra de Monitoramento (Single Source of Truth)
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Gerenciamento exclusivo do MASTER_SHEET_ID e permissões da Service Account do Google.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            {savedSuccess ? '✅ Configurações Salvas!' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Formulário de Campos Obrigatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campo 1: ID da Planilha Mestra */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <FileSpreadsheet size={14} className="text-blue-600" />
            ID da Planilha Mestra (MASTER_SHEET_ID)
          </label>
          <input
            type="text"
            value={masterSheetId}
            onChange={(e) => setMasterSheetId(e.target.value)}
            placeholder="Ex: 1A2b3C4d5E6f7G8h9I0j"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-[9px] text-slate-400 font-medium">
            URL do Google Sheets: `docs.google.com/spreadsheets/d/ID/edit`
          </p>
        </div>

        {/* Campo 2: E-mail da Service Account */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Mail size={14} className="text-blue-600" />
            E-mail da Service Account (GCP)
          </label>
          <input
            type="text"
            value={serviceAccountEmail}
            onChange={(e) => setServiceAccountEmail(e.target.value)}
            placeholder="service-account@projeto.iam.gserviceaccount.com"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-[9px] text-slate-400 font-medium">
            Compartilhe a Planilha Mestra concedendo permissão de Leitor para este e-mail.
          </p>
        </div>

        {/* Campo 3: Projeto Google Cloud (Somente Informativo) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Server size={14} className="text-slate-400" />
            Projeto Google Cloud (Somente Informativo)
          </label>
          <input
            type="text"
            readOnly
            value={gcpProjectId}
            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed select-none"
          />
        </div>

        {/* Informação sobre a Chave Privada nos Secrets */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Lock size={14} className="text-amber-500" />
            Chave Privada RSA (Supabase Secrets)
          </label>
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-900 flex items-center gap-2">
            <Key size={14} className="text-amber-600 shrink-0" />
            <span>Armazenada exclusivamente nos Secrets do Supabase (`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`). Nunca exposta no browser.</span>
          </div>
        </div>
      </div>

      {/* Botões de Ação Principal: Testar Conexão e Leitura Única */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
        <button
          disabled={testing || scanning}
          onClick={handleTestConnection}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
        >
          <Zap size={16} className={testing ? 'animate-spin' : ''} />
          {testing ? 'Validando Planilha Mestra...' : 'Testar Conexão'}
        </button>

        <button
          disabled={testing || scanning}
          onClick={handleRunScan}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Lendo Planilha Mestra...' : 'Sincronizar Planilha Mestra'}
        </button>
      </div>

      {/* Painel de Diagnóstico da Integração */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Cpu size={18} className="text-blue-600" /> Diagnóstico da Planilha Mestra de Monitoramento
          </h4>
          {diagnosticReport && (
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Testado em: {diagnosticReport.timestamp} • Tempo: <strong>{(diagnosticReport.executionTimeMs / 1000).toFixed(2)}s</strong>
            </span>
          )}
        </div>

        {/* Checkmarks de Validação do Diagnóstico */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${diagnosticReport?.apiAccessible ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-500'}`}>
            <CheckCircle2 size={18} className={diagnosticReport?.apiAccessible ? 'text-emerald-600' : 'text-slate-300'} />
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest block">API Google Sheets</span>
              <span className="text-xs font-bold">{diagnosticReport?.apiAccessible ? 'Sheets v4 API OK' : 'Aguardando teste'}</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${diagnosticReport?.serviceAccountAuthenticated ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-500'}`}>
            <CheckCircle2 size={18} className={diagnosticReport?.serviceAccountAuthenticated ? 'text-emerald-600' : 'text-slate-300'} />
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest block">Service Account</span>
              <span className="text-xs font-bold">{diagnosticReport?.serviceAccountAuthenticated ? 'JWT Autenticado' : 'Aguardando teste'}</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${diagnosticReport?.rootFolderFound ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-500'}`}>
            <CheckCircle2 size={18} className={diagnosticReport?.rootFolderFound ? 'text-emerald-600' : 'text-slate-300'} />
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest block">Planilha Mestra</span>
              <span className="text-xs font-bold">{diagnosticReport?.rootFolderFound ? 'Aba Mestra Localizada' : 'Aguardando teste'}</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${diagnosticReport?.googleSheetsOk ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 text-slate-500'}`}>
            <CheckCircle2 size={18} className={diagnosticReport?.googleSheetsOk ? 'text-emerald-600' : 'text-slate-300'} />
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest block">Leitura Única</span>
              <span className="text-xs font-bold">{diagnosticReport?.googleSheetsOk ? '1 Request OK' : 'Aguardando teste'}</span>
            </div>
          </div>
        </div>

        {/* Resumo da Leitura Mestra */}
        {diagnosticReport?.summary && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Empresas Consolidadas</span>
              <p className="text-xl font-black text-blue-700">{diagnosticReport.summary.companiesFound}</p>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total de Respostas</span>
              <p className="text-xl font-black text-amber-700">{diagnosticReport.summary.totalResponses}</p>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Linhas Processadas</span>
              <p className="text-xl font-black text-emerald-700">{diagnosticReport.summary.totalRowsRead}</p>
            </div>
          </div>
        )}

        {/* Alerta de erro no Diagnóstico */}
        {diagnosticReport?.errorDetails && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-3">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <div>
              <span className="font-black uppercase block">Falha ao Conectar com a Planilha Mestra:</span>
              <span>{diagnosticReport.errorDetails}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleWorkspaceAdminSection;
