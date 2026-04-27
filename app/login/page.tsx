"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api/client";
import { isMfaChallenge } from "@/lib/api/contracts";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { normalizeAppRedirect } from "@/lib/auth/redirects";

function isEmailConfirmationRequiredError(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 403) {
    return false;
  }

  const payload = error.payload;
  const text = [
    typeof payload === "object" && payload !== null && "type" in payload ? payload.type : null,
    typeof payload === "object" && payload !== null && "title" in payload ? payload.title : null,
    typeof payload === "object" && payload !== null && "detail" in payload ? payload.detail : null,
    error.message,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    text.includes("email-confirmation-required") ||
    text.includes("email confirmation required") ||
    text.includes("confirm your email")
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyMfaLogin, resendEmailConfirmation } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);

  // F-13 — MFA challenge step. When the backend returns mfaRequired=true,
  // we hold the opaque mfaToken and show a 6-digit code prompt.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  const redirectTarget = useMemo(
    () => normalizeAppRedirect(searchParams.get("redirect")) ?? "/",
    [searchParams],
  );

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNeedsEmailConfirmation(false);
    setResendMessage(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });
      if (isMfaChallenge(result)) {
        setMfaToken(result.mfaToken);
        return;
      }
      toast({
        type: "success",
        title: "Welcome back",
        message: "Your workspace session is ready.",
      });
      router.replace(redirectTarget);
    } catch (submissionError) {
      if (isEmailConfirmationRequiredError(submissionError)) {
        setNeedsEmailConfirmation(true);
        setError("Confirm your email address before signing in.");
      } else {
        setError(getApiErrorMessage(submissionError, "Unable to sign in right now."));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setError("Enter your work email before resending confirmation.");
      return;
    }

    setError(null);
    setResendMessage(null);
    setIsResendingConfirmation(true);

    try {
      await resendEmailConfirmation({ email: email.trim() });
      setResendMessage("A fresh confirmation email is on its way.");
      toast({
        type: "success",
        title: "Confirmation sent",
        message: `We sent a new link to ${email.trim()}.`,
      });
    } catch (resendError) {
      setError(getApiErrorMessage(resendError, "Unable to resend confirmation right now."));
    } finally {
      setIsResendingConfirmation(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mfaToken) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await verifyMfaLogin({ mfaToken, code: mfaCode.trim() });
      toast({
        type: "success",
        title: "Welcome back",
        message: "Your workspace session is ready.",
      });
      router.replace(redirectTarget);
    } catch (submissionError) {
      setError(
        getApiErrorMessage(submissionError, "Authenticator code is invalid or expired."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancelMfa() {
    setMfaToken(null);
    setMfaCode("");
    setError(null);
    setResendMessage(null);
    setNeedsEmailConfirmation(false);
  }

  return (
    <AuthShell
      eyebrow="Launch Access"
      title={mfaToken ? "Two-step verification" : "Sign in to your workspace"}
      description={
        mfaToken
          ? "Enter the 6-digit code from your authenticator app to finish signing in."
          : "Use your email and password to restore your session, active workspace, and live updates."
      }
      footer={
        mfaToken ? (
          <p className="text-[13px] text-slate-500">
            Lost your authenticator? Contact your workspace owner to reset MFA.
          </p>
        ) : (
          <p className="text-[13px] text-slate-500">
            New here?{" "}
            <Link
              href={`/register${redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
              className="font-medium text-primary hover:text-primary/80"
            >
              Create your account
            </Link>
          </p>
        )
      }
    >
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
          {mfaToken ? "Verify" : "Sign In"}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          {mfaToken ? "Confirm it's you" : "Continue into Linear Precision"}
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-slate-400">
          {mfaToken
            ? "Open your authenticator app (Google Authenticator, 1Password, Authy, etc.) and enter the current 6-digit code."
            : "If you were headed to a specific page, we'll send you back after sign-in."}
        </p>
      </div>

      {mfaToken ? (
        <form className="mt-8 space-y-4" onSubmit={handleMfaSubmit}>
          <FormField
            label="Authenticator code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,8}"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            placeholder="123 456"
            required
            autoFocus
          />

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleCancelMfa}
              className="text-[13px] text-slate-400 hover:text-slate-200"
            >
              Use a different account
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mfaCode.replace(/\s+/g, "").length < 6}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handlePasswordSubmit}>
          <FormField
            label="Work email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setNeedsEmailConfirmation(false);
              setResendMessage(null);
            }}
            placeholder="team@company.com"
            autoComplete="email"
            required
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
              {error}
            </div>
          ) : null}

          {needsEmailConfirmation ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-[13px] text-slate-200">
              <p className="leading-5">
                Your account exists, but the email address has not been confirmed yet.
              </p>
              {resendMessage ? (
                <p className="mt-2 text-emerald-200">{resendMessage}</p>
              ) : null}
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isResendingConfirmation}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-primary/40 px-3 text-xs font-semibold text-white transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResendingConfirmation ? "Sending..." : "Resend confirmation email"}
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <Link href="/forgot-password" className="text-[13px] text-slate-400 hover:text-slate-200">
              Forgot your password?
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
