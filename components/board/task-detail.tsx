'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Eye,
  Folder,
  MessageSquare,
  Paperclip,
  Plus,
  Save,
  Send,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BoardTask, BoardTaskPriority, BoardTaskStatus, BoardUser } from '@/components/board/types';
import type { ProjectResponse } from '@/lib/api/contracts';
import type {
  TaskCommentResponse,
  TaskChecklistItemResponse,
  TaskWatcherResponse,
  FileAttachmentResponse,
} from '@/lib/api/client';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  label,
  count,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-neutral-border bg-white/[0.02]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <Icon className="size-4 shrink-0 text-slate-400" />
        <span className="flex-1 text-[13px] font-medium text-slate-200">{label}</span>
        {count !== undefined && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-slate-400">
            {count}
          </span>
        )}
        {open ? (
          <ChevronDown className="size-3.5 text-slate-500" />
        ) : (
          <ChevronRight className="size-3.5 text-slate-500" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-neutral-border px-4 py-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  initials,
  avatarUrl,
  size = 'sm',
}: {
  name: string;
  initials: string;
  avatarUrl?: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'size-7' : 'size-8';
  const text = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={name}
      title={name}
      className={cn(dim, 'rounded-full object-cover')}
    />
  ) : (
    <span
      title={name}
      className={cn(
        dim,
        text,
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary/20 font-medium text-primary',
      )}
    >
      {initials}
    </span>
  );
}

// ─── Checklist section ────────────────────────────────────────────────────────

function ChecklistSection({
  taskId,
  items,
  isLoading,
  isPending,
  onCreate,
  onToggle,
  onDelete,
}: {
  taskId: string;
  items: TaskChecklistItemResponse[];
  isLoading: boolean;
  isPending: boolean;
  onCreate: (text: string) => Promise<unknown>;
  onToggle: (itemId: string, isCompleted: boolean) => Promise<unknown>;
  onDelete: (itemId: string) => Promise<unknown>;
}) {
  const [newText, setNewText] = useState('');
  const completed = items.filter((i) => i.isCompleted).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = async () => {
    const trimmed = newText.trim();
    if (!trimmed || isPending) return;
    setNewText('');
    await onCreate(trimmed);
  };

  return (
    <Section
      icon={CheckSquare}
      label="Checklist"
      count={total}
    >
      {total > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500">
            {completed}/{total}
          </span>
        </div>
      )}

      {isLoading ? (
        <p className="text-[12px] text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[12px] text-slate-500">No checklist items yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {items
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => (
              <li
                key={item.id}
                className="group flex items-start gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-white/[0.03]"
              >
                <button
                  onClick={() => void onToggle(item.id, !item.isCompleted)}
                  className={cn(
                    'mt-px flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                    item.isCompleted
                      ? 'border-primary bg-primary text-white'
                      : 'border-white/20 bg-transparent text-transparent hover:border-primary/60',
                  )}
                >
                  <Check className="size-2.5" />
                </button>
                <span
                  className={cn(
                    'flex-1 text-[13px]',
                    item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200',
                  )}
                >
                  {item.text}
                </span>
                <button
                  onClick={() => void onDelete(item.id)}
                  className="shrink-0 rounded p-0.5 text-transparent transition-colors group-hover:text-slate-500 hover:!text-rose-400"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAdd();
          }}
          placeholder="Add checklist item…"
          className="flex-1 rounded-md border border-neutral-border bg-transparent px-3 py-1.5 text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={() => void handleAdd()}
          disabled={!newText.trim() || isPending}
          className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>
    </Section>
  );
}

// ─── Comments section ─────────────────────────────────────────────────────────

function CommentsSection({
  taskId,
  comments,
  isLoading,
  isPending,
  currentUserId,
  onCreate,
  onDelete,
}: {
  taskId: string;
  comments: TaskCommentResponse[];
  isLoading: boolean;
  isPending: boolean;
  currentUserId?: string;
  onCreate: (content: string) => Promise<unknown>;
  onDelete: (commentId: string) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState('');

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isPending) return;
    setDraft('');
    await onCreate(trimmed);
  };

  return (
    <Section icon={MessageSquare} label="Comments" count={comments.length}>
      {isLoading ? (
        <p className="text-[12px] text-slate-500">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-[12px] text-slate-500">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="group flex gap-2.5">
              <Avatar
                name={comment.authorName}
                initials={comment.authorInitials}
                avatarUrl={comment.authorAvatarUrl}
                size="sm"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-medium text-slate-200">{comment.authorName}</span>
                  <span className="text-[11px] text-slate-600">{formatRelative(comment.createdAt)}</span>
                  {comment.authorId === currentUserId && (
                    <button
                      onClick={() => void onDelete(comment.id)}
                      className="ml-auto rounded p-0.5 text-transparent transition-colors group-hover:text-slate-600 hover:!text-rose-400"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-300">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleSubmit();
          }}
          rows={3}
          placeholder="Add a comment… (Ctrl+Enter to submit)"
          className="w-full resize-none rounded-md border border-neutral-border bg-transparent px-3 py-2 text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={() => void handleSubmit()}
          disabled={!draft.trim() || isPending}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          <Send className="size-3.5" />
          {isPending ? 'Posting…' : 'Post Comment'}
        </button>
      </div>
    </Section>
  );
}

// ─── Watchers section ─────────────────────────────────────────────────────────

function WatchersSection({
  taskId,
  watchers,
  members,
  isLoading,
  isPending,
  currentUserId,
  onAdd,
  onRemove,
}: {
  taskId: string;
  watchers: TaskWatcherResponse[];
  members: BoardUser[];
  isLoading: boolean;
  isPending: boolean;
  currentUserId?: string;
  onAdd: (userId: string) => Promise<unknown>;
  onRemove: (userId: string) => Promise<unknown>;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const watcherIds = new Set(watchers.map((w) => w.userId));
  const availableMembers = members.filter((m) => !watcherIds.has(m.id));

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  return (
    <Section icon={Eye} label="Watchers" count={watchers.length}>
      {isLoading ? (
        <p className="text-[12px] text-slate-500">Loading…</p>
      ) : watchers.length === 0 ? (
        <p className="text-[12px] text-slate-500">No watchers.</p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-2">
          {watchers.map((watcher) => (
            <div
              key={watcher.userId}
              className="group relative flex items-center gap-1.5 rounded-full border border-neutral-border bg-white/[0.03] py-1 pl-1.5 pr-2.5 transition-colors hover:border-neutral-border"
            >
              <Avatar
                name={watcher.userName}
                initials={watcher.userInitials}
                avatarUrl={watcher.userAvatarUrl}
                size="sm"
              />
              <span className="text-[12px] text-slate-300">{watcher.userName}</span>
              <button
                onClick={() => void onRemove(watcher.userId)}
                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          disabled={availableMembers.length === 0 || isPending}
          className="flex items-center gap-1.5 rounded-md border border-neutral-border bg-white/[0.03] px-3 py-1.5 text-[12px] text-slate-400 transition-colors hover:border-primary/40 hover:text-slate-200 disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          Add watcher
        </button>

        <AnimatePresence>
          {dropdownOpen && availableMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-neutral-border bg-neutral-surface py-1 shadow-xl"
            >
              {availableMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={async () => {
                    setDropdownOpen(false);
                    await onAdd(member.id);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <Avatar name={member.name} initials={member.initials} avatarUrl={member.avatar} size="sm" />
                  <span className="text-[12px] text-slate-300">{member.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}

// ─── Attachments section ──────────────────────────────────────────────────────

function AttachmentsSection({
  taskId,
  attachments,
  isLoading,
  isPending,
  onUpload,
  onDelete,
}: {
  taskId: string;
  attachments: FileAttachmentResponse[];
  isLoading: boolean;
  isPending: boolean;
  onUpload: (file: File) => Promise<unknown>;
  onDelete: (attachmentId: string) => Promise<unknown>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Section icon={Paperclip} label="Attachments" count={attachments.length}>
      {isLoading ? (
        <p className="text-[12px] text-slate-500">Loading…</p>
      ) : attachments.length === 0 ? (
        <p className="text-[12px] text-slate-500">No attachments.</p>
      ) : (
        <ul className="mb-3 space-y-1.5">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="group flex items-center gap-2.5 rounded-md border border-neutral-border bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]"
            >
              <Paperclip className="size-3.5 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-slate-200">{att.fileName}</p>
                <p className="text-[11px] text-slate-500">
                  {formatBytes(att.fileSizeBytes)} · {att.uploadedByName} · {formatRelative(att.createdAt)}
                </p>
              </div>
              {att.downloadUrl && (
                <a
                  href={att.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded p-1 text-slate-500 transition-colors hover:text-primary"
                >
                  <svg
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
              <button
                onClick={() => void onDelete(att.id)}
                className="shrink-0 rounded p-1 text-transparent transition-colors group-hover:text-slate-500 hover:!text-rose-400"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md border border-neutral-border bg-white/[0.03] px-3 py-1.5 text-[12px] text-slate-400 transition-colors hover:border-primary/40 hover:text-slate-200 disabled:opacity-40"
      >
        <Plus className="size-3.5" />
        {isPending ? 'Uploading…' : 'Upload file'}
      </button>
    </Section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TaskDetailProps {
  task: BoardTask;
  users: BoardUser[];
  projects: ProjectResponse[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (task: BoardTask) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  // subresource data
  comments: TaskCommentResponse[];
  checklist: TaskChecklistItemResponse[];
  watchers: TaskWatcherResponse[];
  attachments: FileAttachmentResponse[];
  isLoadingComments: boolean;
  isLoadingChecklist: boolean;
  isLoadingWatchers: boolean;
  isLoadingAttachments: boolean;
  // comment handlers
  onCreateComment: (content: string) => Promise<unknown>;
  onDeleteComment: (commentId: string) => Promise<unknown>;
  isCommentPending: boolean;
  // checklist handlers
  onCreateChecklistItem: (text: string) => Promise<unknown>;
  onToggleChecklistItem: (itemId: string, isCompleted: boolean) => Promise<unknown>;
  onDeleteChecklistItem: (itemId: string) => Promise<unknown>;
  isChecklistPending: boolean;
  // watcher handlers
  onAddWatcher: (userId: string) => Promise<unknown>;
  onRemoveWatcher: (userId: string) => Promise<unknown>;
  isWatcherPending: boolean;
  // attachment handlers
  onUploadAttachment: (file: File) => Promise<unknown>;
  onDeleteAttachment: (attachmentId: string) => Promise<unknown>;
  isAttachmentPending: boolean;
}

const STATUSES: BoardTaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITIES: BoardTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export function TaskDetail({
  task,
  users,
  projects,
  isSaving,
  onClose,
  onSave,
  onDelete,
  comments,
  checklist,
  watchers,
  attachments,
  isLoadingComments,
  isLoadingChecklist,
  isLoadingWatchers,
  isLoadingAttachments,
  onCreateComment,
  onDeleteComment,
  isCommentPending,
  onCreateChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  isChecklistPending,
  onAddWatcher,
  onRemoveWatcher,
  isWatcherPending,
  onUploadAttachment,
  onDeleteAttachment,
  isAttachmentPending,
}: TaskDetailProps) {
  const [draft, setDraft] = useState<BoardTask>(task);

  useEffect(() => {
    setDraft(task);
  }, [task]);

  const projectName = useMemo(
    () => projects.find((project) => project.id === draft.projectId)?.name ?? 'Workspace',
    [draft.projectId, projects],
  );

  const handleSave = async () => {
    await onSave(draft);
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 200 }}
      className="flex h-full w-[440px] shrink-0 flex-col border-l border-neutral-border bg-neutral-surface/95 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-border px-4">
        <div className="flex items-center gap-2">
          <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
            {draft.identifier}
          </span>
          <span className="text-xs text-slate-500">{projectName}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">

        {/* Title & description */}
        <div className="space-y-3">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft((cur) => ({ ...cur, title: e.target.value }))}
            className="w-full rounded-md border border-neutral-border bg-transparent px-3 py-2 text-xl font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <textarea
            value={draft.description}
            rows={3}
            onChange={(e) => setDraft((cur) => ({ ...cur, description: e.target.value }))}
            className="w-full rounded-md border border-neutral-border bg-transparent px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Add task details…"
          />
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Status</span>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((cur) => ({ ...cur, status: e.target.value as BoardTaskStatus }))
              }
              className="w-full rounded-md border border-neutral-border bg-background-dark px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-background-dark">{s}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Priority</span>
            <select
              value={draft.priority}
              onChange={(e) =>
                setDraft((cur) => ({ ...cur, priority: e.target.value as BoardTaskPriority }))
              }
              className="w-full rounded-md border border-neutral-border bg-background-dark px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-background-dark">{p}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
              <UserIcon className="size-3.5" />
              Assignee
            </span>
            <select
              value={draft.assigneeId ?? ''}
              onChange={(e) =>
                setDraft((cur) => ({ ...cur, assigneeId: e.target.value || undefined }))
              }
              className="w-full rounded-md border border-neutral-border bg-background-dark px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="" className="bg-background-dark">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-background-dark">
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
              <Folder className="size-3.5" />
              Project
            </span>
            <select
              value={draft.projectId}
              onChange={(e) => setDraft((cur) => ({ ...cur, projectId: e.target.value }))}
              className="w-full rounded-md border border-neutral-border bg-background-dark px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id} className="bg-background-dark">
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="col-span-2 space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">Due Date</span>
            <input
              type="date"
              value={draft.dueDate ?? ''}
              onChange={(e) =>
                setDraft((cur) => ({ ...cur, dueDate: e.target.value || undefined }))
              }
              className="w-full rounded-md border border-neutral-border bg-background-dark px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
        </div>

        {/* Subfeature sections */}
        <ChecklistSection
          taskId={task.id}
          items={checklist}
          isLoading={isLoadingChecklist}
          isPending={isChecklistPending}
          onCreate={onCreateChecklistItem}
          onToggle={onToggleChecklistItem}
          onDelete={onDeleteChecklistItem}
        />

        <CommentsSection
          taskId={task.id}
          comments={comments}
          isLoading={isLoadingComments}
          isPending={isCommentPending}
          onCreate={onCreateComment}
          onDelete={onDeleteComment}
        />

        <WatchersSection
          taskId={task.id}
          watchers={watchers}
          members={users}
          isLoading={isLoadingWatchers}
          isPending={isWatcherPending}
          onAdd={onAddWatcher}
          onRemove={onRemoveWatcher}
        />

        <AttachmentsSection
          taskId={task.id}
          attachments={attachments}
          isLoading={isLoadingAttachments}
          isPending={isAttachmentPending}
          onUpload={onUploadAttachment}
          onDelete={onDeleteAttachment}
        />
      </div>

      {/* Save / delete bar */}
      <div className="flex items-center gap-3 border-t border-neutral-border bg-neutral-surface/50 p-4">
        <button
          onClick={() => void onDelete(draft.id)}
          className="inline-flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
        >
          <Trash2 className="size-4" />
          Delete
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className={cn(
            'ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-50 transition-colors hover:bg-primary/90',
            isSaving && 'cursor-not-allowed opacity-60',
          )}
        >
          {isSaving ? <Save className="size-4 animate-pulse" /> : <Check className="size-4" />}
          {isSaving ? 'Saving…' : 'Save Task'}
        </button>
      </div>
    </motion.div>
  );
}
