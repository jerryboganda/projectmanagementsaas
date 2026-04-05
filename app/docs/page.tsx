'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { DocsLayout } from '@/components/docs/docs-layout';
import { ErrorBoundary } from '@/components/error-boundary';

export default function DocsPage() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-background-dark relative min-w-0">
        <Header title="Documents" />
        <Breadcrumbs />
        <div className="flex-1 flex overflow-hidden relative">
          <ErrorBoundary featureName="Documents">
            <DocsLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
