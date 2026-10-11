import React, { Component } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bug,
  RotateCcw,
} from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error to console for development
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);

    // Optional: send error to telemetry or backend audit logger if desired
    try {
      const errorPayload = {
        message: error?.message || 'Unknown render error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        time: new Date().toISOString(),
      };
      sessionStorage.setItem('worklog_last_error', JSON.stringify(errorPayload));
    } catch {
      // Ignore storage errors
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleClearCacheAndReload = () => {
    try {
      sessionStorage.clear();
      // Remove local cache items but keep auth if possible
      const csrf = localStorage.getItem('worklog_csrf_token');
      localStorage.clear();
      if (csrf) localStorage.setItem('worklog_csrf_token', csrf);
    } catch {}
    window.location.href = '/';
  };

  handleCopyDetails = () => {
    const { error, errorInfo } = this.state;
    const text = `Error: ${error?.message || 'Unknown error'}\n\nStack:\n${error?.stack || 'N/A'}\n\nComponent Stack:\n${errorInfo?.componentStack || 'N/A'}\n\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      const isPageLevel = this.props.level === 'page';
      const { error, errorInfo, showDetails, copied } = this.state;

      return (
        <div
          className={`flex flex-col items-center justify-center p-6 sm:p-10 text-center ${
            isPageLevel
              ? 'min-h-[500px] w-full bg-slate-50/70 rounded-2xl border border-slate-200/80 my-4'
              : 'min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white'
          }`}
          role="alert"
        >
          {/* Visual Accent Icon */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl relative ${
              isPageLevel
                ? 'bg-rose-50 border border-rose-200/80 text-rose-600'
                : 'bg-gradient-to-tr from-rose-500/20 to-indigo-500/30 border border-white/20 backdrop-blur-md text-rose-400'
            }`}
          >
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
            <div className="absolute -inset-1 rounded-3xl bg-rose-500/10 blur-lg pointer-events-none" />
          </div>

          {/* Heading & Friendly Subtitle */}
          <h2
            className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mb-2.5 ${
              isPageLevel ? 'text-slate-900' : 'text-white'
            }`}
          >
            Something went unexpectedly wrong
          </h2>
          <p
            className={`text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed ${
              isPageLevel ? 'text-slate-500' : 'text-slate-300'
            }`}
          >
            We ran into an unhandled issue while rendering this view. Don&apos;t worry—your data and work logs are safely saved on the server.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-md cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border cursor-pointer ${
                isPageLevel
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/20 backdrop-blur-md'
              }`}
            >
              <RefreshCw size={15} />
              <span>Reload Page</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border cursor-pointer ${
                isPageLevel
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 text-white border-white/20 backdrop-blur-md'
              }`}
            >
              <Home size={15} />
              <span>Go to Dashboard</span>
            </button>
          </div>

          {/* Technical Diagnostics Section */}
          <div className="w-full max-w-xl text-left">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !showDetails })}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition ${
                  isPageLevel
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bug size={14} />
                <span>{showDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDetails && (
                <button
                  type="button"
                  onClick={this.handleCopyDetails}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    isPageLevel
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy stack trace'}</span>
                </button>
              )}
            </div>

            {showDetails && (
              <div
                className={`p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60 border transition ${
                  isPageLevel
                    ? 'bg-slate-900 text-slate-200 border-slate-800'
                    : 'bg-black/60 text-emerald-400 border-white/15 backdrop-blur-md'
                }`}
              >
                <div className="text-rose-400 font-bold mb-2">
                  {error?.name || 'Error'}: {error?.message || 'Unknown error'}
                </div>
                {error?.stack && (
                  <pre className="text-[10px] text-slate-300 whitespace-pre-wrap mb-3">
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <div className="border-t border-slate-700/60 pt-2 text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1">Component Hierarchy:</span>
                    <pre className="text-[10px] whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fallback cache clear link */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={this.handleClearCacheAndReload}
              className={`text-xs underline transition cursor-pointer ${
                isPageLevel ? 'text-slate-400 hover:text-slate-600' : 'text-slate-400 hover:text-white'
              }`}
            >
              Still having trouble? Reset local session cache and sign in again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
