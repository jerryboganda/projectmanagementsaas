"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Hash,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useToast } from "@/components/ui/toast";
import { useAutomationsData } from "@/hooks/use-automations-data";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import {
  formatAutomationDateTime,
  formatAutomationDuration,
  formatAutomationTimestamp,
  previewAutomationDocumentEntries,
  stringifyAutomationDocument,
  summarizeAutomationDocument,
  type AutomationDocument,
  type AutomationProjectOption,
  type AutomationSurfaceItem,
  type AutomationSurfaceLog,
  type AutomationUpsertInput,
} from "@/lib/automations/types";

type FilterTab = "all" | "enabled" | "disabled";

interface AutomationDraft {
  name: string;
  description: string;
  enabled: boolean;
  projectId: string;
  triggerJson: string;
  actionJson: string;
}

interface AutomationModalProps {
  automation?: AutomationSurfaceItem | null;
  projects: AutomationProjectOption[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: AutomationUpsertInput) => Promise<void>;
}

function formatStatusLabel(status: AutomationSurfaceLog["status"]) {
  if (typeof status !== "string") {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getStatusTone(status: AutomationSurfaceLog["status"]) {
  switch (status) {
    case "Success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "Failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    case "Skipped":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    default:
      return "border-slate-500/20 bg-slate-500/10 text-slate-200";
  }
}

function getStatusIcon(status: AutomationSurfaceLog["status"]) {
  switch (status) {
    case "Success":
      return CheckCircle2;
    case "Failed":
      return AlertTriangle;
    case "Skipped":
      return ShieldAlert;
    default:
      return Activity;
  }
}

function filterAutomationList(list: AutomationSurfaceItem[], filterTab: FilterTab, search: string) {
  let filtered = list;

  if (filterTab === "enabled") {
    filtered = filtered.filter((automation) => automation.enabled);
  }

  if (filterTab === "disabled") {
    filtered = filtered.filter((automation) => !automation.enabled);
  }

  const query = search.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((automation) => {
      const haystack = [
        automation.name,
        automation.description,
        summarizeAutomationDocument(automation.trigger),
        summarizeAutomationDocument(automation.action),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }

  return filtered;
}

function AutomationModal({ automation, projects, isSaving, onClose, onSave }: AutomationModalProps) {
  const isEditing = !!automation;
  const [draft, setDraft] = useState<AutomationDraft>({
    name: automation?.name ?? "",
    description: automation?.description ?? "",
    enabled: automation?.enabled ?? true,
    projectId: automation?.projectId ?? "",
    triggerJson: stringifyAutomationDocument(automation?.trigger ?? {}),
    actionJson: stringifyAutomationDocument(automation?.action ?? {}),
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateDraft = <K extends keyof AutomationDraft>(key: K, value: AutomationDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      setErrorMessage("Name is required.");
      return;
    }

    let trigger: AutomationDocument;
    let action: AutomationDocument;

    try {
      trigger = JSON.parse(draft.triggerJson);
    } catch {
      setErrorMessage("Trigger JSON must be valid JSON.");
      return;
    }

    try {
      action = JSON.parse(draft.actionJson);
    } catch {
      setErrorMessage("Action JSON must be valid JSON.");
      return;
    }

    setErrorMessage(null);

    await onSave({
      name: trimmedName,
      description: draft.description.trim() || null,
      isActive: draft.enabled,
      trigger,
      action,
      projectId: draft.projectId || null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-neutral-border bg-neutral-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-sm border border-primary/20 bg-primary/10 p-1.5">
              <Zap className="size-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-slate-100">
                {isEditing ? "Edit Automation" : "New Automation"}
              </h3>
              <p className="text-[11px] text-slate-500">
                The backend stores one trigger JSON document and one action JSON document.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 text-slate-500 transition-colors hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Name
              </label>
              <input
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                disabled={isSaving}
                placeholder="e.g. Auto-close completed work"
                className="h-9 w-full rounded-sm border border-neutral-border bg-background-dark px-3 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-primary focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Description
              </label>
              <textarea
                value={draft.description}
                onChange={(event) => updateDraft("description", event.target.value)}
                disabled={isSaving}
                rows={2}
                placeholder="What should this automation do?"
                className="w-full resize-none rounded-sm border border-neutral-border bg-background-dark px-3 py-2 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-primary focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Zap className="size-3.5" />
              <span className="text-[11px] font-mono uppercase tracking-wider">When</span>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Trigger JSON
              </label>
              <textarea
                value={draft.triggerJson}
                onChange={(event) => updateDraft("triggerJson", event.target.value)}
                disabled={isSaving}
                rows={7}
                spellCheck={false}
                className="w-full rounded-sm border border-neutral-border bg-background-dark px-3 py-2 font-mono text-[12px] text-slate-200 focus:border-primary focus:outline-none disabled:opacity-60"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Stored verbatim by the backend. Any valid JSON value is accepted.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <ArrowRight className="size-3.5" />
              <span className="text-[11px] font-mono uppercase tracking-wider">Then</span>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Action JSON
              </label>
              <textarea
                value={draft.actionJson}
                onChange={(event) => updateDraft("actionJson", event.target.value)}
                disabled={isSaving}
                rows={7}
                spellCheck={false}
                className="w-full rounded-sm border border-neutral-border bg-background-dark px-3 py-2 font-mono text-[12px] text-slate-200 focus:border-primary focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Project Scope
              </label>
              <select
                value={draft.projectId}
                onChange={(event) => updateDraft("projectId", event.target.value)}
                disabled={isSaving}
                className="h-9 w-full rounded-sm border border-neutral-border bg-background-dark px-3 text-[13px] text-slate-200 focus:border-primary focus:outline-none disabled:opacity-60"
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between rounded-sm border border-neutral-border bg-background-dark px-3 py-2">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Enabled
                </div>
                <p className="text-[11px] text-slate-500">Toggle whether this rule runs.</p>
              </div>
              <button
                onClick={() => updateDraft("enabled", !draft.enabled)}
                disabled={isSaving}
                className="transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={draft.enabled ? "Disable automation" : "Enable automation"}
              >
                {draft.enabled ? (
                  <ToggleRight className="size-6 text-primary" />
                ) : (
                  <ToggleLeft className="size-6 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-sm border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-border px-5 py-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="h-8 rounded-sm border border-neutral-border px-4 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={isSaving || !draft.name.trim()}
            className="h-8 rounded-sm border border-primary bg-primary px-4 text-[12px] font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Automation"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AutomationCard({
  automation,
  projectName,
  selected,
  onView,
  onToggle,
  onEdit,
  onDelete,
}: {
  automation: AutomationSurfaceItem;
  projectName?: string;
  selected: boolean;
  onView: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const triggerSummary = summarizeAutomationDocument(automation.trigger);
  const actionSummary = summarizeAutomationDocument(automation.action);
  const triggerPreview = previewAutomationDocumentEntries(automation.trigger);
  const actionPreview = previewAutomationDocumentEntries(automation.action);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={`group rounded-sm border bg-neutral-surface transition-colors ${
        selected
          ? "border-primary/40 ring-1 ring-primary/20"
          : automation.enabled
            ? "border-neutral-border hover:border-slate-600"
            : "border-neutral-border/60 opacity-70 hover:opacity-90"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            className="mt-0.5 flex-shrink-0 transition-colors"
            aria-label={automation.enabled ? "Disable automation" : "Enable automation"}
          >
            {automation.enabled ? (
              <ToggleRight className="size-5 text-primary" />
            ) : (
              <ToggleLeft className="size-5 text-slate-600" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h4 className="truncate text-[13px] font-semibold text-slate-100">
                {automation.name}
              </h4>
              {projectName ? (
                <span className="flex-shrink-0 rounded-sm border border-neutral-border/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  {projectName}
                </span>
              ) : null}
            </div>

            {automation.description ? (
              <p className="mb-3 line-clamp-1 text-[12px] text-slate-500">
                {automation.description}
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-400/80">
                  <Zap className="size-3" />
                  When
                </span>
                <span className="flex items-center gap-1.5 rounded-sm border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
                  <Activity className="size-3" />
                  {triggerSummary}
                </span>
                {triggerPreview.map((entry) => (
                  <span key={entry} className="rounded-sm bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {entry}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400/80">
                  <ArrowRight className="size-3" />
                  Then
                </span>
                <span className="flex items-center gap-1.5 rounded-sm border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                  <ArrowRight className="size-3" />
                  {actionSummary}
                </span>
                {actionPreview.map((entry) => (
                  <span key={entry} className="rounded-sm bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {entry}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={onView}
              className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
              aria-label="View logs"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              onClick={onEdit}
              className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
              aria-label="Edit automation"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-rose-300"
              aria-label="Delete automation"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-neutral-border/40 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Hash className="size-3" />
            <span>
              Triggered <span className="font-medium text-slate-300">{automation.executionCount}</span>{" "}
              {automation.executionCount === 1 ? "time" : "times"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Activity className="size-3" />
            <span>Last: {formatAutomationTimestamp(automation.lastTriggered)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-sm border border-neutral-border bg-neutral-surface p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 size-5 rounded-full bg-white/5" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-2/5 rounded-sm bg-white/5" />
              <div className="h-3 w-3/5 rounded-sm bg-white/5" />
              <div className="h-8 rounded-sm bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-sm border border-dashed border-neutral-border/70 bg-neutral-surface px-6 py-16 text-center"
    >
      <div className="mb-4 rounded-sm border border-primary/20 bg-primary/10 p-4">
        <Zap className="size-8 text-primary" />
      </div>
      <h3 className="mb-1 text-[15px] font-semibold text-slate-200">No automations yet</h3>
      <p className="mb-5 max-w-sm text-[13px] text-slate-500">
        Create a single trigger and action document to automate repetitive work in your workspace.
      </p>
      <button
        onClick={onCreate}
        className="flex h-8 items-center gap-1.5 rounded-sm border border-primary bg-primary px-4 text-[12px] font-medium text-white transition-colors hover:bg-primary/90"
      >
        <Plus className="size-3.5" />
        New Automation
      </button>
    </motion.div>
  );
}

function DetailPlaceholder({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-sm border border-neutral-border bg-neutral-surface p-4">
      <div className="flex items-center gap-2.5">
        <div className="rounded-sm border border-primary/20 bg-primary/10 p-2">
          <Activity className="size-4 text-primary" />
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-slate-100">Automation details</h3>
          <p className="text-[12px] text-slate-500">Select a rule to review recent logs.</p>
        </div>
      </div>
      <div className="mt-4 rounded-sm border border-dashed border-neutral-border/70 bg-white/[0.02] p-4 text-[12px] text-slate-500">
        Click the eye icon on any automation to inspect its recent runs.
      </div>
      <button
        onClick={onCreate}
        className="mt-4 flex h-8 items-center gap-1.5 rounded-sm border border-neutral-border px-3 text-[12px] font-medium text-slate-300 transition-colors hover:bg-white/5"
      >
        <Plus className="size-3.5" />
        Create one
      </button>
    </div>
  );
}

function AutomationDetailPanel({
  automation,
  logs,
  isLogsLoading,
  logsError,
  onEdit,
  onToggle,
  onDelete,
}: {
  automation: AutomationSurfaceItem;
  logs: AutomationSurfaceLog[];
  isLogsLoading: boolean;
  logsError: unknown;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const triggerSummary = summarizeAutomationDocument(automation.trigger);
  const actionSummary = summarizeAutomationDocument(automation.action);

  return (
    <div className="rounded-sm border border-neutral-border bg-neutral-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-[13px] font-semibold text-slate-100">{automation.name}</h3>
            <span
              className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${
                automation.enabled
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-500/20 bg-slate-500/10 text-slate-300"
              }`}
            >
              {automation.enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          {automation.description ? (
            <p className="text-[12px] text-slate-500">{automation.description}</p>
          ) : (
            <p className="text-[12px] text-slate-600">No description provided.</p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
            aria-label={automation.enabled ? "Disable automation" : "Enable automation"}
          >
            {automation.enabled ? (
              <ToggleRight className="size-4 text-primary" />
            ) : (
              <ToggleLeft className="size-4 text-slate-600" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
            aria-label="Edit automation"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-sm p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-rose-300"
            aria-label="Delete automation"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono uppercase tracking-wider text-amber-400/80">When</span>
          <span className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-200">
            {triggerSummary}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono uppercase tracking-wider text-emerald-400/80">Then</span>
          <span className="rounded-sm border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
            {actionSummary}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-border/40 pt-4 text-[11px] text-slate-500">
        <div>
          <div className="uppercase tracking-wider text-slate-600">Triggered</div>
          <div className="mt-1 text-slate-300">{automation.executionCount} runs</div>
        </div>
        <div>
          <div className="uppercase tracking-wider text-slate-600">Last run</div>
          <div className="mt-1 text-slate-300">{formatAutomationTimestamp(automation.lastTriggered)}</div>
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-border/40 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-[12px] font-semibold text-slate-200">Recent logs</h4>
            <p className="text-[11px] text-slate-500">Latest executions for this automation.</p>
          </div>
          <span className="rounded-sm border border-neutral-border px-2 py-0.5 text-[10px] text-slate-500">
            {logs.length} shown
          </span>
        </div>

        {isLogsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-sm border border-neutral-border bg-white/[0.03]"
              />
            ))}
          </div>
        ) : logsError ? (
          <div className="rounded-sm border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
            {getApiErrorMessage(logsError, "Recent logs could not be loaded.")}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-sm border border-dashed border-neutral-border/70 bg-white/[0.02] px-3 py-4 text-[12px] text-slate-500">
            No execution logs have been recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const StatusIcon = getStatusIcon(log.status);

              return (
                <div
                  key={log.id}
                  className="rounded-sm border border-neutral-border bg-background-dark/60 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] ${getStatusTone(
                            log.status,
                          )}`}
                        >
                          <StatusIcon className="size-3" />
                          {formatStatusLabel(log.status)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatAutomationDateTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] text-slate-300">
                        Duration {formatAutomationDuration(log.executionDuration)}
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <div>{log.errorMessage ? "Error" : "Result"}</div>
                    </div>
                  </div>

                  {log.triggerData ? (
                    <p className="mt-2 line-clamp-2 text-[11px] text-slate-500">
                      Trigger: {log.triggerData}
                    </p>
                  ) : null}
                  {log.actionResult ? (
                    <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                      Action: {log.actionResult}
                    </p>
                  ) : null}
                  {log.errorMessage ? (
                    <p className="mt-1 line-clamp-2 text-[11px] text-rose-200">
                      {log.errorMessage}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function AutomationsLayout() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [modalAutomation, setModalAutomation] = useState<AutomationSurfaceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    activeWorkspaceId,
    automationsQuery,
    projectsQuery,
    automationLogsQuery,
    selectedAutomation,
    createAutomation,
    updateAutomation,
    toggleAutomation,
    deleteAutomation,
  } = useAutomationsData(selectedAutomationId);

  const automations = useMemo(() => automationsQuery.data ?? [], [automationsQuery.data]);
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  const filteredAutomations = useMemo(
    () => filterAutomationList(automations, filterTab, search),
    [automations, filterTab, search],
  );

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const project of projects) {
      map[project.id] = project.name;
    }
    return map;
  }, [projects]);

  useEffect(() => {
    if (selectedAutomationId && !automations.some((automation) => automation.id === selectedAutomationId)) {
      setSelectedAutomationId(null);
    }
  }, [automations, selectedAutomationId]);

  const tabs: { key: FilterTab; label: string; count: number }[] = useMemo(
    () => [
      { key: "all", label: "All", count: automations.length },
      { key: "enabled", label: "Enabled", count: automations.filter((automation) => automation.enabled).length },
      {
        key: "disabled",
        label: "Disabled",
        count: automations.filter((automation) => !automation.enabled).length,
      },
    ],
    [automations],
  );

  const openCreateModal = () => {
    setModalAutomation(null);
    setIsModalOpen(true);
  };

  const openEditModal = (automation: AutomationSurfaceItem) => {
    setModalAutomation(automation);
    setIsModalOpen(true);
  };

  const handleSaveAutomation = async (input: AutomationUpsertInput) => {
    setIsSaving(true);

    try {
      const savedAutomation = modalAutomation
        ? await updateAutomation(modalAutomation.id, input)
        : await createAutomation(input);

      setSelectedAutomationId(savedAutomation.id);
      setIsModalOpen(false);
      setModalAutomation(null);
      toast({
        type: "success",
        title: modalAutomation ? "Automation updated" : "Automation created",
        message: savedAutomation.name,
      });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "The automation could not be saved. Please review the form and try again.",
      );

      toast({
        type: "error",
        title: "Automation save failed",
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (automation: AutomationSurfaceItem) => {
    try {
      const updated = await toggleAutomation(automation, !automation.enabled);
      toast({
        type: "success",
        title: updated.isActive ? "Automation enabled" : "Automation disabled",
        message: updated.name,
      });
    } catch (error) {
      toast({
        type: "error",
        title: "Could not update automation",
        message: getApiErrorMessage(error, "Please try again."),
      });
    }
  };

  const handleDelete = async (automation: AutomationSurfaceItem) => {
    if (!window.confirm(`Delete "${automation.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteAutomation(automation.id);

      if (selectedAutomationId === automation.id) {
        setSelectedAutomationId(null);
      }

      toast({
        type: "success",
        title: "Automation deleted",
        message: automation.name,
      });
    } catch (error) {
      toast({
        type: "error",
        title: "Could not delete automation",
        message: getApiErrorMessage(error, "Please try again."),
      });
    }
  };

  const emptyQueryError = automationsQuery.error ?? null;
  const isInitialLoading = automationsQuery.isLoading && automations.length === 0;
  const hasWorkspace = !!activeWorkspaceId;

  return (
    <>
      <Breadcrumbs />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-5 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-sm border border-primary/20 bg-primary/10 p-2">
              <Zap className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-[16px] font-semibold text-slate-100">Automation Builder</h1>
              <p className="text-[12px] text-slate-500">
                Live automations backed by the API contract. Each rule stores one trigger and one action.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search automations..."
                  className="h-8 w-full rounded-sm border border-neutral-border bg-neutral-surface pl-8 pr-3 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center overflow-hidden rounded-sm border border-neutral-border bg-neutral-surface">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterTab(tab.key)}
                    className={`h-8 px-3 text-[11px] font-medium transition-colors ${
                      filterTab === tab.key
                        ? "bg-white/10 text-slate-100"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1 text-[10px] text-slate-600">{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="flex h-8 items-center gap-1.5 rounded-sm border border-primary bg-primary px-3 text-[12px] font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="size-3.5" />
              New Automation
            </button>
          </div>

          {!hasWorkspace ? (
            <div className="rounded-sm border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100">
              Select an active workspace to load automations.
            </div>
          ) : null}

          {emptyQueryError ? (
            <div className="rounded-sm border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-100">
              {getApiErrorMessage(emptyQueryError, "Automations could not be loaded. Please try again.")}
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
            <div className="space-y-3">
              {isInitialLoading ? (
                <LoadingSkeleton />
              ) : filteredAutomations.length === 0 && automations.length === 0 ? (
                <EmptyState onCreate={openCreateModal} />
              ) : filteredAutomations.length === 0 ? (
                <div className="rounded-sm border border-neutral-border bg-neutral-surface px-4 py-10 text-center text-[13px] text-slate-500">
                  No automations match the current search or filter.
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredAutomations.map((automation) => (
                    <AutomationCard
                      key={automation.id}
                      automation={automation}
                      projectName={automation.projectId ? projectMap[automation.projectId] : undefined}
                      selected={selectedAutomationId === automation.id}
                      onView={() => setSelectedAutomationId(automation.id)}
                      onToggle={() => void handleToggle(automation)}
                      onEdit={() => openEditModal(automation)}
                      onDelete={() => void handleDelete(automation)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="space-y-3">
              {selectedAutomation ? (
                <AutomationDetailPanel
                  automation={selectedAutomation}
                  logs={automationLogsQuery.data ?? []}
                  isLogsLoading={automationLogsQuery.isLoading}
                  logsError={automationLogsQuery.error ?? null}
                  onEdit={() => openEditModal(selectedAutomation)}
                  onToggle={() => void handleToggle(selectedAutomation)}
                  onDelete={() => void handleDelete(selectedAutomation)}
                />
              ) : (
                <DetailPlaceholder onCreate={openCreateModal} />
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen ? (
          <AutomationModal
            automation={modalAutomation}
            projects={projects}
            isSaving={isSaving}
            onClose={() => {
              if (isSaving) {
                return;
              }
              setIsModalOpen(false);
              setModalAutomation(null);
            }}
            onSave={handleSaveAutomation}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
