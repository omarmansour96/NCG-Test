import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let parsedError: Record<string, unknown> | null = null;
      try {
        parsedError = JSON.parse(this.state.errorMessage);
      } catch {
        parsedError = null;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 text-rose-700 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-lg font-bold">Application Error Detected</h1>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              The operation could not be completed. Please review the diagnostic details below or reload the application.
            </p>
            {parsedError ? (
              <div className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs font-mono overflow-x-auto mb-6 space-y-1">
                <div>Operation: {String(parsedError.operationType || 'unknown')}</div>
                <div>Path: {String(parsedError.path || 'N/A')}</div>
                <div>Details: {String(parsedError.error || 'Unknown error')}</div>
              </div>
            ) : (
              <div className="bg-slate-100 text-slate-800 rounded-lg p-4 text-xs font-mono overflow-x-auto mb-6">
                {this.state.errorMessage}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 text-white text-sm font-semibold rounded-lg hover:bg-teal-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
