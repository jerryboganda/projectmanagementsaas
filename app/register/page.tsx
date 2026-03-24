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

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      await register({ fullName, email, password });
      toast({
        type: "success",
        title: "Account created",
        message: "Your personal workspace is ready.",
      });
      router.replace(redirectTarget);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to create your account."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Launch Access"
      title="Create your production workspace"
      description="New accounts start with a default workspace so you can land in a real tenant-aware session immediately."
      footer={
        <p className="text-[13px] text-slate-500">
          Already have an account?{" "}
          <Link
            href={`/login${redirectTarget !== "/" ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign in instead
          </Link>
        </p>
      }
    >
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
    </AuthShell>
  );
}
