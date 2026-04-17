import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '../../api/client';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      await api.auth.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      // The backend intentionally returns 202 regardless of existence.
      // Surface only true transport/connectivity failures.
      if (err instanceof ApiError && err.status === 0) {
        setError('No connection. Check your network and try again.');
      } else if (err instanceof ApiError && err.status >= 500) {
        setError('Server error. Please try again in a moment.');
      } else {
        // 4xx (e.g., validation) still shows the same success state to avoid
        // email-enumeration. Backend already handles this, but we double down.
        setSent(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#0A0A0A] text-slate-100"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="flex-1 overflow-y-auto px-6 pt-16">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-50">
          Forgot password
        </h1>
        <p className="mb-8 text-[13px] text-slate-400">
          Enter the email on your account and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-[13px] text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-300">Check your inbox</p>
              <p className="mt-1 text-[12px] text-emerald-400/80">
                If an account exists for <span className="font-mono">{email}</span>, a reset link is
                on its way.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-invalid={!!error}
                className="w-full rounded-[4px] border border-[#1A1A1A] bg-[#111] px-3 py-3 text-[14px] text-slate-100 outline-none focus:border-[#0066FF] transition-colors"
              />
            </label>

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-[4px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-400"
              >
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#0066FF] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white active:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {busy ? 'Sendingâ€¦' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
          <Link to="/login" className="text-[#0066FF] hover:text-[#3388FF] transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
