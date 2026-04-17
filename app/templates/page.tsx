'use client';

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { TemplatesLayout } from "@/components/templates/templates-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default function TemplatesPage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Templates" subtitle="Project Blueprints" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Templates">
            <TemplatesLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
