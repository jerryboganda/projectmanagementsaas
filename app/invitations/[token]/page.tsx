"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { createApiClient } from "@/lib/api/client";
import { type InvitationDetailsResponse } from "@/lib/api/contracts";
import { getApiErrorMessage } from "@/lib/api/error-utils";

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { status, session, acceptInvitation } = useAuth();
  const { toast } = useToast();
  const token = useMemo(
    () => (Array.isArray(params.token) ? params.token[0] : params.token),
    [params.token],
  );
  const currentPath = `/invitations/${token}`;
  const [invitation, setInvitation] = useState<InvitationDetailsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadInvitation() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const result = await createApiClient().getInvitation(token);
        if (!isCancelled) {
          setInvitation(result);
        }
      } catch (loadingError) {
        if (!isCancelled) {
          setLoadError(getApiErrorMessage(loadingError, "Unable to load this invitation."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInvitation();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  async function handleAccept() {
    setActionError(null);
    setIsAccepting(true);

    try {
      await acceptInvitation(token);
      toast({
        type: "success",
        title: "Invitation accepted",
        message: "Your workspace membership is active now.",
      });
      router.replace("/");
    } catch (submissionError) {
      setActionError(getApiErrorMessage(submissionError, "Unable to accept this invitation."));
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Invitation"
      title="Join a workspace"
      description="Invitations are email-bound. Sign in with the invited address before accepting."
      footer={
        status !== "authenticated" ? (
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(currentPath)}`}
              className="text-[13px] font-medium text-primary hover:text-primary/80"
            >
              Sign in to accept
            </Link>
            <Link
              href={`/register?redirect=${encodeURIComponent(currentPath)}${invitation?.email ? `&email=${encodeURIComponent(invitation.email)}` : ""}`}
              className="text-[13px] text-slate-400 hover:text-slate-200"
            >
              Create an account instead
            </Link>
          </div>
        ) : (
          <p className="text-[13px] text-slate-500">
            Signed in as <span className="font-medium text-slate-300">{session?.user.email}</span>
          </p>
        )
      }
    >
      {isLoading ? (
        <div className="rounded-2xl border border-neutral-border bg-white/[0.03] px-4 py-6 text-[14px] text-slate-400">
          Loading invitation details...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-[14px] leading-6 text-rose-200">
          {loadError}
        </div>
      ) : invitation ? (
        <>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
              Workspace Invite
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
              {invitation.workspaceName}
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-slate-400">
              This invitation is for <span className="font-medium text-slate-200">{invitation.email}</span> as a{" "}
              <span className="font-medium text-slate-200">{invitation.role}</span>.
            </p>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-neutral-border bg-white/[0.03] p-4 text-[13px] text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Status</span>
              <span>{invitation.status}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Expires</span>
              <span>{new Date(invitation.expiresAt).toLocaleString()}</span>
            </div>
          </div>

          {status === "authenticated" && invitation.status === "Pending" ? (
            <div className="mt-6 space-y-4">
              {actionError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
                  {actionError}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void handleAccept()}
                disabled={isAccepting}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAccepting ? "Accepting invitation..." : "Accept invitation"}
              </button>
            </div>
          ) : null}

          {status !== "authenticated" ? (
            <div className="mt-6 rounded-2xl border border-neutral-border bg-background-dark/40 px-4 py-4 text-[13px] leading-6 text-slate-400">
              Sign in with the invited email address to add this workspace to your account and set it active immediately.
            </div>
          ) : null}
        </>
      ) : null}
    </AuthShell>
  );
}
