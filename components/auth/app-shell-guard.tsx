"use client";

import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { normalizeAppRedirect } from "@/lib/auth/redirects";
import { Activity } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

const AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

function isInvitationPath(pathname: string) {
  return pathname.startsWith("/invitations/");
}

function isPublicPath(pathname: string) {
  return AUTH_PATHS.has(pathname) || isInvitationPath(pathname);
}

function buildCurrentPath(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function resolveAuthenticatedDestination(
  activeWorkspaceId: string | null,
  workspaceCount: number,
  redirectTarget: string | null,
) {
  if (redirectTarget) {
    return redirectTarget;
  }

  if (workspaceCount === 0) {
    return "/workspace/create";
  }

  if (!activeWorkspaceId) {
    return "/workspace/select";
  }

  return "/";
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex-1 min-h-screen bg-background-dark grid place-items-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-border bg-neutral-surface/70 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Activity className="size-6 animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        <p className="mt-2 text-[13px] text-slate-500">
          Syncing your session and workspace context.
        </p>
      </div>
    </div>
  );
}

export function AppShellGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status, isAuthenticated } = useAuth();
  const { workspaces, activeWorkspaceId } = useWorkspace();
  const invitationPath = isInvitationPath(pathname);

  const currentPath = useMemo(
    () => buildCurrentPath(pathname, searchParams),
    [pathname, searchParams],
  );
  const redirectTarget = normalizeAppRedirect(searchParams.get("redirect"));
  const publicPath = isPublicPath(pathname);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!isAuthenticated) {
      if (!publicPath) {
        router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
      return;
    }

    if (AUTH_PATHS.has(pathname)) {
      router.replace(
        resolveAuthenticatedDestination(activeWorkspaceId, workspaces.length, redirectTarget),
      );
      return;
    }

    if (invitationPath) {
      return;
    }

    if (workspaces.length === 0) {
      if (pathname !== "/workspace/create") {
        router.replace("/workspace/create");
      }
      return;
    }

    if (!activeWorkspaceId) {
      if (pathname !== "/workspace/select") {
        router.replace("/workspace/select");
      }
      return;
    }

    if (pathname === "/workspace/create" || pathname === "/workspace/select") {
      router.replace("/");
    }
  }, [
    activeWorkspaceId,
    currentPath,
    isAuthenticated,
    invitationPath,
    pathname,
    publicPath,
    redirectTarget,
    router,
    status,
    workspaces.length,
  ]);

  if (status === "loading") {
    return <LoadingScreen label="Restoring your session" />;
  }

  if (!isAuthenticated) {
    return publicPath ? <>{children}</> : <LoadingScreen label="Redirecting to login" />;
  }

  if (AUTH_PATHS.has(pathname)) {
    return <LoadingScreen label="Redirecting to your workspace" />;
  }

  if (invitationPath) {
    return <>{children}</>;
  }

  if (workspaces.length === 0) {
    return pathname === "/workspace/create" ? (
      <>{children}</>
    ) : (
      <LoadingScreen label="Preparing workspace setup" />
    );
  }

  if (!activeWorkspaceId) {
    return pathname === "/workspace/select" ? (
      <>{children}</>
    ) : (
      <LoadingScreen label="Selecting your workspace" />
    );
  }

  if (pathname === "/workspace/create" || pathname === "/workspace/select") {
    return <LoadingScreen label="Redirecting to your workspace" />;
  }

  return <>{children}</>;
}
