import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import {
  setAccessToken,
  setRefreshToken,
  persistSession,
} from '../../auth/token-store';
import { api, ApiError } from '../../api/client';
import { enrollBiometric, getBiometricCapability } from '../../auth/biometric';

export function RegisterScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricReady, setBiometricReady] = useState(false);

  useEffect(() => {
    void getBiometricCapability().then((c) => setBiometricReady(c.available === true));
  }, []);

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
      const session = await api.auth.register({
        email,
        password,
        fullName: name.trim(),
      });
      setAccessToken(session.accessToken);
      if (session.refreshToken) await setRefreshToken(session.refreshToken);
      await persistSession(session);
      if (session.refreshToken && biometricReady) {
        try {
          await enrollBiometric(session.user.email, session.refreshToken);
        } catch {
          /* best-effort */
        }
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(toMessage(err, 'Registration failed.'));
    } finally {
      setBusy(false);
    }
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
            {busy ? 'Creatingâ€¦' : 'Create account'}
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
