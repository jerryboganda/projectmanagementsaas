'use client';

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { IntakeLayout } from "@/components/intake/intake-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default function IntakePage() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Request Intake" subtitle="Manage Forms" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Intake">
            <IntakeLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
