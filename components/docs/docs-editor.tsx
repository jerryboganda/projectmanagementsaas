"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  type CreateDocumentRequest,
  type DocumentResponse,
  type UpdateDocumentRequest,
} from "@/lib/api/contracts";
import { FOLDER_OPTIONS, type DocFolder, type DocRevision } from "@/hooks/use-documents-data";
import {
  Bold,
  Check,
  ChevronDown,
  Clock,
  Code,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Hash,
  History,
  Italic,
  Link as LinkIcon,
  List,
  MessageSquare,
  MoreHorizontal,
  RotateCcw,
  Save,
  Send,
  Share2,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { formatDocumentTimestamp, getDocumentStatusLabel, toEditorContent } from "./data";
import { cn } from "@/lib/utils";

interface DocsEditorProps {
  doc: DocumentResponse;
  onSave: (documentId: string, input: UpdateDocumentRequest) => Promise<DocumentResponse>;
  onDelete: (documentId: string) => Promise<void>;
  onCreateNew: (input: CreateDocumentRequest) => Promise<DocumentResponse>;
  isSaving: boolean;
  isDeleting: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  currentFolder: DocFolder;
  onMoveToFolder: (folder: DocFolder) => void;
  revisions: DocRevision[];
  onAddRevision: (revision: Omit<DocRevision, "id">) => void;
}

// ─── Formatting toolbar ───────────────────────────────────────────────────────

function FormatButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
    >
      {icon}
    </button>
  );
}

// ─── Share modal ──────────────────────────────────────────────────────────────

interface Collaborator {
  email: string;
  role: "Viewer" | "Editor";
}

function ShareModal({
  docTitle,
  onClose,
}: {
  docTitle: string;
  onClose: () => void;
}) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { email: "alice@example.com", role: "Editor" },
    { email: "bob@example.com", role: "Viewer" },
  ]);
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<"Viewer" | "Editor">("Viewer");
  const [copied, setCopied] = useState(false);

  const fakeLink = `https://app.example.com/docs/${docTitle.toLowerCase().replace(/\s+/g, "-")}`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(fakeLink).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCollaborator = () => {
    const trimmed = emailInput.trim();
    if (!trimmed || collaborators.some((c) => c.email === trimmed)) return;
    setCollaborators((prev) => [...prev, { email: trimmed, role: roleInput }]);
    setEmailInput("");
  };

  const handleRemove = (email: string) => {
    setCollaborators((prev) => prev.filter((c) => c.email !== email));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md rounded-2xl border border-neutral-border bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <Share2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">Share document</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 transition-colors hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Copy link */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Document link
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-border bg-zinc-800 px-3 py-2">
            <span className="flex-1 truncate text-sm text-slate-400">{fakeLink}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-md bg-white/8 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/15"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Add collaborator */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Invite people
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCollaborator()}
              className="flex-1 rounded-lg border border-neutral-border bg-zinc-800 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as "Viewer" | "Editor")}
              className="rounded-lg border border-neutral-border bg-zinc-800 px-2 py-1.5 text-sm text-slate-300 focus:outline-none"
            >
              <option value="Viewer">Viewer</option>
              <option value="Editor">Editor</option>
            </select>
            <button
              type="button"
              onClick={handleAddCollaborator}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Invite
            </button>
          </div>
        </div>

        {/* Collaborator list */}
        {collaborators.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              People with access
            </div>
            <div className="space-y-1.5">
              {collaborators.map((c) => (
                <div
                  key={c.email}
                  className="flex items-center gap-3 rounded-lg bg-white/4 px-3 py-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                    {c.email[0]?.toUpperCase()}
                  </div>
                  <span className="flex-1 truncate text-sm text-slate-300">{c.email}</span>
                  <span className="text-xs text-slate-500">{c.role}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(c.email)}
                    className="rounded p-0.5 text-slate-600 transition-colors hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── History panel ────────────────────────────────────────────────────────────

function HistoryPanel({
  revisions,
  onRestore,
  onClose,
}: {
  revisions: DocRevision[];
  onRestore: (revision: DocRevision) => void;
  onClose: () => void;
}) {
  const [previewRevision, setPreviewRevision] = useState<DocRevision | null>(null);

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-y-0 right-0 z-30 flex w-80 flex-col border-l border-neutral-border bg-zinc-900 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-neutral-border/50 px-4 py-3">
        <div className="flex items-center gap-2 text-slate-200">
          <History className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Revision history</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-500 transition-colors hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {revisions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div>
            <Clock className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">No revisions saved yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              Revisions are recorded each time you save.
            </p>
          </div>
        </div>
      ) : (
        <div className="custom-scrollbar flex-1 overflow-y-auto py-3">
          {revisions.map((rev) => (
            <div key={rev.id} className="px-3 mb-2">
              <div
                className={cn(
                  "rounded-lg border border-neutral-border/60 p-3 transition-colors cursor-pointer",
                  previewRevision?.id === rev.id
                    ? "border-primary/40 bg-primary/8"
                    : "bg-white/3 hover:bg-white/6",
                )}
                onClick={() =>
                  setPreviewRevision(previewRevision?.id === rev.id ? null : rev)
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-200">{rev.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{rev.authorName}</div>
                    <div className="mt-0.5 text-[11px] text-slate-600">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      }).format(new Date(rev.timestamp))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(rev);
                    }}
                    title="Restore this revision"
                    className="flex shrink-0 items-center gap-1 rounded-md bg-white/8 px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-primary/20 hover:text-primary"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </button>
                </div>
                <AnimatePresence>
                  {previewRevision?.id === rev.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-md border border-neutral-border/40 bg-zinc-950/60 px-2 py-2 text-xs text-slate-400 line-clamp-6 whitespace-pre-wrap">
                        {rev.content || "(empty)"}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Comments types and helpers ──────────────────────────────────────────────

interface DocComment {
  id: string;
  authorName: string;
  authorInitials: string;
  content: string;
  timestamp: string;
}

function loadDocComments(docId: string): DocComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`docs:comments:${docId}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as DocComment[];
  } catch {
    // ignore
  }
  return [];
}

function saveDocComments(docId: string, comments: DocComment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`docs:comments:${docId}`, JSON.stringify(comments));
  } catch {
    // ignore
  }
}

// ─── Comments panel ──────────────────────────────────────────────────────────

function CommentsPanel({
  docId,
  authorName,
  onClose,
}: {
  docId: string;
  authorName: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<DocComment[]>(() => loadDocComments(docId));
  const [newComment, setNewComment] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reload comments when docId changes
  useEffect(() => {
    setComments(loadDocComments(docId));
  }, [docId]);

  // Persist comments whenever they change
  useEffect(() => {
    saveDocComments(docId, comments);
  }, [docId, comments]);

  const handleSubmit = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;

    const initials = authorName
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const comment: DocComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      authorName,
      authorInitials: initials,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setComments((prev) => [...prev, comment]);
    setNewComment("");

    // Scroll to bottom after adding
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-y-0 right-0 z-30 flex w-80 flex-col border-l border-neutral-border bg-zinc-900 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-neutral-border/50 px-4 py-3">
        <div className="flex items-center gap-2 text-slate-200">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Comments</span>
          {comments.length > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {comments.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-500 transition-colors hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {comments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <div>
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">No comments yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              Start a conversation about this document.
            </p>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto py-3">
          {comments.map((comment) => (
            <div key={comment.id} className="group px-3 mb-2">
              <div className="rounded-lg border border-neutral-border/60 bg-white/3 p-3 transition-colors hover:bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                      {comment.authorInitials}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-200">{comment.authorName}</span>
                      <div className="text-[10px] text-slate-600">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(comment.timestamp))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="rounded p-0.5 text-slate-600 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <div className="border-t border-neutral-border/50 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            rows={2}
            className="flex-1 rounded-lg border border-neutral-border/70 bg-neutral-surface px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/40 resize-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            title="Send comment"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-600">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </motion.div>
  );
}

// ─── Move-to-folder dropdown ──────────────────────────────────────────────────

function FolderDropdown({
  currentFolder,
  onSelect,
  onClose,
}: {
  currentFolder: DocFolder;
  onSelect: (folder: DocFolder) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.1 }}
      className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-neutral-border bg-zinc-900 py-1 shadow-xl"
    >
      {FOLDER_OPTIONS.map((folder) => (
        <button
          key={folder}
          type="button"
          onClick={() => {
            onSelect(folder);
            onClose();
          }}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors",
            folder === currentFolder
              ? "text-primary"
              : "text-slate-300 hover:bg-white/6 hover:text-slate-100",
          )}
        >
          {folder === currentFolder && <Check className="h-3.5 w-3.5 text-primary" />}
          <span className={folder === currentFolder ? "ml-0" : "ml-5"}>{folder}</span>
        </button>
      ))}
    </motion.div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function DocsEditor({
  doc,
  onSave,
  onDelete,
  onCreateNew,
  isSaving,
  isDeleting,
  isFavorite,
  onToggleFavorite,
  currentFolder,
  onMoveToFolder,
  revisions,
  onAddRevision,
}: DocsEditorProps) {
  const [draftTitle, setDraftTitle] = useState(doc.title);
  const [draftContent, setDraftContent] = useState(toEditorContent(doc.content));
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const folderDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isDirty = useMemo(
    () => draftTitle.trim() !== doc.title.trim() || draftContent !== toEditorContent(doc.content),
    [draftContent, draftTitle, doc.content, doc.title],
  );

  const wordCount = useMemo(() => {
    const text = draftContent.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [draftContent]);

  const charCount = useMemo(() => draftContent.length, [draftContent]);

  const handleSave = useCallback(async () => {
    await onSave(doc.id, {
      title: draftTitle,
      content: draftContent.trim() ? draftContent : null,
      contentFormat: doc.contentFormat || "plain-text",
      projectId: doc.projectId ?? null,
      parentDocumentId: doc.parentDocumentId ?? null,
      isPublished: doc.isPublished,
      sortOrder: doc.sortOrder,
    });
    setLastSavedAt(new Date());
    onAddRevision({
      timestamp: new Date().toISOString(),
      title: draftTitle,
      content: draftContent,
      authorName: doc.creator.fullName,
    });
  }, [doc, draftTitle, draftContent, onSave, onAddRevision]);

  // Auto-save debounce: 3 seconds after last change
  useEffect(() => {
    if (!isDirty) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      void handleSave();
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [draftTitle, draftContent, isDirty, handleSave]);

  const handleCreateNew = async () => {
    await onCreateNew({
      title: "Untitled document",
      content: null,
      contentFormat: "plain-text",
      projectId: null,
      parentDocumentId: null,
      isPublished: false,
      sortOrder: 0,
    });
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) {
      await onDelete(doc.id);
    }
  };

  const handleRestoreRevision = (rev: DocRevision) => {
    setDraftTitle(rev.title);
    setDraftContent(rev.content);
    setShowHistory(false);
  };

  const handleTogglePublish = async () => {
    const newPublished = !doc.isPublished;

    // If unpublishing, require confirmation
    if (doc.isPublished) {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm(
        "Unpublish this document? It will revert to draft status and may no longer be visible to viewers."
      );
      if (!confirmed) return;
    }

    setIsTogglingPublish(true);
    try {
      await onSave(doc.id, {
        title: draftTitle,
        content: draftContent.trim() ? draftContent : null,
        contentFormat: doc.contentFormat || "plain-text",
        projectId: doc.projectId ?? null,
        parentDocumentId: doc.parentDocumentId ?? null,
        isPublished: newPublished,
        sortOrder: doc.sortOrder,
      });
      setLastSavedAt(new Date());
    } finally {
      setIsTogglingPublish(false);
    }
  };

  // Insert formatting prefix into textarea
  const insertFormat = (prefix: string, suffix = "") => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#doc-content-textarea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = draftContent.slice(start, end);
    const before = draftContent.slice(0, start);
    const after = draftContent.slice(end);
    const newContent = `${before}${prefix}${selected}${suffix}${after}`;
    setDraftContent(newContent);
    setTimeout(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
      textarea.focus();
    }, 0);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(e.target as Node)) {
        setShowFolderDropdown(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const creatorInitials = doc.creator.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative flex h-full flex-1 flex-col overflow-hidden bg-background-dark"
    >
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-border/50 bg-background-dark/80 px-6 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-400">
          <span className="cursor-pointer transition-colors hover:text-slate-200">Documents</span>
          <span>/</span>
          <span className="max-w-[200px] truncate font-medium text-slate-200">{doc.title}</span>
          {/* Status badge with publish toggle */}
          <button
            type="button"
            onClick={() => void handleTogglePublish()}
            disabled={isTogglingPublish || isSaving}
            title={doc.isPublished ? "Click to unpublish (revert to draft)" : "Click to publish"}
            className={cn(
              "ml-1 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide transition-colors",
              doc.isPublished
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "border-neutral-border/70 bg-white/3 text-slate-500 hover:bg-white/8 hover:text-slate-300",
              (isTogglingPublish || isSaving) && "opacity-60 cursor-not-allowed",
            )}
          >
            {isTogglingPublish ? (
              <span className="text-[11px]">...</span>
            ) : doc.isPublished ? (
              <Globe className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
            {getDocumentStatusLabel(doc)}
          </button>
          {/* Folder badge */}
          <div className="relative" ref={folderDropdownRef}>
            <button
              type="button"
              onClick={() => setShowFolderDropdown((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300 transition-colors hover:bg-indigo-500/20"
            >
              {currentFolder}
              <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {showFolderDropdown && (
                <FolderDropdown
                  currentFolder={currentFolder}
                  onSelect={onMoveToFolder}
                  onClose={() => setShowFolderDropdown(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Creator avatar */}
          <div className="mr-2 flex items-center -space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background-dark bg-slate-700 text-[10px] font-bold text-white">
              {creatorInitials}
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background-dark bg-neutral-surface text-[10px] font-bold text-slate-400">
              +
            </div>
          </div>

          {/* Comments */}
          <button
            type="button"
            title="Comments"
            onClick={() => {
              setShowComments((v) => !v);
              if (!showComments) setShowHistory(false);
            }}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              showComments
                ? "bg-primary/15 text-primary"
                : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
            )}
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          {/* Share */}
          <button
            type="button"
            title="Share document"
            onClick={() => setShowShareModal(true)}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
          >
            <Share2 className="h-4 w-4" />
          </button>

          {/* Collaborators */}
          <button
            type="button"
            title="Collaborators"
            onClick={() => setShowShareModal(true)}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
          >
            <Users className="h-4 w-4" />
          </button>

          {/* History */}
          <button
            type="button"
            title="Revision history"
            onClick={() => {
              setShowHistory((v) => !v);
              if (!showHistory) setShowComments(false);
            }}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              showHistory
                ? "bg-primary/15 text-primary"
                : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
            )}
          >
            <Clock className="h-4 w-4" />
          </button>

          {/* Favorite */}
          <button
            type="button"
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            onClick={onToggleFavorite}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              isFavorite
                ? "text-amber-400 hover:text-amber-300"
                : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
            )}
          >
            <Star
              className={cn("h-4 w-4", isFavorite && "fill-amber-400")}
            />
          </button>

          {/* More menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              title="More options"
              onClick={() => setShowMoreMenu((v) => !v)}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-neutral-border bg-zinc-900 py-1 shadow-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      void handleDelete();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      void handleCreateNew();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/6"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    New document
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New doc button */}
          <button
            type="button"
            onClick={handleCreateNew}
            className="ml-2 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <FileText className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 border-b border-neutral-border/40 bg-zinc-900/60 px-6 py-1">
        <FormatButton
          icon={<Bold className="h-3.5 w-3.5" />}
          label="Bold"
          onClick={() => insertFormat("**", "**")}
        />
        <FormatButton
          icon={<Italic className="h-3.5 w-3.5" />}
          label="Italic"
          onClick={() => insertFormat("_", "_")}
        />
        <FormatButton
          icon={<Hash className="h-3.5 w-3.5" />}
          label="Heading"
          onClick={() => insertFormat("## ")}
        />
        <FormatButton
          icon={<List className="h-3.5 w-3.5" />}
          label="List"
          onClick={() => insertFormat("- ")}
        />
        <FormatButton
          icon={<Code className="h-3.5 w-3.5" />}
          label="Code"
          onClick={() => insertFormat("`", "`")}
        />
        <FormatButton
          icon={<LinkIcon className="h-3.5 w-3.5" />}
          label="Link"
          onClick={() => insertFormat("[", "](url)")}
        />
        <div className="mx-1 h-4 w-px bg-neutral-border/60" />
        <span className="text-xs text-slate-600">Markdown</span>
      </div>

      {/* Content area */}
      <div className="custom-scrollbar relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-12 pb-8">
          <div className="mb-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-border/70 bg-neutral-surface text-slate-300">
              <FileText className="h-8 w-8" />
            </div>

            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Title
            </label>
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="w-full rounded-2xl border border-neutral-border/70 bg-neutral-surface px-4 py-4 text-3xl font-bold tracking-tight text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/40"
              placeholder="Untitled document"
            />

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Owner</span>
                <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {creatorInitials}
                  </div>
                  <span className="font-medium text-slate-200">{doc.creator.fullName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>Updated {formatDocumentTimestamp(doc.updatedAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-slate-500" />
                <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-indigo-300">
                  {doc.contentFormat}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Content
            </label>
            <textarea
              id="doc-content-textarea"
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              rows={18}
              placeholder="Start typing to add content... (Markdown supported)"
              className="min-h-[420px] w-full rounded-2xl border border-neutral-border/70 bg-neutral-surface px-4 py-4 text-base leading-relaxed text-slate-300 outline-none transition-colors placeholder:text-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Footer bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {/* Status + word count */}
            <div className="flex items-center gap-3 text-sm text-slate-500">
              {isDirty ? (
                <span className="text-amber-400/80">Unsaved changes</span>
              ) : lastSavedAt ? (
                <span className="text-emerald-400/70">
                  Saved{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(lastSavedAt)}
                </span>
              ) : (
                <span>All changes saved</span>
              )}
              <span className="text-slate-600">·</span>
              <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
              <span className="text-slate-600">·</span>
              <span>{charCount} chars</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!isDirty || isSaving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History panel (absolute overlay on right side) */}
      <AnimatePresence>
        {showHistory && (
          <HistoryPanel
            revisions={revisions}
            onRestore={handleRestoreRevision}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Comments panel (absolute overlay on right side) */}
      <AnimatePresence>
        {showComments && (
          <CommentsPanel
            docId={doc.id}
            authorName={doc.creator.fullName}
            onClose={() => setShowComments(false)}
          />
        )}
      </AnimatePresence>

      {/* Share modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            docTitle={doc.title}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
