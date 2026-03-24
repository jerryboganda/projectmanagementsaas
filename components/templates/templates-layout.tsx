"use client";

import { useState, useMemo, useCallback } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { motion, AnimatePresence } from "motion/react";
import { useTemplatesData } from "@/hooks/use-templates-data";
import { type ProjectResponse } from "@/lib/api/contracts";
import {
  type ProjectTemplate,
  getTemplateTaskCount,
  getTemplateSubtaskCount,
} from "@/lib/templates/types";
import {
  LayoutTemplate,
  Search,
  Grid3X3,
  List,
  X,
  CheckCircle2,
  ChevronRight,
  Tag,
  ListChecks,
  FolderOpen,
  Rocket,
  Eye,
  ArrowRight,
  Layers,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORY_ORDER = [
  "Engineering",
  "Marketing",
  "Product",
  "Operations",
] as const;

const CATEGORY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; accent: string }
> = {
  Engineering: {
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    accent: "bg-blue-500",
  },
  Marketing: {
    color: "text-purple-300",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    accent: "bg-purple-500",
  },
  Product: {
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    accent: "bg-emerald-500",
  },
  Operations: {
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    accent: "bg-amber-500",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  Urgent: { color: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/20" },
  High: { color: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  Medium: { color: "text-yellow-300", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  Low: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
};

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: typeof LayoutTemplate;
  accent: string;
}) {
  return (
    <div className="bg-neutral-surface border border-neutral-border rounded-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-sm ${accent}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[18px] font-semibold text-slate-100">{value}</p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TemplateCard (Grid)
// ---------------------------------------------------------------------------

interface TemplateCardProps {
  template: ProjectTemplate;
  onPreview: () => void;
  onUse: () => void;
}

function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  const cat = CATEGORY_CONFIG[template.category] ?? CATEGORY_CONFIG.Engineering;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="group bg-neutral-surface border border-neutral-border rounded-sm overflow-hidden hover:border-slate-600 transition-colors flex flex-col"
    >
      {/* Category accent bar */}
      <div className={`h-1 w-full ${cat.accent}`} />

      <div className="p-4 flex flex-col flex-1">
        {/* Icon + name */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-sm ${cat.bg} flex-shrink-0`}>
            <LayoutTemplate className={`size-4 ${cat.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-semibold text-slate-100 leading-snug mb-1">
              {template.name}
            </h4>
            <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
              {template.description}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-auto mb-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <ListChecks className="size-3" />
            {template.taskTemplates.length} tasks included
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${cat.bg} ${cat.color} ${cat.border}`}
          >
            {template.category}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-neutral-border/50">
          <button
            onClick={onUse}
            className="flex-1 h-8 flex items-center justify-center gap-1.5 text-[12px] font-medium text-white bg-primary rounded-sm hover:bg-primary/90 transition-colors"
          >
            <Rocket className="size-3.5" />
            Use Template
          </button>
          <button
            onClick={onPreview}
            className="h-8 px-3 flex items-center justify-center gap-1 text-[12px] font-medium text-slate-400 border border-neutral-border rounded-sm hover:bg-white/5 hover:text-slate-200 transition-colors"
          >
            <Eye className="size-3.5" />
            Preview
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// TemplateRow (List)
// ---------------------------------------------------------------------------

interface TemplateRowProps {
  template: ProjectTemplate;
  onPreview: () => void;
  onUse: () => void;
}

function TemplateRow({ template, onPreview, onUse }: TemplateRowProps) {
  const cat = CATEGORY_CONFIG[template.category] ?? CATEGORY_CONFIG.Engineering;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-4 px-4 py-3 bg-neutral-surface border border-neutral-border rounded-sm hover:border-slate-600 transition-colors"
    >
      {/* Accent dot */}
      <div className={`size-2 rounded-full flex-shrink-0 ${cat.accent}`} />

      {/* Icon */}
      <div className={`p-1.5 rounded-sm ${cat.bg} flex-shrink-0`}>
        <LayoutTemplate className={`size-4 ${cat.color}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold text-slate-100 truncate">
          {template.name}
        </h4>
        <p className="text-[12px] text-slate-500 truncate">{template.description}</p>
      </div>

      {/* Task count */}
      <span className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0">
        <ListChecks className="size-3" />
        {template.taskTemplates.length} tasks
      </span>

      {/* Category badge */}
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border flex-shrink-0 ${cat.bg} ${cat.color} ${cat.border}`}
      >
        {template.category}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onPreview}
          className="h-7 px-2.5 text-[11px] font-medium text-slate-400 border border-neutral-border rounded-sm hover:bg-white/5 hover:text-slate-200 transition-colors flex items-center gap-1"
        >
          <Eye className="size-3" />
          Preview
        </button>
        <button
          onClick={onUse}
          className="h-7 px-2.5 text-[11px] font-medium text-white bg-primary rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-1"
        >
          <Rocket className="size-3" />
          Use
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// PreviewPanel
// ---------------------------------------------------------------------------

interface PreviewPanelProps {
  template: ProjectTemplate;
  onUse: () => void;
  onClose: () => void;
}

function PreviewPanel({ template, onUse, onClose }: PreviewPanelProps) {
  const cat = CATEGORY_CONFIG[template.category] ?? CATEGORY_CONFIG.Engineering;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-sm ${cat.bg}`}>
            <LayoutTemplate className={`size-4 ${cat.color}`} />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-slate-100">
              Template Preview
            </h3>
            <p className="text-[11px] text-slate-500">{template.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Template info */}
        <div>
          <h4 className="text-[15px] font-semibold text-slate-100 mb-1">
            {template.name}
          </h4>
          <p className="text-[12px] text-slate-400 leading-relaxed mb-3">
            {template.description}
          </p>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${cat.bg} ${cat.color} ${cat.border}`}
            >
              {template.category}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <ListChecks className="size-3" />
              {template.taskTemplates.length} tasks included
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-border/50" />

        {/* Task templates */}
        <div>
          <h5 className="text-[12px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Task Templates
          </h5>
          <div className="space-y-2.5">
            {template.taskTemplates.map((task, idx) => {
              const prCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.Medium;
              return (
                <div
                  key={idx}
                  className="bg-background-dark border border-neutral-border/60 rounded-sm p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h6 className="text-[13px] font-medium text-slate-200">
                      {task.title}
                    </h6>
                    <span
                      className={`flex-shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${prCfg.bg} ${prCfg.color} ${prCfg.border}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Subtasks */}
                  {task.subtasks.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] text-slate-600 uppercase tracking-wider">
                        {task.subtasks.length} subtask{task.subtasks.length !== 1 ? "s" : ""}
                      </span>
                      <div className="mt-1 space-y-1">
                        {task.subtasks.map((st, si) => (
                          <div
                            key={si}
                            className="flex items-center gap-1.5 text-[11px] text-slate-400"
                          >
                            <ChevronRight className="size-2.5 text-slate-600" />
                            {st}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-800/50 border border-neutral-border/60 px-1.5 py-0.5 rounded-sm"
                        >
                          <Tag className="size-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-border">
        <button
          onClick={onClose}
          className="h-8 px-4 text-[12px] font-medium text-slate-400 border border-neutral-border rounded-sm hover:bg-white/5 transition-colors"
        >
          Close
        </button>
        <button
          onClick={onUse}
          className="h-8 px-4 text-[12px] font-medium text-white bg-primary rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        >
          <Rocket className="size-3.5" />
          Use This Template
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// UseTemplateModal
// ---------------------------------------------------------------------------

interface UseTemplateModalProps {
  template: ProjectTemplate;
  onClose: () => void;
  onCreate: (projectName: string) => Promise<ProjectResponse | undefined>;
  isCreating: boolean;
}

function UseTemplateModal({ template, onClose, onCreate, isCreating }: UseTemplateModalProps) {
  const [projectName, setProjectName] = useState("");
  const [createdProject, setCreatedProject] = useState<ProjectResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cat = CATEGORY_CONFIG[template.category] ?? CATEGORY_CONFIG.Engineering;

  const handleCreate = async () => {
    if (!projectName.trim()) return;

    setErrorMessage(null);

    try {
      const project = await onCreate(projectName.trim());
      if (project) {
        setCreatedProject(project);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create the project.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative bg-neutral-surface border border-neutral-border rounded-sm shadow-2xl w-full max-w-md mx-4"
      >
        {createdProject ? (
          /* ---- Success state ---- */
          <div className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="mx-auto mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm w-fit"
            >
              <CheckCircle2 className="size-8 text-emerald-400" />
            </motion.div>
            <h3 className="text-[16px] font-semibold text-slate-100 mb-1">
              Project Created!
            </h3>
            <p className="text-[13px] text-slate-400 mb-4">
              <span className="font-medium text-slate-200">
                {createdProject.name}
              </span>{" "}
              has been created from the{" "}
              <span className="font-medium text-slate-300">
                {template.name}
              </span>{" "}
              template.
            </p>
            <div className="bg-background-dark border border-neutral-border/60 rounded-sm p-3 mb-5 text-left">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="size-3.5 text-primary" />
                <span className="text-[12px] font-medium text-slate-200">
                  {createdProject.name}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500">
                <p>Status: {createdProject.status}</p>
                <p>Tasks created: {createdProject.taskCount}</p>
                <p>Category: {template.category}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full h-9 text-[12px] font-medium text-white bg-primary rounded-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
            >
              Done
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        ) : (
          /* ---- Form state ---- */
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-sm ${cat.bg}`}>
                  <LayoutTemplate className={`size-4 ${cat.color}`} />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-100">
                    Create from Template
                  </h3>
                  <p className="text-[11px] text-slate-500">{template.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-4">
              {/* Project name input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    setErrorMessage(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleCreate();
                    }
                  }}
                  placeholder="e.g. Q2 Marketing Sprint"
                  autoFocus
                  className="w-full h-9 bg-background-dark border border-neutral-border rounded-sm px-3 text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary transition-colors"
                />
                {errorMessage ? (
                  <p className="mt-1.5 text-[11px] text-rose-400">{errorMessage}</p>
                ) : null}
              </div>

              {/* Preview of what will be created */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  What will be created
                </label>
                <div className="bg-background-dark border border-neutral-border/60 rounded-sm p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[12px]">
                    <FolderOpen className="size-3.5 text-primary" />
                    <span className="text-slate-300">1 new project</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <ListChecks className="size-3.5 text-blue-400" />
                    <span className="text-slate-300">
                      {getTemplateTaskCount(template)} tasks with subtasks
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <Tag className="size-3.5 text-slate-500" />
                    <span className="text-slate-300">
                      Tagged as {template.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-border">
              <button
                onClick={onClose}
                className="h-8 px-4 text-[12px] font-medium text-slate-400 border border-neutral-border rounded-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={!projectName.trim() || isCreating}
                className="h-8 px-4 text-[12px] font-medium text-white bg-primary rounded-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Rocket className="size-3.5" />
                {isCreating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// TemplatesLayout
// ---------------------------------------------------------------------------

type ViewMode = "grid" | "list";

export function TemplatesLayout() {
  const {
    templates,
    templatesQuery,
    refreshTemplates,
    createProjectFromTemplate,
    isCreatingProjectFromTemplate,
  } = useTemplatesData();

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [useTemplateId, setUseTemplateId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const liveCategories = templates.map((template) => template.category);
    const ordered = DEFAULT_CATEGORY_ORDER.filter((item) =>
      liveCategories.includes(item),
    );
    const extras = liveCategories.filter(
      (item) => !DEFAULT_CATEGORY_ORDER.includes(item as (typeof DEFAULT_CATEGORY_ORDER)[number]),
    );

    return [...ordered, ...extras];
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (category !== "All") {
      result = result.filter((t) => t.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [templates, category, search]);

  // Find template for preview / use
  const previewTemplate = useMemo(
    () => templates.find((t) => t.id === previewId) ?? null,
    [templates, previewId]
  );
  const useTemplate = useMemo(
    () => templates.find((t) => t.id === useTemplateId) ?? null,
    [templates, useTemplateId]
  );

  // Stats
  const stats = useMemo(() => {
    const totalTemplates = templates.length;
    const plannedSubtasks = templates.reduce(
      (sum, template) => sum + getTemplateSubtaskCount(template),
      0,
    );

    return { totalTemplates, plannedSubtasks };
  }, [templates]);

  const handlePreview = useCallback((id: string) => {
    setPreviewId(id);
  }, []);

  const handleUse = useCallback((id: string) => {
    setUseTemplateId(id);
  }, []);

  const handleCreate = useCallback(
    async (projectName: string) => {
      if (!useTemplateId) return undefined;
      return createProjectFromTemplate(useTemplateId, projectName);
    },
    [useTemplateId, createProjectFromTemplate]
  );

  return (
    <>
      <Breadcrumbs />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Stats bar */}
        <div className="px-6 pt-5 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total Templates"
              value={stats.totalTemplates}
              icon={LayoutTemplate}
              accent="bg-primary/10 text-primary"
            />
            <StatCard
              label="Planned Subtasks"
              value={stats.plannedSubtasks}
              icon={Layers}
              accent="bg-emerald-500/10 text-emerald-400"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 pb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Category tabs */}
          <div className="flex items-center gap-1 bg-neutral-surface/50 border border-neutral-border rounded-sm p-0.5">
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-sm transition-colors ${
                  category === cat
                    ? "bg-white/10 text-slate-100"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full sm:w-56 h-8 pl-8 pr-3 bg-background-dark border border-neutral-border rounded-sm text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-neutral-surface/50 border border-neutral-border rounded-sm p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-sm transition-colors ${
                viewMode === "grid"
                  ? "bg-white/10 text-slate-100"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
              aria-label="Grid view"
            >
              <Grid3X3 className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-sm transition-colors ${
                viewMode === "list"
                  ? "bg-white/10 text-slate-100"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
              aria-label="List view"
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden px-6 pb-6 gap-4">
          {/* Templates grid / list */}
          <div className="flex-1 overflow-y-auto">
            {templatesQuery.isError ? (
              <div className="mb-4 rounded-sm border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Template library could not be loaded
                    </p>
                    <p className="mt-1 text-[12px] text-slate-400">
                      The workspace connection is live, but the template list needs another fetch.
                    </p>
                  </div>
                  <button
                    onClick={() => void refreshTemplates()}
                    className="rounded-sm border border-rose-500/30 px-3 py-1.5 text-[12px] font-medium text-rose-200 transition-colors hover:bg-rose-500/10"
                  >
                    {templatesQuery.isFetching ? "Retrying..." : "Retry"}
                  </button>
                </div>
              </div>
            ) : null}

            <AnimatePresence mode="popLayout">
              {templatesQuery.isLoading && templates.length === 0 ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" : "space-y-2"}
                >
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`template-loading-${index}`}
                      className="rounded-sm border border-neutral-border bg-neutral-surface/40 p-4"
                    >
                      <div className="mb-4 h-1 w-full rounded bg-white/5" />
                      <div className="mb-3 h-4 w-3/4 rounded bg-white/5" />
                      <div className="mb-2 h-3 w-full rounded bg-white/5" />
                      <div className="mb-6 h-3 w-5/6 rounded bg-white/5" />
                      <div className="flex items-center justify-between gap-2">
                        <div className="h-4 w-24 rounded bg-white/5" />
                        <div className="h-8 w-28 rounded bg-white/5" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : filteredTemplates.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm mb-4">
                    <LayoutTemplate className="size-8 text-primary" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-slate-200 mb-1">
                    No templates found
                  </h3>
                  <p className="text-[13px] text-slate-500 max-w-sm">
                    {search.trim()
                      ? "No templates match your search. Try adjusting your filters."
                      : "No templates available in this category."}
                  </p>
                </motion.div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredTemplates.map((tmpl) => (
                    <TemplateCard
                      key={tmpl.id}
                      template={tmpl}
                      onPreview={() => handlePreview(tmpl.id)}
                      onUse={() => handleUse(tmpl.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((tmpl) => (
                    <TemplateRow
                      key={tmpl.id}
                      template={tmpl}
                      onPreview={() => handlePreview(tmpl.id)}
                      onUse={() => handleUse(tmpl.id)}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Preview side panel */}
          <AnimatePresence>
            {previewTemplate && (
              <motion.div
                key="preview-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 bg-neutral-surface/30 border border-neutral-border rounded-sm overflow-hidden"
              >
                <PreviewPanel
                  template={previewTemplate}
                  onUse={() => {
                    setPreviewId(null);
                    handleUse(previewTemplate.id);
                  }}
                  onClose={() => setPreviewId(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Use Template Modal */}
      <AnimatePresence>
        {useTemplate && (
          <UseTemplateModal
            key="use-modal"
            template={useTemplate}
            onClose={() => setUseTemplateId(null)}
            onCreate={handleCreate}
            isCreating={isCreatingProjectFromTemplate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
