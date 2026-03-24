"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InboxProvider } from "@/contexts/inbox-context";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { AuthProvider } from "@/contexts/auth-context";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { AppShellGuard } from "@/components/auth/app-shell-guard";
import { CommandPaletteProvider } from "@/components/command-palette-provider";
import { ToastProvider } from "@/components/ui/toast";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { AiCopilotProvider } from "@/components/ai-copilot-provider";
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
      <SidebarProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <Suspense fallback={<div className="flex-1 min-h-screen bg-background-dark" />}>
              <AppShellGuard>
                <RealtimeProvider>
                  <InboxProvider>
                    <ToastProvider>
                      <AiCopilotProvider>
                        <CommandPaletteProvider>
                          <GlobalShortcuts />
                          <KeyboardShortcutsDialog />
                          <OnboardingWizard />
                          {children}
                        </CommandPaletteProvider>
                      </AiCopilotProvider>
                    </ToastProvider>
                  </InboxProvider>
                </RealtimeProvider>
              </AppShellGuard>
            </Suspense>
          </WorkspaceProvider>
        </AuthProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
