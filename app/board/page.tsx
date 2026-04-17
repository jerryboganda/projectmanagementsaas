'use client';

import { BoardLayout } from "@/components/board/board-layout";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export default function BoardPage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Board" subtitle="Sprint 24" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Board">
            <BoardLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
