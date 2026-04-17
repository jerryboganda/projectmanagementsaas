'use client';

import { SprintsLayout } from "@/components/sprints/sprints-layout";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export default function SprintsPage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Sprint Planning" subtitle="Manage Sprints" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Sprints">
            <SprintsLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
