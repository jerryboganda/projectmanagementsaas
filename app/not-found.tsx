import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background-dark">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="flex size-20 items-center justify-center rounded-full bg-neutral-surface border border-neutral-border">
          <FileQuestion className="size-12 text-slate-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-100">Page not found</h1>
          <p className="text-sm text-slate-500 max-w-md">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06]"
          >
            Go to Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
