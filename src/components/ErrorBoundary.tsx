import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      indexedDB.deleteDatabase('leovandyz_ai_db');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="theme-app-canvas min-h-screen w-full flex items-center justify-center p-4">
          <div className="theme-surface-elevated max-w-md w-full p-6 text-center space-y-4">
            <div className="theme-surface-subtle flex h-12 w-12 items-center justify-center mx-auto text-rose-500">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="text-lg font-bold theme-text">Terjadi Kendala Memuat Aplikasi</h2>
            <p className="text-xs theme-text-secondary leading-relaxed">
              LEOVANDYZ AI mendeteksi kendala pada sesi peramban. Anda dapat memuat ulang halaman atau mengatur ulang data lokal.
            </p>

            {this.state.error && (
              <div className="theme-surface-subtle p-3 text-left">
                <p className="text-[11px] font-mono text-rose-600 dark:text-rose-300 break-all line-clamp-3">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="theme-btn-primary flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Muat Ulang</span>
              </button>
              <button
                onClick={this.handleResetAndReload}
                className="theme-btn-secondary flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
