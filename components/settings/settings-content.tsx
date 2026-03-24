'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Loader2,
  Mail,
  Save,
  Shield,
  Smartphone,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { useSettingsData, type GeneralSettingsInput, type SettingsNotificationPreference } from '@/hooks/use-settings-data';
import type { WorkspaceMemberResponse } from '@/lib/api/contracts';
import type { SettingsCategory } from './data';
import { BillingPanel } from './billing-panel';
import { SecurityPanel } from './security-panel';
import { IntegrationsPanel } from './integrations-panel';
import { AppearancePanel } from './appearance-panel';

interface SettingsContentProps {
  activeCategory: SettingsCategory;
}

type RoleOption = 'Owner' | 'Admin' | 'Member' | 'Guest';

const ROLE_OPTIONS: RoleOption[] = ['Owner', 'Admin', 'Member', 'Guest'];
const TIMEZONE_OPTIONS = ['America/Los_Angeles', 'America/New_York', 'Europe/London', 'Asia/Karachi', 'Asia/Tokyo', 'UTC'];
const DATE_FORMAT_OPTIONS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
const TIME_FORMAT_OPTIONS = ['12h', '24h'];
const WEEK_START_OPTIONS = ['Monday', 'Sunday', 'Saturday'];

function normalizeRole(role: WorkspaceMemberResponse['role'] | null | undefined): RoleOption {
  if (role === 0 || role === 'Owner') return 'Owner';
  if (role === 1 || role === 'Admin') return 'Admin';
  if (role === 2 || role === 'Member') return 'Member';
  return 'Guest';
}

function toInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatJoinedAt(value?: string | null) {
  if (!value) return 'Joined recently';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Joined recently'
    : `Joined ${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function SaveBar({
  message,
  error,
  onSave,
  isSaving,
  disabled = false,
}: {
  message: string | null;
  error: string | null;
  onSave: () => void;
  isSaving: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-20 mt-10 border-t border-neutral-border/60 bg-background-dark/90 px-8 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex-1">
          <AnimatePresence>
            {message ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300"
              >
                <CheckCircle2 className="size-4" />
                {message}
              </motion.div>
            ) : null}
          </AnimatePresence>
          {error ? (
            <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </div>
          ) : null}
        </div>
        <button
          onClick={onSave}
          disabled={disabled || isSaving}
          className={cn(
            'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-50 transition-colors hover:bg-primary/90',
            (disabled || isSaving) && 'cursor-not-allowed opacity-60',
          )}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ElementType;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-3">
      <Icon className="size-4 text-slate-500" />
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <div className={cn('relative h-5 w-10 rounded-full border transition-colors', checked ? 'border-primary bg-primary/80' : 'border-neutral-border bg-neutral-surface')}>
        <div className={cn('absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-[2px]')} />
      </div>
    </label>
  );
}

function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mx-auto max-w-5xl px-8 py-8"
    >
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      <div className="rounded-xl border border-dashed border-neutral-border bg-neutral-surface/30 px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/5">
          <Info className="size-6 text-slate-500" />
        </div>
        <h3 className="text-base font-medium text-slate-300">This panel is not live yet</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          It stays explicitly marked as non-live until the backend contract and persistent frontend behavior both exist.
        </p>
      </div>
    </motion.div>
  );
}

function GeneralPanel({
  formDefaults,
  slug,
  canManageWorkspace,
  isLoading,
  isSaving,
  onSave,
}: {
  formDefaults: GeneralSettingsInput | null;
  slug: string | null;
  canManageWorkspace: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (input: GeneralSettingsInput) => Promise<unknown>;
}) {
  const [form, setForm] = useState<GeneralSettingsInput | null>(formDefaults);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading && !form) {
    return <PlaceholderPanel title="Workspace General" description="Loading workspace settings..." />;
  }

  if (!form) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-5xl px-8 py-8">
        <EmptyState icon={Info} title="No active workspace selected" description="Choose or create a workspace before editing workspace settings." />
      </motion.div>
    );
  }

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    try {
      await onSave(form);
      setMessage('Workspace settings saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save workspace settings.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Workspace General</h1>
        <p className="mt-2 text-sm text-slate-400">Manage your workspace profile, branding, and regional defaults.</p>
      </div>

      {!canManageWorkspace ? (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          You can view workspace settings, but only owners and admins can change them.
        </div>
      ) : null}

      <div className="space-y-10">
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="text-base font-semibold text-slate-200">Workspace Profile</h2>
            <p className="mt-1 text-sm text-slate-500">Logo upload is not wired yet, so the live setting uses a logo URL.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-[180px_1fr]">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-xl border border-neutral-border bg-neutral-surface text-lg font-semibold text-primary">
                {toInitials(form.name || 'LP')}
              </div>
              <div className="flex items-center gap-2 rounded-md border border-neutral-border bg-neutral-surface/40 px-3 py-2 text-sm text-slate-400">
                <Upload className="size-4" />
                URL-backed for now
              </div>
            </div>
            <FormField label="Logo URL" placeholder="https://cdn.example.com/logo.png" value={form.logoUrl} disabled={!canManageWorkspace} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => current ? { ...current, logoUrl: event.target.value } : current)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Workspace Name" value={form.name} disabled={!canManageWorkspace} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => current ? { ...current, name: event.target.value } : current)} />
            <FormField label="Workspace Slug" value={slug ?? ''} disabled hint="Slug generation is backend-managed right now." onChange={() => undefined} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Workspace Domain" placeholder="app.example.com" value={form.domain} disabled={!canManageWorkspace} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => current ? { ...current, domain: event.target.value } : current)} />
            <FormField label="Description" placeholder="What this workspace is used for" value={form.description} disabled={!canManageWorkspace} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => current ? { ...current, description: event.target.value } : current)} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="text-base font-semibold text-slate-200">Regional Defaults</h2>
            <p className="mt-1 text-sm text-slate-500">These preferences come from the live workspace settings contract.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField as="select" label="Timezone" value={form.timezone} disabled={!canManageWorkspace} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setForm((current) => current ? { ...current, timezone: event.target.value } : current)}>{TIMEZONE_OPTIONS.map((option) => <option key={option} value={option} className="bg-background-dark">{option}</option>)}</FormField>
            <FormField as="select" label="Week Starts On" value={form.weekStartsOn} disabled={!canManageWorkspace} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setForm((current) => current ? { ...current, weekStartsOn: event.target.value } : current)}>{WEEK_START_OPTIONS.map((option) => <option key={option} value={option} className="bg-background-dark">{option}</option>)}</FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField as="select" label="Date Format" value={form.dateFormat} disabled={!canManageWorkspace} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setForm((current) => current ? { ...current, dateFormat: event.target.value } : current)}>{DATE_FORMAT_OPTIONS.map((option) => <option key={option} value={option} className="bg-background-dark">{option}</option>)}</FormField>
            <FormField as="select" label="Time Format" value={form.timeFormat} disabled={!canManageWorkspace} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setForm((current) => current ? { ...current, timeFormat: event.target.value } : current)}>{TIME_FORMAT_OPTIONS.map((option) => <option key={option} value={option} className="bg-background-dark">{option}</option>)}</FormField>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border-b border-rose-500/20 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-rose-300">
              <AlertTriangle className="size-4" />
              Danger Zone
            </h2>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-rose-500/20 bg-rose-500/5 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-200">Delete Workspace</h3>
              <p className="mt-1 max-w-xl text-xs text-slate-400">
                Hard delete is intentionally withheld from the web UI until recovery and billing safeguards are fully automated.
              </p>
            </div>
            <button disabled className="inline-flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 opacity-70">
              <AlertTriangle className="size-4" />
              Protected
            </button>
          </div>
        </section>
      </div>

      <SaveBar message={message} error={error} onSave={handleSave} isSaving={isSaving} disabled={!canManageWorkspace} />
    </motion.div>
  );
}

function MembersPanel({
  members,
  isLoading,
  canManageMembers,
  onInvite,
  onUpdateRole,
  onRemove,
  isInviting,
}: {
  members: WorkspaceMemberResponse[];
  isLoading: boolean;
  canManageMembers: boolean;
  onInvite: (email: string, role: WorkspaceMemberResponse['role']) => Promise<unknown>;
  onUpdateRole: (userId: string, role: WorkspaceMemberResponse['role']) => Promise<unknown>;
  onRemove: (userId: string) => Promise<unknown>;
  isInviting: boolean;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleOption>('Member');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    setMessage(null);
    setError(null);
    try {
      await onInvite(inviteEmail, inviteRole);
      setMessage(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail('');
      setInviteRole('Member');
      setInviteOpen(false);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Unable to send invitation.');
    }
  };

  const handleRoleChange = async (userId: string, role: WorkspaceMemberResponse['role']) => {
    setMessage(null);
    setError(null);
    try {
      await onUpdateRole(userId, role);
      setMessage('Member role updated.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update member role.');
    }
  };

  const handleRemove = async (userId: string) => {
    setMessage(null);
    setError(null);
    try {
      await onRemove(userId);
      setMessage('Member removed from workspace.');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove member.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Workspace Members</h1>
          <p className="mt-2 text-sm text-slate-400">Manage workspace access, roles, and invitations from the live membership API.</p>
        </div>
        <button onClick={() => setInviteOpen(true)} disabled={!canManageMembers} className={cn('flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-50 transition-colors hover:bg-primary/90', !canManageMembers && 'cursor-not-allowed opacity-60')}>
          <UserPlus className="size-4" />
          Invite Member
        </button>
      </div>

      {!canManageMembers ? (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          You can see who is in the workspace, but only owners and admins can change access.
        </div>
      ) : null}

      {isLoading ? (
        <PlaceholderPanel title="Workspace Members" description="Loading workspace members..." />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Invite teammates to start collaborating in this workspace." actionLabel={canManageMembers ? 'Invite Member' : undefined} onAction={canManageMembers ? () => setInviteOpen(true) : undefined} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-border">
          <div className="grid grid-cols-[1.3fr_1fr_170px_130px] gap-4 border-b border-neutral-border/60 bg-neutral-surface/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Member</span>
            <span>Email</span>
            <span>Role</span>
            <span className="text-right">Actions</span>
          </div>
          {members.map((member) => (
            <div key={member.id} className="grid grid-cols-[1.3fr_1fr_170px_130px] gap-4 border-b border-neutral-border/30 px-5 py-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full border border-neutral-border bg-primary/15 text-xs font-semibold text-primary">
                  {toInitials(member.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{member.fullName}</p>
                  <p className="text-xs text-slate-500">{formatJoinedAt(member.joinedAt)}</p>
                </div>
              </div>
              <div className="self-center text-sm text-slate-400">{member.email}</div>
              <div className="self-center">
                <select value={normalizeRole(member.role)} disabled={!canManageMembers} onChange={(event) => void handleRoleChange(member.userId, event.target.value as RoleOption)} className="w-full rounded-md border border-neutral-border bg-background-dark px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-70">
                  {ROLE_OPTIONS.map((role) => <option key={role} value={role} className="bg-background-dark">{role}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end">
                <button onClick={() => void handleRemove(member.userId)} disabled={!canManageMembers} className={cn('inline-flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20', !canManageMembers && 'cursor-not-allowed opacity-60')}>
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        {message ? <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</div> : null}
        {error ? <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div> : null}
      </div>

      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Workspace Member" footer={
        <>
          <button onClick={() => setInviteOpen(false)} className="rounded-md border border-neutral-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100">Cancel</button>
          <button onClick={() => void handleInvite()} disabled={!inviteEmail.trim() || isInviting} className={cn('flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-50 transition-colors hover:bg-primary/90', (!inviteEmail.trim() || isInviting) && 'cursor-not-allowed opacity-60')}>
            {isInviting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            {isInviting ? 'Sending...' : 'Send Invite'}
          </button>
        </>
      }>
        <div className="space-y-4">
          <FormField label="Email" type="email" placeholder="teammate@example.com" value={inviteEmail} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(event.target.value)} />
          <FormField as="select" label="Role" value={inviteRole} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setInviteRole(event.target.value as RoleOption)}>
            {ROLE_OPTIONS.filter((role) => role !== 'Owner').map((role) => <option key={role} value={role} className="bg-background-dark">{role}</option>)}
          </FormField>
        </div>
      </Modal>
    </motion.div>
  );
}

function ProfilePanel({
  profile,
  isLoading,
  isSaving,
  onSave,
}: {
  profile: { fullName: string; displayName?: string | null; email: string; avatarUrl?: string | null; timezone?: string | null; locale?: string | null; jobTitle?: string | null } | null;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (input: { fullName?: string | null; displayName?: string | null; avatarUrl?: string | null; timezone?: string | null; locale?: string | null; jobTitle?: string | null }) => Promise<unknown>;
}) {
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC');
  const [locale, setLocale] = useState(profile?.locale ?? 'en-US');
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    try {
      await onSave({ fullName, displayName: displayName || null, avatarUrl: avatarUrl || null, timezone: timezone || null, locale: locale || null, jobTitle: jobTitle || null });
      setMessage('Profile updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save your profile.');
    }
  };

  if (isLoading && !profile) {
    return <PlaceholderPanel title="My Profile" description="Loading your profile..." />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">My Profile</h1>
        <p className="mt-2 text-sm text-slate-400">These fields are backed by the live `/api/v1/users/me` account profile.</p>
      </div>

      <div className="space-y-10">
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="text-base font-semibold text-slate-200">Identity</h2>
            <p className="mt-1 text-sm text-slate-500">Direct uploads are not wired yet, so the live profile uses an avatar URL.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-[180px_1fr]">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full border border-neutral-border bg-primary/15 text-lg font-semibold text-primary">{toInitials(fullName || 'LP')}</div>
              <div className="flex items-center gap-2 rounded-md border border-neutral-border bg-neutral-surface/40 px-3 py-2 text-sm text-slate-400">
                <Upload className="size-4" />
                URL-backed for now
              </div>
            </div>
            <FormField label="Avatar URL" placeholder="https://cdn.example.com/avatar.png" value={avatarUrl} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAvatarUrl(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Full Name" value={fullName} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setFullName(event.target.value)} />
            <FormField label="Display Name" placeholder="Optional short display name" value={displayName} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Email" value={profile?.email ?? ''} disabled hint="Email changes are handled in auth/account recovery flows." onChange={() => undefined} />
            <FormField label="Job Title" placeholder="Product Manager" value={jobTitle} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setJobTitle(event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField as="select" label="Timezone" value={timezone} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setTimezone(event.target.value)}>{TIMEZONE_OPTIONS.map((option) => <option key={option} value={option} className="bg-background-dark">{option}</option>)}</FormField>
            <FormField label="Locale" placeholder="en-US" value={locale} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLocale(event.target.value)} />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-border bg-neutral-surface/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-slate-200">Security stays outside this panel</p>
              <p className="mt-1 text-sm text-slate-500">Password, lockout, recovery, and future MFA remain separate so the UI mirrors the actual backend boundaries.</p>
            </div>
          </div>
        </section>
      </div>

      <SaveBar message={message} error={error} onSave={handleSave} isSaving={isSaving} />
    </motion.div>
  );
}

function NotificationsPanel({
  preferences,
  isSaving,
  onSave,
}: {
  preferences: SettingsNotificationPreference[];
  isSaving: boolean;
  onSave: (preferences: SettingsNotificationPreference[]) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState<SettingsNotificationPreference[]>(preferences);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (eventType: string, field: 'inApp' | 'email' | 'push', checked: boolean) => {
    setDraft((current) => current.map((item) => item.eventType === eventType ? { ...item, [field]: checked } : item));
  };

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    try {
      await onSave(draft);
      setMessage('Notification preferences saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save notification preferences.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Notification Preferences</h1>
        <p className="mt-2 text-sm text-slate-400">These toggles are backed by the live notification preference contract instead of mock switches.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-border">
        <div className="grid grid-cols-[1.4fr_120px_120px_120px] gap-4 border-b border-neutral-border/60 bg-neutral-surface/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Event</span>
          <span className="text-center">In-App</span>
          <span className="text-center">Email</span>
          <span className="text-center">Push</span>
        </div>
        {draft.map((item) => (
          <div key={item.eventType} className="grid grid-cols-[1.4fr_120px_120px_120px] gap-4 border-b border-neutral-border/30 px-5 py-4 last:border-b-0">
            <div>
              <p className="text-sm font-medium text-slate-200">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
            </div>
            <Toggle checked={item.inApp} onChange={(checked) => handleToggle(item.eventType, 'inApp', checked)} icon={Bell} />
            <Toggle checked={item.email} onChange={(checked) => handleToggle(item.eventType, 'email', checked)} icon={Mail} />
            <Toggle checked={item.push} onChange={(checked) => handleToggle(item.eventType, 'push', checked)} icon={Smartphone} />
          </div>
        ))}
      </div>

      <SaveBar message={message} error={error} onSave={handleSave} isSaving={isSaving} />
    </motion.div>
  );
}

export function SettingsContent({ activeCategory }: SettingsContentProps) {
  const {
    workspaceSettingsQuery,
    workspaceSettingsInput,
    membersQuery,
    profileQuery,
    notificationPreferences,
    canManageWorkspace,
    canManageMembers,
    saveWorkspace,
    isSavingWorkspace,
    saveProfile,
    isSavingProfile,
    updateMemberRole,
    removeMember,
    inviteMember,
    isInvitingMember,
    saveNotificationPreferences,
    isSavingNotificationPreferences,
  } = useSettingsData();

  const profile = useMemo(() => {
    if (!profileQuery.data) {
      return null;
    }

    return {
      fullName: profileQuery.data.fullName,
      displayName: profileQuery.data.displayName,
      email: profileQuery.data.email,
      avatarUrl: profileQuery.data.avatarUrl,
      timezone: profileQuery.data.timezone,
      locale: profileQuery.data.locale,
      jobTitle: profileQuery.data.jobTitle,
    };
  }, [profileQuery.data]);

  switch (activeCategory) {
    case 'general':
      return <GeneralPanel key={workspaceSettingsInput ? JSON.stringify(workspaceSettingsInput) : 'general-empty'} formDefaults={workspaceSettingsInput} slug={workspaceSettingsQuery.data?.slug ?? null} canManageWorkspace={canManageWorkspace} isLoading={workspaceSettingsQuery.isLoading} isSaving={isSavingWorkspace} onSave={saveWorkspace} />;
    case 'members':
      return <MembersPanel members={membersQuery.data ?? []} isLoading={membersQuery.isLoading} canManageMembers={canManageMembers} onInvite={inviteMember} onUpdateRole={updateMemberRole} onRemove={removeMember} isInviting={isInvitingMember} />;
    case 'profile':
      return <ProfilePanel key={profile ? JSON.stringify(profile) : 'profile-empty'} profile={profile} isLoading={profileQuery.isLoading} isSaving={isSavingProfile} onSave={saveProfile} />;
    case 'notifications':
      return <NotificationsPanel key={JSON.stringify(notificationPreferences)} preferences={notificationPreferences} isSaving={isSavingNotificationPreferences} onSave={saveNotificationPreferences} />;
    case 'appearance':
      return <AppearancePanel />;
    case 'billing':
      return <BillingPanel />;
    case 'integrations':
      return <IntegrationsPanel />;
    case 'security':
      return <SecurityPanel />;
    case 'teams':
      return <PlaceholderPanel title="Teams" description="Teams still need a dedicated backend contract before the Settings surface can manage them honestly." />;
    default:
      return <PlaceholderPanel title="Settings" description="Select a category from the sidebar." />;
  }
}
