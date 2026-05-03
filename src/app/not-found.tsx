// src/app/not-found.tsx
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dash-bg p-4">
      <div className="max-w-md w-full bg-dash-surface border border-dash-border rounded-xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-dash-elevated rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-dash-warning w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display text-dash-text mb-2">Page Not Found</h2>
        <p className="text-dash-subtle mb-8 text-sm">
          The dashboard route you are looking for does not exist or has been moved.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-dash-cyan text-dash-bg font-medium rounded-lg hover:bg-dash-cyan/90 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
