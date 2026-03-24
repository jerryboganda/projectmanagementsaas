'use client';

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { TimeTrackingLayout } from "@/components/time-tracking/time-tracking-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default function TimeTrackingPage() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Time Tracking" subtitle="Log & Review" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Time Tracking">
            <TimeTrackingLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
