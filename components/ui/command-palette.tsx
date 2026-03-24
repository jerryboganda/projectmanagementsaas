'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Briefcase,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  Calendar,
  Users,
  Target,
  FileText,
  BarChart2,
  Settings,
  Inbox,
  ListTodo,
  Plus,
  CheckSquare,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { useDocumentsData } from '@/hooks/use-documents-data';
import type {
  GoalResponse,
  ProjectResponse,
  TaskResponse,
  WorkspaceMemberResponse,
} from '@/lib/api/contracts';

// ============================================================
// Types
// ============================================================

type ResultGroup =
  | 'Tasks'
  | 'Projects'
  | 'Goals'
  | 'Initiatives'
  | 'Docs'
  | 'People'
  | 'Navigation'
  | 'Quick Actions';

interface CommandItem {
  id: string;
  icon: LucideIcon;
  label: string;
  group: ResultGroup;
  shortcut?: string;
  subtitle?: string;
  onSelect: () => void;
  /** Render a leading status dot with this color */
  dotColor?: string;
  /** Render an avatar circle */
  avatar?: { initials: string; src?: string };
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (href: string) => void;
  extraItems?: CommandItem[];
}

// ============================================================
// Static data
// ============================================================

const defaultPages: Omit<CommandItem, 'onSelect'>[] = [
  { id: 'inbox', icon: Inbox, label: 'Inbox', group: 'Navigation' },
  { id: 'issues', icon: ListTodo, label: 'My Issues', group: 'Navigation' },
  { id: 'projects', icon: Briefcase, label: 'Projects', group: 'Navigation' },
  { id: 'portfolio', icon: FolderKanban, label: 'Portfolio', group: 'Navigation' },
  { id: 'board', icon: LayoutDashboard, label: 'Board', group: 'Navigation' },
  { id: 'timeline', icon: LineChart, label: 'Timeline', group: 'Navigation' },
  { id: 'calendar', icon: Calendar, label: 'Calendar', group: 'Navigation' },
  { id: 'workload', icon: Users, label: 'Workload', group: 'Navigation' },
  { id: 'goals', icon: Target, label: 'Goals', group: 'Navigation' },
  { id: 'docs', icon: FileText, label: 'Docs', group: 'Navigation' },
  { id: 'reports', icon: BarChart2, label: 'Reports', group: 'Navigation' },
  { id: 'settings', icon: Settings, label: 'Settings', group: 'Navigation' },
];

const defaultActions: Omit<CommandItem, 'onSelect'>[] = [
  { id: 'new-task', icon: Plus, label: 'Create Task', group: 'Quick Actions', shortcut: 'C' },
  { id: 'new-project', icon: Plus, label: 'Create Project', group: 'Quick Actions' },
  { id: 'new-doc', icon: Plus, label: 'Create Document', group: 'Quick Actions' },
  { id: 'new-goal', icon: Plus, label: 'Create Goal', group: 'Quick Actions' },
];

// ============================================================
// Helpers
// ============================================================

const MAX_PER_GROUP = 5;

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function matchesAny(query: string, ...fields: (string | undefined)[]): boolean {
  for (const f of fields) {
    if (f && fuzzyMatch(query, f)) return true;
  }
  return false;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  Backlog: 'bg-slate-500',
  Todo: 'bg-slate-500',
  InProgress: 'bg-blue-500',
  InReview: 'bg-amber-500',
  Done: 'bg-emerald-500',
  Cancelled: 'bg-rose-500',
};

const PROJECT_STATUS_DOT_COLORS: Record<string, string> = {
  Active: 'bg-emerald-500',
  Paused: 'bg-amber-500',
  Completed: 'bg-blue-500',
  Archived: 'bg-slate-500',
};

const GOAL_DOT_COLORS: Record<string, string> = {
  OnTrack: 'bg-emerald-500',
  AtRisk: 'bg-amber-500',
  OffTrack: 'bg-red-500',
  Completed: 'bg-emerald-400',
  Cancelled: 'bg-slate-500',
};

const INITIATIVE_DOT_COLORS: Record<string, string> = {
  Planned: 'bg-slate-500',
  InProgress: 'bg-blue-500',
  Completed: 'bg-emerald-500',
  Cancelled: 'bg-amber-500',
};

/** Ordered group rendering */
const GROUP_ORDER: ResultGroup[] = [
  'Tasks',
  'Projects',
  'Goals',
  'Initiatives',
  'Docs',
  'People',
  'Navigation',
  'Quick Actions',
];

function formatEnumLabel(value: string | number | null | undefined): string {
  if (typeof value !== 'string' || value.length === 0) {
    return 'Unknown';
  }

  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');
}

// ============================================================
// Component
// ============================================================

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  extraItems = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { apiClient } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const { documents: allDocs, documentsQuery } = useDocumentsData();
  const entityQueriesEnabled = isOpen && !!activeWorkspaceId;

  const tasksQuery = useQuery<TaskResponse[]>({
    queryKey: ['command-palette', activeWorkspaceId, 'tasks'],
    enabled: entityQueriesEnabled,
    staleTime: 30_000,
    queryFn: async () => apiClient.listTasks({ pageSize: 100 }),
  });

  const projectsQuery = useQuery<ProjectResponse[]>({
    queryKey: ['command-palette', activeWorkspaceId, 'projects'],
    enabled: entityQueriesEnabled,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
  });

  const goalsQuery = useQuery<GoalResponse[]>({
    queryKey: ['command-palette', activeWorkspaceId, 'goals'],
    enabled: entityQueriesEnabled,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listGoals({
        pageSize: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  const membersQuery = useQuery<WorkspaceMemberResponse[]>({
    queryKey: ['command-palette', activeWorkspaceId, 'members'],
    enabled: entityQueriesEnabled,
    staleTime: 30_000,
    queryFn: async () => apiClient.listWorkspaceMembers(activeWorkspaceId!),
  });

  // Build navigation & action items (static)
  const navItems: CommandItem[] = useMemo(() => {
    return defaultPages.map((p) => ({
      ...p,
      onSelect: () => {
        const href = p.id === 'issues' ? '/' : `/${p.id}`;
        onNavigate?.(href);
        onClose();
      },
    }));
  }, [onNavigate, onClose]);

  const actionItems: CommandItem[] = useMemo(() => {
    return defaultActions.map((a) => ({
      ...a,
      onSelect: () => {
        const href =
          a.id === 'new-task'
            ? '/board'
            : a.id === 'new-project'
              ? '/projects'
              : a.id === 'new-doc'
                ? '/docs'
                : '/goals';

        onNavigate?.(href);
        onClose();
      },
    }));
  }, [onClose, onNavigate]);

  // Build search results from entities
  const entityResults: CommandItem[] = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    const results: CommandItem[] = [];
    const taskList = tasksQuery.data ?? [];
    const projectList = (projectsQuery.data ?? []).map((project) => ({
      ...project,
      progress:
        project.taskCount > 0
          ? Math.round((project.completedTaskCount / project.taskCount) * 100)
          : 0,
    }));
    const goals = Object.fromEntries(
      (goalsQuery.data ?? []).map((goal) => [
        goal.id,
        {
          ...goal,
          type: formatEnumLabel(goal.type),
        },
      ]),
    );
    // Portfolio initiatives do not have a workspace-wide search contract yet.
    const initiatives: Record<
      string,
      {
        id: string;
        name: string;
        description?: string | null;
        status: string;
        progress: number;
      }
    > = {};
    const users = Object.fromEntries(
      (membersQuery.data ?? []).map((member) => [
        member.userId,
        {
          id: member.userId,
          name: member.fullName,
          email: member.email,
          role: formatEnumLabel(member.role),
          initials: getInitials(member.fullName),
          avatar: member.avatarUrl ?? undefined,
        },
      ]),
    );
    const projectsById = new Map(projectList.map((project) => [project.id, project]));

    // --- Tasks ---
    let taskCount = 0;
    for (const t of taskList) {
      if (taskCount >= MAX_PER_GROUP) break;
      const tagStr = t.labels.join(' ');
      if (matchesAny(q, t.title, t.description ?? undefined, tagStr, t.identifier)) {
        const proj = projectsById.get(t.projectId);
        results.push({
          id: `task-${t.id}`,
          icon: CheckSquare,
          label: t.title,
          group: 'Tasks',
          subtitle: proj ? `${proj.name} · ${formatEnumLabel(t.status)}` : formatEnumLabel(t.status),
          dotColor: STATUS_DOT_COLORS[String(t.status)] ?? 'bg-slate-500',
          onSelect: () => {
            onNavigate?.('/board');
            onClose();
          },
        });
        taskCount++;
      }
    }

    // --- Projects ---
    let projCount = 0;
    for (const p of projectList) {
      if (projCount >= MAX_PER_GROUP) break;
      if (matchesAny(q, p.name, p.description ?? undefined, p.identifier)) {
        results.push({
          id: `project-${p.id}`,
          icon: Briefcase,
          label: p.name,
          group: 'Projects',
          subtitle: `${p.status} · ${p.progress}%`,
          dotColor: PROJECT_STATUS_DOT_COLORS[String(p.status)] ?? 'bg-slate-500',
          onSelect: () => {
            onNavigate?.('/projects');
            onClose();
          },
        });
        projCount++;
      }
    }

    // --- Goals ---
    const goalList = Object.values(goals);
    let goalCount = 0;
    for (const g of goalList) {
      if (goalCount >= MAX_PER_GROUP) break;
      if (matchesAny(q, g.title)) {
        results.push({
          id: `goal-${g.id}`,
          icon: Target,
          label: g.title,
          group: 'Goals',
          subtitle: g.type,
          dotColor: GOAL_DOT_COLORS[g.status] ?? 'bg-slate-500',
          onSelect: () => {
            onNavigate?.('/goals');
            onClose();
          },
        });
        goalCount++;
      }
    }

    // --- Initiatives ---
    const initList = Object.values(initiatives);
    let initCount = 0;
    for (const i of initList) {
      if (initCount >= MAX_PER_GROUP) break;
      if (matchesAny(q, i.name, i.description ?? undefined)) {
        results.push({
          id: `initiative-${i.id}`,
          icon: TrendingUp,
          label: i.name,
          group: 'Initiatives',
          subtitle: `${i.status} · ${i.progress}%`,
          dotColor: INITIATIVE_DOT_COLORS[i.status] ?? 'bg-slate-500',
          onSelect: () => {
            onNavigate?.('/portfolio');
            onClose();
          },
        });
        initCount++;
      }
    }

    // --- Docs ---
    let docCount = 0;
    for (const d of allDocs) {
      if (docCount >= MAX_PER_GROUP) break;
      if (matchesAny(q, d.title)) {
        results.push({
          id: `doc-${d.id}`,
          icon: FileText,
          label: d.title,
          group: 'Docs',
          subtitle: d.creator.fullName,
          onSelect: () => {
            onNavigate?.('/docs');
            onClose();
          },
        });
        docCount++;
      }
    }

    // --- People ---
    const userList = Object.values(users);
    let userCount = 0;
    for (const u of userList) {
      if (userCount >= MAX_PER_GROUP) break;
      if (matchesAny(q, u.name, u.email)) {
        results.push({
          id: `person-${u.id}`,
          icon: User,
          label: u.name,
          group: 'People',
          subtitle: u.role,
          avatar: { initials: u.initials, src: u.avatar },
          onSelect: () => {
            onNavigate?.('/workload');
            onClose();
          },
        });
        userCount++;
      }
    }

    return results;
  }, [query, tasksQuery.data, projectsQuery.data, goalsQuery.data, membersQuery.data, allDocs, onNavigate, onClose]);

  // Combine all items based on query
  const allItems: CommandItem[] = useMemo(() => {
    const q = query.trim();
    if (!q) {
      // Empty query: navigation + quick actions
      return [...navItems, ...actionItems, ...extraItems];
    }
    // With query: entity results + filtered navigation + filtered actions
    const filteredNav = navItems.filter((item) => fuzzyMatch(q, item.label));
    const filteredActions = actionItems.filter((item) => fuzzyMatch(q, item.label));
    return [...entityResults, ...filteredNav, ...filteredActions, ...extraItems.filter((item) => fuzzyMatch(q, item.label))];
  }, [query, navItems, actionItems, entityResults, extraItems]);

  // Group items preserving GROUP_ORDER
  const grouped = useMemo(() => {
    const groups: Partial<Record<ResultGroup, CommandItem[]>> = {};
    for (const item of allItems) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group]!.push(item);
    }
    // Return ordered entries
    const ordered: [ResultGroup, CommandItem[]][] = [];
    for (const g of GROUP_ORDER) {
      if (groups[g] && groups[g]!.length > 0) {
        ordered.push([g, groups[g]!]);
      }
    }
    return ordered;
  }, [allItems]);

  const flatItems = allItems;
  const isSearchingEntities =
    query.trim().length > 0 &&
    (tasksQuery.isFetching ||
      projectsQuery.isFetching ||
      goalsQuery.isFetching ||
      membersQuery.isFetching ||
      documentsQuery.isFetching);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (flatItems.length === 0) {
        return;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        flatItems[activeIndex]?.onSelect();
      }
    },
    [onClose, flatItems, activeIndex]
  );

  useEffect(() => {
    if (flatItems.length === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((prev) => Math.min(prev, flatItems.length - 1));
  }, [flatItems.length]);

  // Scroll active item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const active = container.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Build a flat index counter for keyboard nav
  let itemIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-[540px] mx-4 bg-neutral-surface border border-neutral-border rounded-lg shadow-2xl overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-neutral-border">
              <Search className="size-[18px] text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search tasks, projects, people..."
                className="flex-1 h-12 bg-transparent text-[14px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
              <kbd className="hidden sm:inline text-[10px] font-mono text-slate-600 border border-neutral-border px-1.5 py-0.5 rounded">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
              {flatItems.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px] text-slate-500">
                  {isSearchingEntities ? 'Searching workspace data...' : 'No results found'}
                </p>
              )}
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 py-1.5 text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                    {group}
                  </p>
                  {items.map((item) => {
                    itemIndex++;
                    const isActive = itemIndex === activeIndex;
                    const idx = itemIndex;
                    return (
                      <button
                        key={item.id}
                        data-active={isActive}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={item.onSelect}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                          isActive
                            ? 'bg-white/5 text-slate-100'
                            : 'text-slate-400 hover:bg-white/[0.03]'
                        )}
                      >
                        {/* Avatar for people, dot + icon for entities, plain icon for nav/actions */}
                        {item.avatar ? (
                          <span className="size-[24px] shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium text-slate-300 overflow-hidden">
                            {item.avatar.src ? (
                              <img
                                src={item.avatar.src}
                                alt={item.avatar.initials}
                                className="size-full object-cover"
                              />
                            ) : (
                              item.avatar.initials
                            )}
                          </span>
                        ) : item.dotColor ? (
                          <span className="flex items-center gap-2 shrink-0">
                            <span className={cn('size-[8px] rounded-full', item.dotColor)} />
                            <item.icon className="size-[16px] text-slate-500" />
                          </span>
                        ) : (
                          <item.icon className="size-[18px] shrink-0" />
                        )}

                        {/* Label + subtitle */}
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13px] truncate">{item.label}</span>
                          {item.subtitle && (
                            <span className="block text-[11px] text-slate-500 truncate">
                              {item.subtitle}
                            </span>
                          )}
                        </span>

                        {item.shortcut && (
                          <kbd className="text-[10px] font-mono text-slate-600 border border-neutral-border px-1.5 py-0.5 rounded">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-border">
              <div className="flex items-center gap-1 text-[10px] text-slate-600">
                <kbd className="font-mono border border-neutral-border px-1 py-0.5 rounded">
                  &uarr;&darr;
                </kbd>
                <span>navigate</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-600">
                <kbd className="font-mono border border-neutral-border px-1 py-0.5 rounded">
                  &crarr;
                </kbd>
                <span>select</span>
              </div>
              {query.trim() && (
                <span className="ml-auto text-[10px] text-slate-600">
                  {flatItems.length} result{flatItems.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
