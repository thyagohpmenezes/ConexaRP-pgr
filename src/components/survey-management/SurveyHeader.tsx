import React from 'react';
import { RefreshCw, Search, ShieldCheck, Activity } from 'lucide-react';

interface Props {
  onRefresh: () => void;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  lastSync: Date | null;
}

export const SurveyHeader: React.FC<Props> = ({
  onRefresh,
  loading,
  searchQuery,
  setSearchQuery,
  lastSync,
}) => {
  return (
    <header className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl shadow-slate-950/20 border border-slate-800 space-y-6 relative overflow-hidden">
      {/* Ambient glow accent */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/30">
            <Activity className="text-white animate-pulse" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white uppercase italic">
                ConexaRP <span className="text-blue-400 font-extrabold not-italic">Monitor</span>
              </h1>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded text-[9px] font-black uppercase tracking-widest">
                Domain Service Layer
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium mt-0.5">
              Camada de Serviços Desacoplada & Regras de Negócio Centralizadas
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente ou empresa..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-blue-400 shadow-inner">
                TP
              </div>
              <span className="w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full absolute -bottom-0.5 -right-0.5"></span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-black text-white truncate max-w-[120px]">Thyago Pacheco</p>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck size={10} className="text-emerald-400" /> Administrador
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync timestamp bar */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Serviço MockSurveyService ativo (Interface ISurveyService)</span>
        </div>
        <div>
          Última sincronização: {lastSync ? lastSync.toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    </header>
  );
};
