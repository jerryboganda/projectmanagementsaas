import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, Check, MailCheck } from 'lucide-react';
import { api, ApiError, type RegistrationPendingResponse } from '../../api/client';

export function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<RegistrationPendingResponse | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!agreed) return setError('You must accept the Terms and Privacy Policy.');

    setBusy(true);
    try {
      const pending = await api.auth.register({
        email,
        password,
        fullName: name.trim(),
      });
      setPendingRegistration(pending);
      setPassword('');
      setConfirm('');
      setAgreed(false);
      setResendMessage(null);
    } catch (err) {
      setError(toMessage(err, 'Registration failed.'));
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    const targetEmail = pendingRegistration?.email ?? email;
    if (!targetEmail) return setError('Enter your email address first.');

    setError(null);
    setResendMessage(null);
    setResendBusy(true);
    try {
      await api.auth.resendConfirmation({ email: targetEmail });
      setResendMessage('A fresh confirmation email is on its way.');
    } catch (err) {
      setError(toMessage(err, 'Could not resend confirmation email.'));
    } finally {
      setResendBusy(false);
    }
  }

  if (pendingRegistration) {
    return (
      <div
        className="fixed inset-0 flex flex-col bg-[#0A0A0A] text-slate-100"
        style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="flex flex-1 flex-col justify-center px-6 py-10">
          <div className="mb-5 flex size-12 items-center justify-center rounded-[8px] border border-[#0066FF]/30 bg-[#0066FF]/10">
            <MailCheck className="h-6 w-6 text-[#3388FF]" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-50">Check your email</h1>
          <p className="text-[13px] leading-6 text-slate-400">{pendingRegistration.message}</p>

          <div className="mt-6 rounded-[4px] border border-[#1A1A1A] bg-[#111] px-4 py-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Confirmation sent to
            </p>
            <p className="mt-2 break-words text-[14px] font-medium text-slate-100">
              {pendingRegistration.email}
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-[4px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-400"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {resendMessage ? (
            <div className="mt-4 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
              {resendMessage}
            </div>
          ) : null}

          <button
            type="button"
            onClick={resendConfirmation}
            disabled={resendBusy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[4px] border border-[#222] bg-[#111] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-slate-100 active:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {resendBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {resendBusy ? 'Sending...' : 'Resend email'}
          </button>

          <Link
            to="/login"
            className="mt-3 flex w-full items-center justify-center rounded-[4px] bg-[#0066FF] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white active:opacity-90 transition-opacity"
          >
            Sign in
          </Link>

          <button
            type="button"
            onClick={() => {
              setPendingRegistration(null);
              setError(null);
              setResendMessage(null);
            }}
            className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#0A0A0A] text-slate-100"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="flex-1 overflow-y-auto px-6 pt-14 pb-8">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-50">Create account</h1>
        <p className="mb-6 text-[13px] text-slate-400">Start a new Linear Precision workspace.</p>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <Field label="Full name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Confirm password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </Field>

          <label className="mt-2 flex items-start gap-2.5 py-1 cursor-pointer">
            <span
              className={`mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
                agreed ? 'bg-[#0066FF] border-[#0066FF]' : 'border-[#222] bg-[#111]'
              }`}
            >
              {agreed ? <Check className="w-3 h-3 text-white" strokeWidth={3} /> : null}
            </span>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only"
            />
            <span className="text-[12px] text-slate-400 leading-relaxed">
              I agree to the <span className="text-slate-200">Terms of Service</span> and{' '}
              <span className="text-slate-200">Privacy Policy</span>.
            </span>
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#0066FF] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white active:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {busy ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
          Have an account?{' '}
          <Link to="/login" className="text-[#0066FF] hover:text-[#3388FF] transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-[4px] border border-[#1A1A1A] bg-[#111] px-3 py-3 text-[14px] text-slate-100 outline-none focus:border-[#0066FF] transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return 'No connection. Check your network and try again.';
    // FluentValidation ProblemDetails carries errors object
    const problem = err.problem as { errors?: Record<string, string[]>; title?: string; detail?: string } | undefined;
    const firstField = problem?.errors ? Object.values(problem.errors)[0]?.[0] : undefined;
    return firstField ?? problem?.detail ?? problem?.title ?? err.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
