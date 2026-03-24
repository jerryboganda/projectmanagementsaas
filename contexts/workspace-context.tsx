"use client";

import { type AuthWorkspace } from "@/lib/api/contracts";
import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";

interface WorkspaceContextValue {
  activeWorkspace: AuthWorkspace | null;
  activeWorkspaceId: string | null;
  workspaces: AuthWorkspace[];
  setActiveWorkspaceId: (workspaceId: string) => Promise<unknown>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { session, setActiveWorkspaceId } = useAuth();

  const value = useMemo<WorkspaceContextValue>(() => {
    const workspaces = session?.workspaces ?? [];
    const activeWorkspaceId = session?.activeWorkspaceId ?? null;
    const activeWorkspace =
      workspaces.find((workspace) => workspace.workspaceId === activeWorkspaceId) ?? null;

    return {
      activeWorkspace,
      activeWorkspaceId,
      workspaces,
      setActiveWorkspaceId,
    };
  }, [session, setActiveWorkspaceId]);

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}
