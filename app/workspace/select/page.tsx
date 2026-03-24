"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { useToast } from "@/components/ui/toast";
import { useWorkspace } from "@/contexts/workspace-context";

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeWorkspaceId, workspaces, setActiveWorkspaceId } = useWorkspace();
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(workspaceId: string) {
    setError(null);
    setPendingWorkspaceId(workspaceId);

    try {
      await setActiveWorkspaceId(workspaceId);
      toast({
        type: "success",
        title: "Workspace selected",
        message: "Your active tenant context has been updated.",
      });
      router.replace("/");
    } catch {
      setError("We could not switch your workspace. Please try again.");
    } finally {
      setPendingWorkspaceId(null);
    }
  }

  return (
    <AuthShell
      eyebrow="Workspace"
      title="Choose the workspace you want to enter"
      description="Your active workspace controls authorization, realtime channels, and tenant-scoped requests."
    >
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
          Workspace Selector
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Pick your active tenant
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-slate-400">
          You can switch later, but every scoped API request will use the workspace selected here.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {workspaces.map((workspace) => {
          const isPending = pendingWorkspaceId === workspace.workspaceId;
          const isActive = activeWorkspaceId === workspace.workspaceId;

          return (
            <button
              key={workspace.workspaceId}
              type="button"
              onClick={() => void handleSelect(workspace.workspaceId)}
              disabled={isPending}
              className="w-full rounded-2xl border border-neutral-border bg-white/[0.03] px-4 py-4 text-left transition hover:border-primary/50 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{workspace.name}</p>
                  <p className="mt-1 text-[13px] text-slate-400">
                    {workspace.slug} • {workspace.role}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                  {isPending ? "Switching..." : isActive ? "Active" : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
          {error}
        </div>
      ) : null}
    </AuthShell>
  );
}
