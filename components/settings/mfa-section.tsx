'use client';

import { type ChangeEvent, type FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Shield, ShieldCheck, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormField } from '@/components/ui/form-field';
import { useAuth } from '@/contexts/auth-context';
import { getApiErrorMessage } from '@/lib/api/error-utils';

/**
 * F-13 — Real TOTP MFA management section. Wires to:
 *   POST /api/v1/auth/mfa/setup           → returns shared key + otpauth URI
 *   POST /api/v1/auth/mfa/verify-setup    → confirms code and enables MFA
 *   POST /api/v1/auth/mfa/disable         → re-confirms password + code
 *
 * The user's current MFA state is read from session.user.twoFactorEnabled if
 * available, falling back to component-local state for the optimistic flip.
 */
export function MfaSection({
  initialEnabled = false,
  onChanged,
}: {
  initialEnabled?: boolean;
  onChanged?: (enabled: boolean) => void;
}) {
  const { apiClient } = useAuth();

  const [enabled, setEnabled] = useState<boolean>(initialEnabled);
  const [phase, setPhase] = useState<'idle' | 'setupPassword' | 'setup' | 'disable'>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [sharedKey, setSharedKey] = useState<string | null>(null);
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [setupPassword, setSetupPassword] = useState('');
  const [code, setCode] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  function reset() {
    setSharedKey(null);
    setOtpauthUri(null);
    setSetupPassword('');
    setCode('');
    setKeyCopied(false);
    setDisablePassword('');
    setDisableCode('');
    setError(null);
    setInfo(null);
  }

  async function handleStartSetup(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!setupPassword) {
      return;
    }

    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const result = await apiClient.setupMfa({ password: setupPassword });
      setSharedKey(result.sharedKey);
      setOtpauthUri(result.authenticatorUri);
      setSetupPassword('');
      setPhase('setup');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not start MFA setup.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifySetup() {
    setBusy(true);
    setError(null);
    try {
      await apiClient.verifyMfaSetup({ code: code.replace(/\s+/g, '') });
      setEnabled(true);
      setPhase('idle');
      reset();
      setInfo('Two-factor authentication is now enabled.');
      onChanged?.(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'That code was not accepted.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      await apiClient.disableMfa({
        password: disablePassword,
        code: disableCode.replace(/\s+/g, ''),
      });
      setEnabled(false);
      setPhase('idle');
      reset();
      setInfo('Two-factor authentication has been disabled.');
      onChanged?.(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not disable MFA.'));
    } finally {
      setBusy(false);
    }
  }

  function handleCopyKey() {
    if (!sharedKey) return;
    void navigator.clipboard.writeText(sharedKey).then(() => {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-neutral-border/60 pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <ShieldCheck className="size-4 text-primary" />
          Two-Factor Authentication
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Protect your account with a 6-digit code from an authenticator app.
        </p>
      </div>

      {info ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {info}
        </div>
      ) : null}

      {error && phase === 'idle' ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-border bg-neutral-surface/30 px-5 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-full',
              enabled ? 'bg-emerald-500/15' : 'bg-neutral-border/40',
            )}
          >
            <Shield className={cn('size-5', enabled ? 'text-emerald-400' : 'text-slate-500')} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Authenticator App
              {enabled && (
                <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                  Enabled
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">
              {enabled
                ? 'Your account is protected with TOTP 2FA.'
                : 'Use Google Authenticator, 1Password, Authy, or any TOTP app.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            if (enabled) {
              setPhase(phase === 'disable' ? 'idle' : 'disable');
            } else {
              setPhase(phase === 'idle' ? 'setupPassword' : 'idle');
            }
          }}
          disabled={busy}
          className={cn(
            'rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            enabled
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
          )}
        >
          {busy && phase === 'idle' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </span>
          ) : enabled ? (
            'Disable 2FA'
          ) : phase === 'idle' ? (
            'Enable 2FA'
          ) : (
            'Cancel setup'
          )}
        </button>
      </div>

      <AnimatePresence>
        {phase === 'setupPassword' ? (
          <motion.form
            onSubmit={(event) => void handleStartSetup(event)}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface/20 px-5 py-5"
          >
            <p className="mb-2 text-sm font-medium text-slate-200">Confirm your password</p>
            <p className="mb-4 text-xs text-slate-500">
              Enter your current password before generating a new authenticator secret.
            </p>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <FormField
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={setupPassword}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSetupPassword(event.target.value)
                }
              />
              <button
                type="submit"
                disabled={busy || !setupPassword}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? 'Checking...' : 'Continue'}
              </button>
            </div>

            {error ? (
              <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            ) : null}
          </motion.form>
        ) : null}

        {phase === 'setup' && sharedKey ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface/20 px-5 py-5"
          >
            <p className="mb-3 text-sm font-medium text-slate-200">Setup steps</p>
            <ol className="mb-5 space-y-2 text-sm text-slate-400">
              <li>1. Open your authenticator app and add a new account.</li>
              <li>2. Scan the QR code or enter the secret key below.</li>
              <li>3. Enter the 6-digit code your app generates to confirm.</li>
            </ol>

            {otpauthUri ? (
              <div className="mb-4 rounded-lg border border-neutral-border/60 bg-neutral-base/40 p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">QR data</p>
                <code className="block break-all text-xs text-slate-300">{otpauthUri}</code>
                <p className="mt-2 text-xs text-slate-500">
                  Paste this otpauth:// URI into your authenticator if it cannot scan a QR code.
                </p>
              </div>
            ) : null}

            <div className="mb-4 flex items-center gap-3 rounded-lg border border-neutral-border/60 bg-neutral-base/40 p-4">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-slate-500">Secret key</p>
                <code className="mt-1 block break-all font-mono text-sm text-slate-200">
                  {sharedKey}
                </code>
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-border bg-neutral-surface/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
              >
                {keyCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {keyCopied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <FormField
              label="Authenticator code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,8}"
              placeholder="123 456"
              value={code}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
            />

            {error ? (
              <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            ) : null}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void handleVerifySetup()}
                disabled={busy || code.replace(/\s+/g, '').length < 6}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? 'Verifying...' : 'Verify and enable'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase('idle');
                  reset();
                }}
                className="rounded-md border border-neutral-border px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : null}

        {phase === 'disable' ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface/20 px-5 py-5"
          >
            <p className="mb-2 text-sm font-medium text-slate-200">
              Confirm with your password and a current code
            </p>
            <p className="mb-4 text-xs text-slate-500">
              Disabling MFA requires both your password and a fresh authenticator code.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Password"
                type="password"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDisablePassword(e.target.value)
                }
              />
              <FormField
                label="Authenticator code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]{6,8}"
                value={disableCode}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDisableCode(e.target.value)
                }
              />
            </div>

            {error ? (
              <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            ) : null}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => void handleDisable()}
                disabled={busy || !disablePassword || disableCode.replace(/\s+/g, '').length < 6}
                className="inline-flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? 'Disabling...' : 'Disable 2FA'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase('idle');
                  reset();
                }}
                className="rounded-md border border-neutral-border px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
