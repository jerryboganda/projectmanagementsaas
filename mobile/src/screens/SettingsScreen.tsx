import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, Chip } from '../ui';
import {
  User,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Users,
  Globe,
  Webhook,
  LogOut,
  ChevronRight,
  Loader2,
  Check,
  Building2,
} from 'lucide-react';
import {
  clearTokens,
  getActiveWorkspaceId,
  loadPersistedSession,
  switchActiveWorkspace,
  type PersistedSession,
} from '../auth/token-store';
import { clearBiometric } from '../auth/biometric';
import { api } from '../api/client';
import { useMe } from '../hooks/use-data';
import { initialsOf } from '../data/adapters';

interface Row {
  id: string;
  label: string;
  icon: typeof User;
  meta?: string;
}

const GROUPS: Array<{ title: string; rows: Row[] }> = [
  {
    title: 'Account',
    rows: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'notifications', label: 'Notifications', icon: Bell, meta: 'On' },
      { id: 'appearance', label: 'Appearance', icon: Palette, meta: 'Dark' },
    ],
  },
  {
    title: 'Security',
    rows: [
      { id: 'password', label: 'Password & Sessions', icon: Shield },
      { id: '2fa', label: 'Two-Factor Auth', icon: Shield, meta: 'Enabled' },
    ],
  },
  {
    title: 'Workspace',
    rows: [
      { id: 'billing', label: 'Billing & Plan', icon: CreditCard, meta: 'Pro' },
      { id: 'members', label: 'Members', icon: Users, meta: '12' },
      { id: 'integrations', label: 'Integrations', icon: Webhook },
      { id: 'region', label: 'Region', icon: Globe, meta: 'US-East' },
    ],
  },
];

export function SettingsScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [session, setSession] = useState<PersistedSession | null>(null);
  const [activeWsId, setActiveWsId] = useState<string | null>(getActiveWorkspaceId());
  const [switchingWs, setSwitchingWs] = useState<string | null>(null);
  const me = useMe();

  useEffect(() => {
    void loadPersistedSession().then((s) => setSession(s));
  }, []);

  async function switchTo(workspaceId: string) {
    if (switchingWs || workspaceId === activeWsId) return;
    setSwitchingWs(workspaceId);
    try {
      await switchActiveWorkspace(workspaceId);
      setActiveWsId(workspaceId);
      await qc.invalidateQueries();
    } finally {
      setSwitchingWs(null);
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // Best-effort server-side revocation; continue even if offline.
      await api.auth.logout().catch(() => undefined);
      await clearTokens();
      await clearBiometric();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  const workspaces = session?.workspaces ?? [];

  return (
    <ScreenContainer>
      {me.data ? (
        <section className="flex items-center gap-3 px-4 py-5 border-b border-[#1A1A1A]">
          {me.data.avatarUrl ? (
            <img
              src={me.data.avatarUrl}
              alt=""
              className="size-12 rounded-full border border-[#1A1A1A] object-cover"
            />
          ) : (
            <span className="size-12 rounded-full bg-[#0066FF]/15 border border-[#0066FF]/30 text-[#0066FF] font-mono text-[13px] font-semibold uppercase flex items-center justify-center">
              {initialsOf(me.data.fullName || me.data.email)}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-slate-100 truncate">
              {me.data.displayName || me.data.fullName}
            </p>
            <p className="text-[12px] text-slate-500 truncate">{me.data.email}</p>
          </div>
        </section>
      ) : null}

      {workspaces.length > 0 ? (
        <section className="mt-2">
          <SectionHeader title="Workspaces" />
          <div className="divide-y divide-[#1A1A1A]">
            {workspaces.map((w) => {
              const isActive = w.workspaceId === activeWsId;
              const isSwitching = switchingWs === w.workspaceId;
              return (
                <button
                  key={w.workspaceId}
                  type="button"
                  onClick={() => void switchTo(w.workspaceId)}
                  disabled={isSwitching || isActive}
                  className={`w-full flex items-center gap-3 px-4 h-12 text-left transition-colors ${
                    isActive ? 'bg-[#0066FF]/5' : 'hover:bg-[#141414]'
                  }`}
                >
                  <Building2
                    className={`w-4 h-4 ${isActive ? 'text-[#0066FF]' : 'text-slate-400'}`}
                    strokeWidth={1.75}
                  />
                  <span className="flex-1 text-[13px] text-slate-200 truncate">{w.name}</span>
                  <Chip tone="neutral">{String(w.role)}</Chip>
                  {isSwitching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0066FF]" />
                  ) : isActive ? (
                    <Check className="w-4 h-4 text-[#0066FF]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {GROUPS.map((g) => (
        <section key={g.title} className="mt-2">
          <SectionHeader title={g.title} />
          <div className="divide-y divide-[#1A1A1A]">
            {g.rows.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActive(r.id)}
                  className={`w-full flex items-center gap-3 px-4 h-12 text-left transition-colors ${
                    active === r.id ? 'bg-[#141414]' : 'hover:bg-[#141414]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
                  <span className="flex-1 text-[13px] text-slate-200">{r.label}</span>
                  {r.meta ? <Chip tone="neutral">{r.meta}</Chip> : null}
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section className="mt-4 px-4 pb-6">
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-[4px] bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors disabled:opacity-60"
        >
          {signingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </ScreenContainer>
  );
}

