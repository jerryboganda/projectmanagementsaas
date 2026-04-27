"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/error-utils";

type ConfirmationStatus = "checking" | "success" | "error" | "missing";

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const { confirmEmail, resendEmailConfirmation } = useAuth();
  const { toast } = useToast();
  const hasSubmittedRef = useRef(false);
  const linkEmail = searchParams.get("email")?.trim() ?? "";
  const linkToken = searchParams.get("token") ?? "";
  const hasConfirmationParams = Boolean(linkEmail && linkToken);
  const [email] = useState(linkEmail);
  const [status, setStatus] = useState<ConfirmationStatus>(
    hasConfirmationParams ? "checking" : "missing",
  );
  const [message, setMessage] = useState(
    hasConfirmationParams
      ? "Confirming your email address..."
      : "This confirmation link is missing information. Request a fresh email and try again.",
  );
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (hasSubmittedRef.current) {
      return;
    }

    if (typeof window !== "undefined" && (linkEmail || linkToken)) {
      window.history.replaceState(null, "", "/confirm-email");
    }

    if (!hasConfirmationParams) {
      return;
    }

    hasSubmittedRef.current = true;

    void (async () => {
      try {
        await confirmEmail({ email: linkEmail, token: linkToken });
        setStatus("success");
        setMessage("Your email address is confirmed. You can now sign in to your workspace.");
        toast({
          type: "success",
          title: "Email confirmed",
          message: "Sign in with your email and password to continue.",
        });
      } catch (confirmationError) {
        setStatus("error");
        setMessage(
          getApiErrorMessage(
            confirmationError,
            "This confirmation link is invalid or has expired.",
          ),
        );
      }
    })();
  }, [confirmEmail, hasConfirmationParams, linkEmail, linkToken, toast]);

  async function handleResend() {
    if (!email) {
      setMessage("Enter the email address from registration on the sign-in page to request a new link.");
      setStatus("missing");
      return;
    }

    setResendMessage(null);
    setIsResending(true);

    try {
      await resendEmailConfirmation({ email });
      setResendMessage("A new confirmation email is on its way. Check your inbox and spam folder.");
      toast({
        type: "success",
        title: "Confirmation sent",
        message: `We sent a fresh link to ${email}.`,
      });
    } catch (resendError) {
      setResendMessage(getApiErrorMessage(resendError, "Unable to resend confirmation right now."));
    } finally {
      setIsResending(false);
    }
  }

  const isSuccess = status === "success";
  const loginHref = `/login${email ? `?email=${encodeURIComponent(email)}` : ""}`;

  return (
    <AuthShell
      eyebrow="Email Check"
      title={isSuccess ? "Email confirmed" : "Confirm your email"}
      description={
        isSuccess
          ? "Your account is ready for sign-in."
          : "Email confirmation protects your workspace and unlocks sign-in."
      }
      footer={
        <p className="text-[13px] text-slate-500">
          Need an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80">
            Create one
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
            {status === "checking" ? "Checking" : isSuccess ? "Confirmed" : "Needs attention"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
            {status === "checking"
              ? "Confirming your address"
              : isSuccess
                ? "You are verified"
                : "Link could not be confirmed"}
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-slate-400">{message}</p>
        </div>

        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${
            isSuccess
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : status === "checking"
                ? "border-primary/30 bg-primary/10 text-primary/90"
                : "border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {status === "checking" ? (
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          )}
          <div>
            <p className="text-[13px] font-medium">
              {isSuccess
                ? "Confirmation complete"
                : status === "checking"
                  ? "Please wait a moment"
                  : "Request a fresh confirmation email"}
            </p>
            {email ? <p className="mt-1 break-words text-[12px] opacity-80">{email}</p> : null}
          </div>
        </div>

        {resendMessage ? (
          <div className="rounded-2xl border border-neutral-border bg-white/[0.03] px-4 py-3 text-[13px] text-slate-300">
            {resendMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !email || status === "checking"}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-border px-4 text-sm font-semibold text-slate-100 transition hover:border-primary/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Sending..." : "Resend email"}
          </button>
          <Link
            href={loginHref}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}