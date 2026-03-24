'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ReportsLayout } from '@/components/reports/reports-layout';
import { ErrorBoundary } from '@/components/error-boundary';

export default function ReportsPage() {
  return (
    <div className="flex h-screen bg-background-dark text-slate-200 overflow-hidden selection:bg-primary/30 selection:text-primary-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <Breadcrumbs />
        <main className="flex-1 flex overflow-hidden relative">
          <ErrorBoundary featureName="Reports">
            <ReportsLayout />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
