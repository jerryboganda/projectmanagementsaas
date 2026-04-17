import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Fingerprint, AlertCircle, Loader2 } from 'lucide-react';
import {
  getBiometricCapability,
  unlockWithBiometric,
  biometricLabel,
  enrollBiometric,
  type BiometricCapability,
} from '../../auth/biometric';
import {
  setAccessToken,
  setRefreshToken,
  persistSession,
} from '../../auth/token-store';
import { api, ApiError } from '../../api/client';

/**
 * Login — LP aesthetic, capability-gated biometric button, real error state,
 * email + password client-side validation. Wired to POST /api/v1/auth/login.
 * On success: access token in memory, refresh token in Preferences, and if
 * biometrics are available we enroll the refresh token into the Keychain/Keystore
 * so the next launch can unlock offline.
 */
export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cap, setCap] = useState<BiometricCapability | null>(null);

  useEffect(() => {
    void getBiometricCapability().then(setCap);
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const session = await api.auth.login({ email, password });
      setAccessToken(session.accessToken);
      if (session.refreshToken) {
        await setRefreshToken(session.refreshToken);
      }
      await persistSession(session);
      // Enroll biometric unlock if device supports it and we have a refresh token.
      if (session.refreshToken && cap?.available) {
        try {
          await enrollBiometric(session.user.email, session.refreshToken);
        } catch {
          /* enrollment is best-effort — don't block login */
        }
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(toMessage(err, 'Sign-in failed. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleBiometric() {
    setError(null);
    const creds = await unlockWithBiometric();
    if (!creds) {
      setError('Biometric unlock failed or was cancelled.');
      return;
    }
    setBusy(true);
    try {
      const session = await api.auth.refresh(creds.refreshToken);
      setAccessToken(session.accessToken);
      if (session.refreshToken) {
        await setRefreshToken(session.refreshToken);
        try {
          await enrollBiometric(session.user.email, session.refreshToken);
        } catch {
          /* ignore re-enrollment failure */
        }
      }
      await persistSession(session);
      navigate('/', { replace: true });
    } catch (err) {
      setError(toMessage(err, 'Could not refresh session. Please sign in.'));
    } finally {
      setBusy(false);
    }
  }

  const biometricReady = cap?.available === true;
  const biometricName = biometricReady ? biometricLabel(cap.type) : 'Biometric';

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#0A0A0A] text-slate-100"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="flex-1 overflow-y-auto px-6 pt-16">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="size-7 rounded-[4px] bg-[#0066FF] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            Linear Precision PM
          </span>
        </div>

        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-50">Welcome back</h1>
        <p className="mb-8 text-[13px] text-slate-400">Sign in to your workspace.</p>

        <form onSubmit={signIn} className="space-y-3" noValidate>
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
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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
            {busy ? 'Signing inâ€¦' : 'Sign in'}
          </button>
        </form>

        {biometricReady ? (
          <button
            type="button"
            onClick={() => void handleBiometric()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[4px] border border-[#1A1A1A] bg-[#111] py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-200 hover:bg-[#141414] transition-colors"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            Unlock with {biometricName}
          </button>
        ) : null}

        <div className="mt-6 flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
          <Link to="/forgot-password" className="hover:text-slate-200 transition-colors">
            Forgot password?
          </Link>
          <Link to="/register" className="hover:text-slate-200 transition-colors">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Email or password is incorrect.';
    if (err.status === 0) return 'No connection. Check your network and try again.';
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
