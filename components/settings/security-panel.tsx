'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Monitor,
  Plus,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormField } from '@/components/ui/form-field';
import { MfaSection } from './mfa-section';

interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface LoginEntry {
  id: string;
  date: string;
  ip: string;
  location: string;
  device: string;
  status: 'success' | 'failed';
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
  scopes: string[];
}

const MOCK_SESSIONS: Session[] = [
  {
    id: 's1',
    device: 'Chrome on macOS',
    location: 'Los Angeles, CA',
    ip: '192.168.1.1',
    lastActive: 'Just now',
    isCurrent: true,
  },
  {
    id: 's2',
    device: 'Safari on iPhone',
    location: 'Los Angeles, CA',
    ip: '192.168.1.2',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
];

const MOCK_LOGIN_HISTORY: LoginEntry[] = [
  { id: 'l1', date: 'Mar 24, 2026 09:41 AM', ip: '192.168.1.1', location: 'Los Angeles, CA', device: 'Chrome / macOS', status: 'success' },
  { id: 'l2', date: 'Mar 23, 2026 06:12 PM', ip: '192.168.1.2', location: 'Los Angeles, CA', device: 'Safari / iPhone', status: 'success' },
  { id: 'l3', date: 'Mar 22, 2026 11:03 AM', ip: '203.0.113.5', location: 'New York, NY', device: 'Firefox / Windows', status: 'failed' },
  { id: 'l4', date: 'Mar 21, 2026 08:30 AM', ip: '192.168.1.1', location: 'Los Angeles, CA', device: 'Chrome / macOS', status: 'success' },
];

function SaveToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {message}
          </div>
          <button onClick={onDismiss} className="text-emerald-400 hover:text-emerald-200">
            <X className="size-4" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function SecurityPanel() {
  // Password section
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 2FA state is managed by <MfaSection /> via the auth API.

  // Sessions
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'k1',
      name: 'Local Dev Key',
      prefix: 'lp_dev_****',
      createdAt: 'Mar 1, 2026',
      lastUsed: 'Mar 24, 2026',
      scopes: ['read:projects', 'write:tasks'],
    },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [apiKeyMessage, setApiKeyMessage] = useState<string | null>(null);

  const handlePasswordSave = async () => {
    setPasswordMessage(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSavingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage('Password changed successfully. All other sessions will be signed out.');
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setSessionMessage('Session revoked.');
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    await new Promise((r) => setTimeout(r, 800));
    const secret = `lp_live_${Math.random().toString(36).slice(2, 18)}`;
    setApiKeys((prev) => [
      ...prev,
      {
        id: `k${Date.now()}`,
        name: newKeyName.trim(),
        prefix: `lp_live_****`,
        createdAt: 'Mar 24, 2026',
        lastUsed: null,
        scopes: ['read:projects'],
      },
    ]);
    setNewKeySecret(secret);
    setNewKeyName('');
    setCreatingKey(false);
    setApiKeyMessage('API key created. Copy it now — it will not be shown again.');
  };

  const handleDeleteApiKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    setApiKeyMessage('API key revoked.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mx-auto max-w-5xl px-8 py-8"
    >
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Security &amp; Access</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your password, two-factor authentication, active sessions, and personal API keys.
        </p>
      </div>

      <div className="space-y-10">
        {/* Password */}
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <Lock className="size-4 text-primary" />
              Change Password
            </h2>
          </div>

          <SaveToast message={passwordMessage ?? ''} onDismiss={() => setPasswordMessage(null)} />

          <AnimatePresence>
            {passwordError ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
              >
                {passwordError}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <FormField
                label="Current Password"
                type={showCurrentPw ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-8 text-slate-500 hover:text-slate-300"
              >
                {showCurrentPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <div />

            <div className="relative">
              <FormField
                label="New Password"
                type={showNewPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-8 text-slate-500 hover:text-slate-300"
              >
                {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <FormField
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            />
          </div>

          {newPassword.length > 0 && (
            <div className="flex items-center gap-2">
              <div className={cn('h-1.5 flex-1 rounded-full', newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-rose-500')} />
              <div className={cn('h-1.5 flex-1 rounded-full', newPassword.length >= 12 ? 'bg-emerald-500' : 'bg-neutral-border')} />
              <div className={cn('h-1.5 flex-1 rounded-full', /[^a-zA-Z0-9]/.test(newPassword) && newPassword.length >= 12 ? 'bg-emerald-500' : 'bg-neutral-border')} />
              <span className="text-xs text-slate-500">
                {newPassword.length < 8 ? 'Too short' : newPassword.length < 12 ? 'Fair' : 'Strong'}
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => void handlePasswordSave()}
              disabled={savingPassword}
              className={cn(
                'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90',
                savingPassword && 'cursor-not-allowed opacity-60',
              )}
            >
              {savingPassword ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {savingPassword ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </section>

        {/* 2FA */}
        <MfaSection />

        {/* Active Sessions */}
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <Monitor className="size-4 text-primary" />
              Active Sessions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Devices currently signed in to your account. Revoke any session you do not recognise.
            </p>
          </div>

          <SaveToast message={sessionMessage ?? ''} onDismiss={() => setSessionMessage(null)} />

          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'flex flex-col gap-3 rounded-xl border px-5 py-4 md:flex-row md:items-center md:justify-between',
                  session.isCurrent
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-neutral-border bg-neutral-surface/30',
                )}
              >
                <div className="flex items-center gap-3">
                  <Monitor className={cn('size-5 shrink-0', session.isCurrent ? 'text-primary' : 'text-slate-500')} />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {session.device}
                      {session.isCurrent && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          This device
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.location} · {session.ip} · Last active: {session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
                  >
                    <X className="size-3.5" />
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Login History */}
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <Shield className="size-4 text-primary" />
              Login History
            </h2>
            <p className="mt-1 text-sm text-slate-500">Last 10 sign-in events.</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-border">
            <div className="grid grid-cols-[1fr_140px_160px_80px] gap-4 border-b border-neutral-border/60 bg-neutral-surface/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Date</span>
              <span>IP Address</span>
              <span>Device</span>
              <span>Status</span>
            </div>
            {MOCK_LOGIN_HISTORY.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[1fr_140px_160px_80px] gap-4 border-b border-neutral-border/30 px-5 py-4 last:border-b-0"
              >
                <div>
                  <p className="text-sm text-slate-300">{entry.date}</p>
                  <p className="text-xs text-slate-500">{entry.location}</p>
                </div>
                <span className="self-center font-mono text-xs text-slate-400">{entry.ip}</span>
                <span className="self-center text-xs text-slate-400">{entry.device}</span>
                <span
                  className={cn(
                    'self-center inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    entry.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'bg-rose-500/10 text-rose-300',
                  )}
                >
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* API Keys */}
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <Key className="size-4 text-primary" />
              Personal API Keys
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use these tokens to authenticate API requests on your behalf.
            </p>
          </div>

          <SaveToast message={apiKeyMessage ?? ''} onDismiss={() => setApiKeyMessage(null)} />

          <AnimatePresence>
            {newKeySecret ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-200">Copy your API key now</p>
                  <p className="mt-1 text-xs text-amber-300/70">This secret will not be shown again.</p>
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-500/20 bg-background-dark px-3 py-2 font-mono text-xs text-slate-300">
                    <span className="flex-1 truncate">{newKeySecret}</span>
                    <button
                      onClick={() => { void navigator.clipboard.writeText(newKeySecret); }}
                      className="shrink-0 text-slate-500 hover:text-slate-300"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
                <button onClick={() => setNewKeySecret(null)} className="text-amber-400 hover:text-amber-200">
                  <X className="size-4" />
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {apiKeys.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-neutral-border">
              <div className="grid grid-cols-[1fr_140px_160px_60px] gap-4 border-b border-neutral-border/60 bg-neutral-surface/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Name / Token</span>
                <span>Created</span>
                <span>Last Used</span>
                <span />
              </div>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="grid grid-cols-[1fr_140px_160px_60px] gap-4 border-b border-neutral-border/30 px-5 py-4 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{key.name}</p>
                    <p className="font-mono text-xs text-slate-500">{key.prefix}</p>
                  </div>
                  <span className="self-center text-xs text-slate-400">{key.createdAt}</span>
                  <span className="self-center text-xs text-slate-400">
                    {key.lastUsed ?? 'Never'}
                  </span>
                  <div className="flex justify-end self-center">
                    <button
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="text-slate-600 transition-colors hover:text-rose-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormField
                label="New Key Name"
                placeholder="e.g. CI/CD Pipeline"
                value={newKeyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKeyName(e.target.value)}
              />
            </div>
            <button
              onClick={() => void handleCreateApiKey()}
              disabled={!newKeyName.trim() || creatingKey}
              className={cn(
                'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 mb-0.5',
                (!newKeyName.trim() || creatingKey) && 'cursor-not-allowed opacity-60',
              )}
            >
              {creatingKey ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {creatingKey ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
