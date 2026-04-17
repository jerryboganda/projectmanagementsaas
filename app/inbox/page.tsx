'use client';

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { InboxLayout } from "@/components/inbox/inbox-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export default function InboxPage() {
  return (
    <>
      <Sidebar />
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        <Header title="Inbox" subtitle="" />
        <Breadcrumbs />
        <ErrorBoundary featureName="Inbox">
          <InboxLayout />
        </ErrorBoundary>
      </main>
    </>
  );
}
