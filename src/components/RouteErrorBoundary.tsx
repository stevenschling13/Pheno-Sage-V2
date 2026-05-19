import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class RouteErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Unhandled route error:', error, info.componentStack);
  }

  override render(): React.ReactNode {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 font-mono text-zinc-300">
          <div className="border border-status-error/40 bg-status-error/5 p-6 max-w-lg text-center">
            <div className="text-status-error text-xs uppercase tracking-widest mb-3 font-bold">
              ERR_RENDER_FAULT
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              This view failed to render. The error has been logged.
            </p>
            <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 text-[10px] font-bold uppercase tracking-widest text-status-optimal hover:underline"
            >
              [ Retry ]
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
