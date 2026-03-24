'use client';

import { WorkloadLayout } from "@/components/workload/workload-layout";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export default function WorkloadPage() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Workload" subtitle="Team Capacity & Allocation" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Workload">
            <WorkloadLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
