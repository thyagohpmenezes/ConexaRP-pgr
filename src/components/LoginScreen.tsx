import React, { useState } from 'react';
import { Shield, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Verifique seu email para confirmar o cadastro!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50 mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="font-black text-2xl tracking-tighter text-white italic uppercase">Conexa Risk</h1>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-1">Plataforma Especialista GRO</p>
        </div>

        <div className="p-8">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6 text-center">
            {isSignUp ? 'Criar Nova Conta' : 'Acesso ao Sistema'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">E-mail Corporativo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Senha de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 flex justify-center items-center gap-2 py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={16} /> {isSignUp ? 'Cadastrar' : 'Entrar no Sistema'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              {isSignUp ? 'Já tenho uma conta. Fazer Login' : 'Não tem conta? Solicite Acesso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
