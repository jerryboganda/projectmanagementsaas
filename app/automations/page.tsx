'use client';

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AutomationsLayout } from "@/components/automations/automations-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default function AutomationsPage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Automations" subtitle="Workflow Rules" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Automations">
            <AutomationsLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
