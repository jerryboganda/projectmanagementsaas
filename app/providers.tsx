"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InboxProvider } from "@/contexts/inbox-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { AppShellGuard } from "@/components/auth/app-shell-guard";
import { CommandPaletteProvider } from "@/components/command-palette-provider";
import { AnnouncerProvider } from '@/components/ui/announcer';
import { ToastProvider } from "@/components/ui/toast";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { AiCopilotProvider } from "@/components/ai-copilot-provider";
import { MotionProvider } from "@/lib/motion";
import { Suspense, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <SidebarProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <Suspense fallback={
              <div className="flex-1 min-h-screen bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="size-12 rounded-full border-2 border-neutral-border" />
                    <div className="absolute inset-0 size-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm text-slate-500 font-mono tracking-wider">Loading workspace...</p>
                </div>
              </div>
            }>
              <AppShellGuard>
                <RealtimeProvider>
                  <InboxProvider>
                    <ToastProvider>
                      <AnnouncerProvider>
                        <AiCopilotProvider>
                          <CommandPaletteProvider>
                            <GlobalShortcuts />
                            <KeyboardShortcutsDialog />
                            <OnboardingWizard />
                            {children}
                          </CommandPaletteProvider>
                        </AiCopilotProvider>
                      </AnnouncerProvider>
                    </ToastProvider>
                  </InboxProvider>
                </RealtimeProvider>
              </AppShellGuard>
            </Suspense>
          </WorkspaceProvider>
        </AuthProvider>
      </SidebarProvider>
      </MotionProvider>
    </QueryClientProvider>
  );
}
