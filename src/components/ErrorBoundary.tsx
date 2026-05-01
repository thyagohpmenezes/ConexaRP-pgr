import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-3xl w-full border border-rose-200">
            <h1 className="text-2xl font-black text-rose-600 mb-4 uppercase tracking-tight">Ocorreu um Erro Crítico (Tela Branca Evitada)</h1>
            <p className="text-sm font-bold text-slate-600 mb-6 uppercase tracking-widest">A aplicação encontrou um erro durante a renderização.</p>
            
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto text-left mb-6">
              <p className="text-rose-400 font-mono text-sm font-bold">{this.state.error && this.state.error.toString()}</p>
            </div>
            
            {this.state.errorInfo && (
              <div className="bg-slate-100 rounded-xl p-4 overflow-x-auto text-left">
                <pre className="text-slate-600 font-mono text-[10px] whitespace-pre-wrap leading-relaxed">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()} 
              className="mt-8 bg-rose-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
