'use client';

import { CalendarLayout } from "@/components/calendar/calendar-layout";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export default function CalendarPage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Calendar" subtitle="Team Schedule" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Calendar">
            <CalendarLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
