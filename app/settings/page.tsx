'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { SettingsLayout } from '@/components/settings/settings-layout';
import { ErrorBoundary } from '@/components/error-boundary';

export default function SettingsPage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative min-w-0">
        <Header title="Settings" />
        <Breadcrumbs />
        <div className="flex-1 flex overflow-hidden relative">
          <ErrorBoundary featureName="Settings">
            <SettingsLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
