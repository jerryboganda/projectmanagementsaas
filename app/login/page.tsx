"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { normalizeAppRedirect } from "@/lib/auth/redirects";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTarget = useMemo(
    () => normalizeAppRedirect(searchParams.get("redirect")) ?? "/",
    [searchParams],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      toast({
        type: "success",
        title: "Welcome back",
        message: "Your workspace session is ready.",
      });
      router.replace(redirectTarget);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to sign in right now."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Launch Access"
      title="Sign in to your workspace"
      description="Use your email and password to restore your session, active workspace, and live updates."
      footer={
        <p className="text-[13px] text-slate-500">
          New here?{" "}
          <Link
            href={`/register${redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            className="font-medium text-primary hover:text-primary/80"
          >
            Create your account
          </Link>
        </p>
      }
    >
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
          Sign In
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Continue into Linear Precision
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-slate-400">
          If you were headed to a specific page, we&apos;ll send you back after sign-in.
        </p>
      </div>

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
    </AuthShell>
  );
}
