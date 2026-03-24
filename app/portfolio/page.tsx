'use client';

import { PortfolioLayout } from "@/components/portfolio/portfolio-layout";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ErrorBoundary } from "@/components/error-boundary";

export default function PortfolioPage() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Portfolio" subtitle="Live goals and linked initiatives" />
        <Breadcrumbs />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ErrorBoundary featureName="Portfolio">
            <PortfolioLayout />
          </ErrorBoundary>
        </div>
      </main>
    </>
  );
}
