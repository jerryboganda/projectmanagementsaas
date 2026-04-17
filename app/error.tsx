'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background-dark">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="flex size-20 items-center justify-center rounded-full bg-red-950/40 border border-red-900/50">
          <AlertTriangle className="size-12 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Something went wrong</h1>
          {process.env.NODE_ENV !== 'production' && error.message && (
            <p className="text-sm text-slate-500 max-w-md font-mono">{error.message}</p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
          >
            <Home className="size-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
