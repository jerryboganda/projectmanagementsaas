'use client';

import { GoalsLayout } from "@/components/goals/goals-layout";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export default function GoalsPage() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Goals" subtitle="Strategic Execution & OKRs" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Goals">
            <GoalsLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
