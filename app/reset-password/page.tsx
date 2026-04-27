"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/error-utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [{ email, token }] = useState(() => ({
    email: searchParams.get("email") ?? "",
    token: searchParams.get("token") ?? "",
  }));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.has("email") || searchParams.has("token")) {
      router.replace("/reset-password");
    }
  }, [router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email || !token) {
      setError("The reset link is incomplete. Request a fresh password reset email.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ email, token, newPassword });
      toast({
        type: "success",
        title: "Password updated",
        message: "You can sign in with your new password now.",
      });
      router.replace(`/login?email=${encodeURIComponent(email)}`);
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to reset your password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Choose a new password"
      description="This link must include both the target email and reset token. If it has expired, request a fresh one."
      footer={
        <p className="text-[13px] text-slate-500">
          Need a new link?{" "}
          <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
            Request another reset email
          </Link>
        </p>
      }
    >
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
          New Password
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Secure your account
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-slate-400">
          Use a password with uppercase, lowercase, a digit, and at least four unique characters.
        </p>
      </div>

      {!email || !token ? (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-[14px] leading-6 text-amber-100">
          This reset link is missing required parameters. Request a new password reset email to continue.
        </div>
      ) : (
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <FormField label="Email" type="email" value={email} readOnly disabled />
          <FormField
            label="New password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            required
          />
          <FormField
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your new password"
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
            {isSubmitting ? "Updating password..." : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
