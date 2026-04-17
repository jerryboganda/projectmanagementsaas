'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  Check,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/ui/form-field';
import { useTeamsData } from '@/hooks/use-teams-data';
import type { TeamMemberResponse, TeamResponse } from '@/lib/api/contracts';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function MemberAvatar({ member }: { member: TeamMemberResponse }) {
  const name = member.fullName || member.email || 'Member';
  if (member.avatarUrl) {
    return (
      <Image
        src={member.avatarUrl}
        alt={name}
        title={name}
        width={28}
        height={28}
        className="size-7 rounded-full border border-neutral-border object-cover"
      />
    );
  }
  return (
    <div
      title={name}
      className="flex size-7 items-center justify-center rounded-full border border-neutral-border bg-primary/15 text-[10px] font-semibold text-primary"
    >
      {initialsOf(name)}
    </div>
  );
}

function MemberAvatarStack({
  members,
  max = 5,
}: {
  members: TeamMemberResponse[];
  max?: number;
}) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((member) => (
        <MemberAvatar key={member.userId} member={member} />
      ))}
      {remaining > 0 && (
        <div className="flex size-7 items-center justify-center rounded-full border border-neutral-border bg-neutral-surface text-[10px] font-medium text-slate-400">
          +{remaining}
        </div>
      )}
    </div>
  );
}

export function TeamsPanel() {
  const {
    teams,
    isLoading,
    isError,
    error,
    refetch,
    createTeam,
    updateTeam,
    deleteTeam,
    isMutating,
  } = useTeamsData();

  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const flashMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  };

  const flashError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q),
    );
  }, [teams, searchQuery]);

  const handleCreate = async () => {
    if (!newTeamName.trim()) return;
    setIsCreating(true);
    try {
      const created = await createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || null,
      });
      setNewTeamName('');
      setNewTeamDescription('');
      setCreateOpen(false);
      flashMessage(`Team "${created.name}" created.`);
    } catch (err) {
      flashError(err instanceof Error ? err.message : 'Failed to create team.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (team: TeamResponse) => {
    setEditingTeamId(team.id);
    setEditingName(team.name);
    setEditingDescription(team.description ?? '');
  };

  const handleSaveEdit = async (team: TeamResponse) => {
    if (!editingName.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateTeam({
        teamId: team.id,
        input: {
          name: editingName.trim(),
          description: editingDescription.trim() || null,
          color: team.color ?? null,
        },
      });
      setEditingTeamId(null);
      setEditingName('');
      setEditingDescription('');
      flashMessage('Team updated.');
    } catch (err) {
      flashError(err instanceof Error ? err.message : 'Failed to update team.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditingName('');
    setEditingDescription('');
  };

  const handleDelete = async (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    setIsDeleting(true);
    try {
      await deleteTeam(teamId);
      setDeleteConfirmId(null);
      flashMessage(`Team "${team?.name ?? ''}" deleted.`);
    } catch (err) {
      flashError(err instanceof Error ? err.message : 'Failed to delete team.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mx-auto max-w-5xl px-8 py-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Teams</h1>
          <p className="mt-2 text-sm text-slate-400">
            Organise workspace members into teams for better collaboration and access control.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Create Team
        </button>
      </div>

      {/* Success message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300"
          >
            <Check className="size-4" />
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300"
          >
            <AlertTriangle className="size-4" />
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full rounded-md border border-neutral-border bg-background-dark py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
          />
        </div>
      </div>

      {/* Loading / Error / Empty / Grid */}
      {isLoading ? (
        <div className="rounded-xl border border-dashed border-neutral-border bg-neutral-surface/20 px-6 py-14 text-center">
          <Loader2 className="mx-auto mb-3 size-8 animate-spin text-slate-500" />
          <p className="text-sm font-medium text-slate-400">Loading teams…</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-6 py-10 text-center">
          <AlertTriangle className="mx-auto mb-3 size-8 text-rose-400" />
          <p className="text-sm font-medium text-rose-300">
            {error instanceof Error ? error.message : 'Failed to load teams.'}
          </p>
          <button
            onClick={() => void refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-neutral-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
          >
            Retry
          </button>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-border bg-neutral-surface/20 px-6 py-14 text-center">
          <UsersRound className="mx-auto mb-3 size-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">
            {searchQuery ? 'No teams match your search' : 'No teams yet'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {searchQuery
              ? `No results for "${searchQuery}".`
              : 'Create your first team to start organising your workspace members.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Create Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="group rounded-xl border border-neutral-border bg-neutral-surface/30 px-5 py-5 transition-colors hover:bg-neutral-surface/50"
            >
              {/* Team Name Row */}
              <div className="mb-2 flex items-start justify-between gap-3">
                {editingTeamId === team.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSaveEdit(team);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                      className="flex-1 rounded-md border border-primary/50 bg-background-dark px-2 py-1 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => void handleSaveEdit(team)}
                      disabled={isSavingEdit}
                      className="rounded-md p-1 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      {isSavingEdit ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-md p-1 text-slate-400 hover:bg-white/5 transition-colors"
                      title="Cancel"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100">{team.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleStartEdit(team)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
                        title="Edit team name"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(team.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        title="Delete team"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="mb-4 text-xs text-slate-500 leading-relaxed">
                {team.description || 'No description'}
              </p>

              {/* Members */}
              <div className="flex items-center justify-between">
                <MemberAvatarStack members={team.members} max={6} />
                <span className="text-xs text-slate-500">
                  {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => {
          if (isCreating) return;
          setCreateOpen(false);
          setNewTeamName('');
          setNewTeamDescription('');
        }}
        title="Create Team"
        footer={
          <>
            <button
              onClick={() => {
                setCreateOpen(false);
                setNewTeamName('');
                setNewTeamDescription('');
              }}
              disabled={isCreating}
              className="rounded-md border border-neutral-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={!newTeamName.trim() || isCreating}
              className={cn(
                'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90',
                (!newTeamName.trim() || isCreating) && 'cursor-not-allowed opacity-60',
              )}
            >
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {isCreating ? 'Creating...' : 'Create Team'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Team Name"
            placeholder="e.g. Engineering, Design, Marketing"
            value={newTeamName}
            required
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamName(e.target.value)}
          />
          <FormField
            as="textarea"
            label="Description"
            placeholder="What does this team focus on?"
            value={newTeamDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNewTeamDescription(e.target.value)
            }
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => {
          if (isDeleting) return;
          setDeleteConfirmId(null);
        }}
        title="Delete Team"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteConfirmId(null)}
              disabled={isDeleting}
              className="rounded-md border border-neutral-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirmId && void handleDelete(deleteConfirmId)}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {isDeleting ? 'Deleting…' : 'Delete Team'}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
            <AlertTriangle className="size-5 text-rose-400" />
          </div>
          <div>
            <p className="text-sm text-slate-200">
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {teams.find((t) => t.id === deleteConfirmId)?.name}
              </span>
              ?
            </p>
            <p className="mt-2 text-xs text-slate-500">
              This action cannot be undone. All team associations will be removed.
            </p>
          </div>
        </div>
      </Modal>

      {/* Background activity indicator */}
      {isMutating && !isCreating && !isSavingEdit && !isDeleting && (
        <div className="pointer-events-none fixed bottom-6 right-6 flex items-center gap-2 rounded-md border border-neutral-border bg-neutral-surface px-3 py-2 text-xs text-slate-300 shadow-lg">
          <Loader2 className="size-3.5 animate-spin" />
          Saving…
        </div>
      )}
    </motion.div>
  );
}
