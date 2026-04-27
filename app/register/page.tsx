"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import type { RegistrationPendingResponse } from "@/lib/api/contracts";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { normalizeAppRedirect } from "@/lib/auth/redirects";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const { register, resendEmailConfirmation } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [pendingRegistration, setPendingRegistration] =
    useState<RegistrationPendingResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const redirectTarget = useMemo(
    () => normalizeAppRedirect(searchParams.get("redirect")) ?? "/",
    [searchParams],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const pending = await register({ fullName, email, password });
      setPendingRegistration(pending);
      setResendMessage(null);
      setPassword("");
      setConfirmPassword("");
      toast({
        type: "success",
        title: "Check your email",
        message: "Confirm your address before signing in.",
      });
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to create your account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    const targetEmail = pendingRegistration?.email ?? email;
    if (!targetEmail) {
      setError("Enter your work email before resending confirmation.");
      return;
    }

    setError(null);
    setResendMessage(null);
    setIsResending(true);

    try {
      await resendEmailConfirmation({ email: targetEmail });
      setResendMessage("A new confirmation email is on its way. Check your inbox and spam folder.");
      toast({
        type: "success",
        title: "Confirmation sent",
        message: `We sent a fresh link to ${targetEmail}.`,
      });
    } catch (resendError) {
      setError(getApiErrorMessage(resendError, "Unable to resend confirmation right now."));
    } finally {
      setIsResending(false);
    }
  }

  const loginHref = `/login?email=${encodeURIComponent(
    pendingRegistration?.email ?? email,
  )}${redirectTarget !== "/" ? `&redirect=${encodeURIComponent(redirectTarget)}` : ""}`;

  return (
    <AuthShell
      eyebrow="Launch Access"
      title={pendingRegistration ? "Verify your email" : "Create your production workspace"}
      description={
        pendingRegistration
          ? "Your workspace was created, but email confirmation is required before sign-in."
          : "New accounts start with a default workspace, then require email confirmation before sign-in."
      }
      footer={
        <p className="text-[13px] text-slate-500">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign in instead
          </Link>
        </p>
      }
    >
      {pendingRegistration ? (
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
              Verify
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
              Check your inbox
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-slate-400">
              {pendingRegistration.message}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/80">
              Confirmation sent to
            </p>
            <p className="mt-2 break-words text-sm font-semibold text-slate-100">
              {pendingRegistration.email}
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
              {error}
            </div>
          ) : null}

          {resendMessage ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-200">
              {resendMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
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

          <button
            type="button"
            onClick={() => {
              setPendingRegistration(null);
              setError(null);
              setResendMessage(null);
            }}
            className="text-[13px] text-slate-400 hover:text-slate-200"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
          Register
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Start with a live workspace
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-slate-400">
          Passwords must include uppercase, lowercase, a digit, and at least four unique characters.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <FormField
          label="Full name"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Alex Morgan"
          autoComplete="name"
          required
        />
        <FormField
          label="Work email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="team@company.com"
          autoComplete="email"
          required
        />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a strong password"
          autoComplete="new-password"
          required
        />
        <FormField
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
        />

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
        </>
      )}
    </AuthShell>
  );
}
