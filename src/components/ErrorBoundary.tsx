import React from 'react';

interface State {
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private reset = (): void => this.setState({ error: null });

  override render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-zinc-200 p-6 font-mono">
        <div className="max-w-lg w-full border border-status-error/40 bg-status-error/5 p-6 space-y-4">
          <div className="text-status-error text-[10px] uppercase tracking-widest">
            SYSTEM_FAULT // Render pipeline halted
          </div>
          <h1 className="text-xl">Something broke on this screen.</h1>
          <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap break-words border border-zinc-800 p-3 bg-brand-bg max-h-48 overflow-auto">
            {error.message}
          </pre>
          <button
            onClick={this.reset}
            className="text-[10px] uppercase tracking-widest px-3 py-2 border border-status-optimal text-status-optimal hover:bg-status-optimal hover:text-brand-bg transition-colors"
          >
            [ Retry ]
          </button>
        </div>
      </div>
    );
  }
}
