'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { DocsLayout } from '@/components/docs/docs-layout';
import { ErrorBoundary } from '@/components/error-boundary';

export default function DocsPage() {
  return (
    <div className="flex h-screen bg-background-dark text-slate-200 overflow-hidden selection:bg-primary/30 selection:text-primary-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <Breadcrumbs />
        <main className="flex-1 flex overflow-hidden relative">
          <ErrorBoundary featureName="Documents">
            <DocsLayout />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
