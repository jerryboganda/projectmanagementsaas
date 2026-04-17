'use client';

import { ProjectsLayout } from "@/components/projects/projects-layout";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ProjectsPage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Projects" subtitle="All Projects" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Projects">
            <ProjectsLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
