'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { SettingsLayout } from '@/components/settings/settings-layout';
import { ErrorBoundary } from '@/components/error-boundary';

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-background-dark text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <Breadcrumbs />
        <main className="flex-1 flex overflow-hidden relative">
          <ErrorBoundary featureName="Settings">
            <SettingsLayout />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
