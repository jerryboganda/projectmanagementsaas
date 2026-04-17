'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function AuthErrorFallback({ error, reset, title = 'Authentication error' }: AuthErrorProps) {
  useEffect(() => {
    console.error('[Auth Error]', error);
  }, [error]);

  return (
    <main id="main-content" className="flex-1 min-h-screen bg-background-dark flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border border-neutral-border bg-neutral-surface/80 p-8 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="size-7 text-red-400" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Something went wrong while processing your request. Please try again.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-slate-500 font-mono">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-border px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
