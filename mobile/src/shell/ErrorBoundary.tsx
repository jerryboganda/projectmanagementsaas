import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches render-phase errors in any screen
 * so a single broken component cannot white-screen the whole shell.
 * Offers a manual reload; on native that triggers a full webview reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] text-slate-100 px-6"
        style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Something went wrong</h1>
        <p className="mt-1 text-center text-[13px] text-slate-400 max-w-xs">
          {this.state.error.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={this.reload}
          className="mt-6 flex items-center gap-2 rounded-[4px] bg-[#0066FF] px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white active:opacity-90"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload
        </button>
      </div>
    );
  }
}
