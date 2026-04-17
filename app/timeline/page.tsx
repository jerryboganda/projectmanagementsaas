'use client';

import { TimelineLayout } from "@/components/timeline/timeline-layout";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export default function TimelinePage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Timeline" subtitle="Q3 Planning" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Timeline">
            <TimelineLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
