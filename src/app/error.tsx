// src/app/error.tsx
'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, send this to Sentry/Datadog
    console.error('Dashboard Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4 w-full">
      <div className="max-w-md w-full bg-dash-surface border border-dash-danger/30 rounded-xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 bg-dash-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-dash-danger w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display text-dash-text mb-2">Something went wrong!</h2>
        <p className="text-dash-subtle mb-6 text-sm">
          A runtime error occurred while rendering this dashboard component.
          <br/>
          <span className="font-mono text-xs mt-2 block opacity-50 break-words">
            {error.message || "Unknown error"}
          </span>
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 justify-center px-6 py-3 bg-dash-elevated border border-dash-border text-dash-text font-medium rounded-lg hover:border-dash-cyan hover:text-dash-cyan transition-colors"
        >
          <RefreshCw size={18} />
          Try again
        </button>
      </div>
    </div>
  );
}
