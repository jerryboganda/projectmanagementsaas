"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/error-utils";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to start password reset."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Reset your password"
      description="We will send a reset link if the email belongs to an active account."
      footer={
        <p className="text-[13px] text-slate-500">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            Return to sign in
          </Link>
        </p>
      }
    >
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
          Password Reset
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Recover access
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-slate-400">
          The response is intentionally the same whether or not the email exists.
        </p>
      </div>

      {submitted ? (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-[14px] leading-6 text-emerald-100">
          If an active account exists for <span className="font-semibold">{email}</span>, a reset link is on the way.
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <FormField
            label="Work email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="team@company.com"
            autoComplete="email"
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
            {isSubmitting ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
