"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  Plus,
  ChevronDown,
  Calendar,
  Search,
  X,
  Timer,
  TrendingUp,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Trash2,
  Play,
  Pause,
  Square,
  Download,
  Table2,
  List,
  DollarSign,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimeTrackingData } from "@/hooks/use-time-tracking-data";
import type { TimeTrackingEntry } from "@/hooks/use-time-tracking-data";

// ============================================================
// TYPES
// ============================================================

type DateRange = "this-week" | "last-week" | "this-month" | "custom";
type ViewMode = "list" | "timesheet";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "this-week": "This Week",
  "last-week": "Last Week",
  "this-month": "This Month",
  custom: "Custom",
};

// ============================================================
// HELPERS
// ============================================================

function getWeekDays(baseDate: Date, offset: number = 0): Date[] {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offset * 7);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function getMonthRange(baseDate: Date): [Date, Date] {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return [start, end];
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function fmtDayNum(d: Date): string {
  return d.getDate().toString();
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h.toString().padStart(2, "0"),
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0"),
  ].join(":");
}

// ============================================================
// MAIN LAYOUT
// ============================================================

export function TimeTrackingLayout() {
  // Filters
  const [dateRange, setDateRange] = useState<DateRange>("this-week");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [showLogModal, setShowLogModal] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const now = useMemo(() => new Date(), []);

  // Compute date window
  const dateWindow = useMemo<[Date, Date]>(() => {
    if (dateRange === "this-week") {
      const days = getWeekDays(now, 0);
      return [days[0], days[6]];
    }
    if (dateRange === "last-week") {
      const days = getWeekDays(now, -1);
      return [days[0], days[6]];
    }
    if (dateRange === "this-month") {
      return getMonthRange(now);
    }
    // custom defaults to this week
    const days = getWeekDays(now, 0);
    return [days[0], days[6]];
  }, [dateRange, now]);

  const weekDays = useMemo(() => {
    if (dateRange === "this-week") return getWeekDays(now, 0);
    if (dateRange === "last-week") return getWeekDays(now, -1);
    // For month view, still show current week grid
    return getWeekDays(now, 0);
  }, [dateRange, now]);

  const timeTrackingData = useTimeTrackingData(dateWindow[0], dateWindow[1]);
  const allTasks = useMemo(() => timeTrackingData.tasks, [timeTrackingData.tasks]);
  const allProjects = useMemo(() => timeTrackingData.projects, [timeTrackingData.projects]);
  const users = useMemo(() => timeTrackingData.users, [timeTrackingData.users]);

  const getUser = useCallback(
    (userId: string) => users.find((user) => user.id === userId),
    [users],
  );

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const [start, end] = dateWindow;
    const startStr = fmt(start);
    const endStr = fmt(end);
    return timeTrackingData.entries.filter((e) => {
      if (e.date < startStr || e.date > endStr) return false;
      if (memberFilter !== "all" && e.userId !== memberFilter) return false;
      if (projectFilter !== "all") {
        const task = allTasks.find((t) => t.id === e.taskId);
        const projectId = e.projectId ?? task?.projectId ?? null;
        if (!projectId || projectId !== projectFilter) return false;
      }
      return true;
    });
  }, [timeTrackingData.entries, dateWindow, memberFilter, projectFilter, allTasks]);

  // ---- Summary stats ----
  const totalHours = useMemo(
    () => filteredEntries.reduce((s, e) => s + e.hours, 0),
    [filteredEntries],
  );

  const todayStr = fmt(now);
  const todayHours = useMemo(
    () =>
      timeTrackingData.entries
        .filter((e) => e.date === todayStr)
        .reduce((s, e) => s + e.hours, 0),
    [timeTrackingData.entries, todayStr],
  );

  const daysInRange = useMemo(() => {
    const [start, end] = dateWindow;
    const diff =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  }, [dateWindow]);

  const avgPerDay = totalHours / daysInRange;

  const billableHours = useMemo(
    () =>
      filteredEntries
        .filter((entry) => entry.isBillable)
        .reduce((sum, entry) => sum + entry.hours, 0),
    [filteredEntries],
  );

  const billableRatio = useMemo(
    () => (totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0),
    [billableHours, totalHours],
  );

  // ---- Timesheet grid data ----
  const timesheetRows = useMemo(() => {
    const taskMap = new Map<
      string,
      { taskId: string; title: string; projectName: string; byDay: Record<string, number> }
    >();
    for (const entry of filteredEntries) {
      if (!taskMap.has(entry.taskId)) {
        const task = allTasks.find((t) => t.id === entry.taskId);
        const project = task?.projectId
          ? allProjects.find((p) => p.id === task.projectId)
          : null;
        taskMap.set(entry.taskId, {
          taskId: entry.taskId,
          title: task?.title ?? entry.taskId,
          projectName: project?.name ?? "No Project",
          byDay: {},
        });
      }
      const row = taskMap.get(entry.taskId)!;
      const key = entry.date;
      row.byDay[key] = (row.byDay[key] ?? 0) + entry.hours;
    }
    return Array.from(taskMap.values());
  }, [filteredEntries, allTasks, allProjects]);

  // Column totals
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const day of weekDays) {
      const key = fmt(day);
      totals[key] = timesheetRows.reduce((s, row) => s + (row.byDay[key] ?? 0), 0);
    }
    return totals;
  }, [timesheetRows, weekDays]);

  // ---- Recent entries (sorted desc) ----
  const recentEntries = useMemo(() => {
    return [...filteredEntries].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [filteredEntries]);

  // ---- Team overview ----
  const teamOverview = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredEntries) {
      map.set(e.userId, (map.get(e.userId) ?? 0) + e.hours);
    }
    return users
      .map((u) => ({ user: u, hours: map.get(u.id) ?? 0 }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredEntries, users]);

  const maxTeamHours = useMemo(
    () => Math.max(...teamOverview.map((t) => t.hours), 1),
    [teamOverview],
  );

  const isLoading =
    timeTrackingData.entriesQuery.isLoading ||
    timeTrackingData.tasksQuery.isLoading ||
    timeTrackingData.projectsQuery.isLoading ||
    timeTrackingData.membersQuery.isLoading;

  const isError =
    timeTrackingData.entriesQuery.isError ||
    timeTrackingData.tasksQuery.isError ||
    timeTrackingData.projectsQuery.isError ||
    timeTrackingData.membersQuery.isError;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark">
      {/* ---- TOOLBAR ---- */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-neutral-border bg-neutral-surface/30">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range */}
          <div className="relative">
            <button
              onClick={() => {
                setDateDropdownOpen(!dateDropdownOpen);
                setMemberDropdownOpen(false);
                setProjectDropdownOpen(false);
              }}
              className="h-8 px-3 flex items-center gap-2 text-[13px] text-slate-300 bg-white/[0.04] border border-neutral-border rounded-sm hover:bg-white/[0.07] transition-colors"
            >
              <Calendar className="size-3.5 text-slate-500" />
              {DATE_RANGE_LABELS[dateRange]}
              <ChevronDown className="size-3 text-slate-500" />
            </button>
            {dateDropdownOpen && (
              <DropdownMenu
                items={Object.entries(DATE_RANGE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                selected={dateRange}
                onSelect={(v) => {
                  setDateRange(v as DateRange);
                  setDateDropdownOpen(false);
                }}
                onClose={() => setDateDropdownOpen(false)}
              />
            )}
          </div>

          {/* Member filter */}
          <div className="relative">
            <button
              onClick={() => {
                setMemberDropdownOpen(!memberDropdownOpen);
                setDateDropdownOpen(false);
                setProjectDropdownOpen(false);
              }}
              className="h-8 px-3 flex items-center gap-2 text-[13px] text-slate-300 bg-white/[0.04] border border-neutral-border rounded-sm hover:bg-white/[0.07] transition-colors"
            >
              <Users className="size-3.5 text-slate-500" />
              {memberFilter === "all"
                ? "All Members"
                : getUser(memberFilter)?.name ?? "Unknown"}
              <ChevronDown className="size-3 text-slate-500" />
            </button>
            {memberDropdownOpen && (
              <DropdownMenu
                items={[
                  { value: "all", label: "All Members" },
                  ...users.map((u) => ({ value: u.id, label: u.name })),
                ]}
                selected={memberFilter}
                onSelect={(v) => {
                  setMemberFilter(v);
                  setMemberDropdownOpen(false);
                }}
                onClose={() => setMemberDropdownOpen(false)}
              />
            )}
          </div>

          {/* Project filter */}
          <div className="relative">
            <button
              onClick={() => {
                setProjectDropdownOpen(!projectDropdownOpen);
                setDateDropdownOpen(false);
                setMemberDropdownOpen(false);
              }}
              className="h-8 px-3 flex items-center gap-2 text-[13px] text-slate-300 bg-white/[0.04] border border-neutral-border rounded-sm hover:bg-white/[0.07] transition-colors"
            >
              <FileText className="size-3.5 text-slate-500" />
              {projectFilter === "all"
                ? "All Projects"
                : allProjects.find((p) => p.id === projectFilter)?.name ??
                  "Unknown"}
              <ChevronDown className="size-3 text-slate-500" />
            </button>
            {projectDropdownOpen && (
              <DropdownMenu
                items={[
                  { value: "all", label: "All Projects" },
                  ...allProjects.map((p) => ({ value: p.id, label: p.name })),
                ]}
                selected={projectFilter}
                onSelect={(v) => {
                  setProjectFilter(v);
                  setProjectDropdownOpen(false);
                }}
                onClose={() => setProjectDropdownOpen(false)}
              />
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center border border-neutral-border rounded-sm overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "h-8 w-8 flex items-center justify-center transition-colors",
                viewMode === "list"
                  ? "bg-primary/20 text-primary"
                  : "bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.07]",
              )}
              title="List view"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode("timesheet")}
              className={cn(
                "h-8 w-8 flex items-center justify-center transition-colors border-l border-neutral-border",
                viewMode === "timesheet"
                  ? "bg-primary/20 text-primary"
                  : "bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.07]",
              )}
              title="Timesheet view"
            >
              <Table2 className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export */}
          <button
            onClick={() => timeTrackingData.exportEntries(filteredEntries)}
            className="h-8 px-3 flex items-center gap-2 text-[13px] text-slate-300 bg-white/[0.04] border border-neutral-border rounded-sm hover:bg-white/[0.07] transition-colors"
            title="Export CSV"
          >
            <Download className="size-3.5 text-slate-500" />
            Export
          </button>

          {/* Log time */}
          <button
            onClick={() => setShowLogModal(true)}
            disabled={!timeTrackingData.currentUser}
            className="h-8 px-3 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-[13px] font-medium rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="size-3.5" />
            Log Time
          </button>
        </div>
      </div>

      {/* ---- SCROLLABLE CONTENT ---- */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <div className="text-[13px] font-medium text-slate-400">
                Loading time entries...
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex max-w-sm flex-col items-center gap-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10">
                <AlertTriangle className="size-8 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-slate-200">
                  Time tracking failed to load
                </h3>
                <p className="text-[13px] text-slate-400">
                  We could not load live time entries for this workspace.
                </p>
              </div>
              <button
                onClick={() =>
                  void Promise.all([
                    timeTrackingData.entriesQuery.refetch(),
                    timeTrackingData.tasksQuery.refetch(),
                    timeTrackingData.projectsQuery.refetch(),
                    timeTrackingData.membersQuery.refetch(),
                  ])
                }
                className="flex h-9 items-center gap-2 rounded-sm border border-white/[0.1] bg-white/[0.05] px-4 text-[13px] font-medium text-slate-200 transition-colors hover:bg-white/[0.1]"
              >
                <RefreshCcw className="size-4" />
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ---- RUNNING TIMER WIDGET ---- */}
            {timeTrackingData.currentUser && (
              <TimerWidget
                timer={timeTrackingData.timer}
                tasks={allTasks}
                projects={allProjects}
                onStart={timeTrackingData.startTimer}
                onPause={timeTrackingData.pauseTimer}
                onResume={timeTrackingData.resumeTimer}
                onStop={timeTrackingData.stopTimer}
              />
            )}

            {/* ---- STATS BAR ---- */}
            <StatsBar
              totalHours={totalHours}
              billableHours={billableHours}
              nonBillableHours={totalHours - billableHours}
              billablePct={billableRatio}
              tasksTracked={new Set(filteredEntries.map((e) => e.taskId)).size}
              avgHoursPerDay={avgPerDay}
              todayHours={todayHours}
              dateRangeLabel={DATE_RANGE_LABELS[dateRange]}
              todayLabel={fmtShort(now)}
              daysInRange={daysInRange}
            />

            {/* ---- VIEW-SPECIFIC CONTENT ---- */}
            {viewMode === "timesheet" ? (
              /* ---- WEEKLY TIMESHEET ---- */
              <section>
                <h3 className="text-[13px] font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Table2 className="size-4 text-primary" />
                  Weekly Timesheet
                </h3>
                <div className="border border-neutral-border rounded-sm overflow-hidden bg-neutral-surface/40">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-neutral-border">
                          <th className="text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider px-4 py-2.5 w-[260px]">
                            Task
                          </th>
                          {weekDays.map((d) => (
                            <th
                              key={fmt(d)}
                              className={cn(
                                "text-center text-[11px] font-medium uppercase tracking-wider px-2 py-2.5 w-[72px]",
                                fmt(d) === todayStr ? "text-primary" : "text-slate-500",
                              )}
                            >
                              <div>{fmtDay(d)}</div>
                              <div className="text-[10px] font-normal">{fmtDayNum(d)}</div>
                            </th>
                          ))}
                          <th className="text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider px-3 py-2.5 w-[72px]">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {timesheetRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={weekDays.length + 2}
                              className="text-center text-[13px] text-slate-500 py-10"
                            >
                              No time entries for this period
                            </td>
                          </tr>
                        ) : (
                          timesheetRows.map((row) => {
                            const rowTotal = Object.values(row.byDay).reduce(
                              (s, h) => s + h,
                              0,
                            );
                            return (
                              <tr
                                key={row.taskId}
                                className="border-b border-neutral-border/50 hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-4 py-2.5">
                                  <div className="text-[13px] text-slate-200 truncate max-w-[240px]">
                                    {row.title}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {row.projectName}
                                  </div>
                                </td>
                                {weekDays.map((d) => {
                                  const key = fmt(d);
                                  const hrs = row.byDay[key] ?? 0;
                                  return (
                                    <td key={key} className="text-center px-2 py-2.5">
                                      {hrs > 0 ? (
                                        <span
                                          className={cn(
                                            "inline-flex items-center justify-center min-w-[36px] h-7 rounded-sm text-[13px] font-mono font-medium",
                                            hrs >= 10
                                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                              : hrs >= 8
                                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                              : "bg-white/[0.04] text-slate-300 border border-neutral-border/50",
                                          )}
                                        >
                                          {hrs}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center justify-center min-w-[36px] h-7 text-[13px] text-slate-700 hover:text-slate-500 cursor-pointer transition-colors">
                                          —
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="text-center px-3 py-2.5">
                                  <span className="text-[13px] font-mono font-semibold text-slate-200">
                                    {rowTotal.toFixed(1)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {timesheetRows.length > 0 && (
                        <tfoot>
                          <tr className="bg-white/[0.02]">
                            <td className="px-4 py-2.5 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                              Daily Total
                            </td>
                            {weekDays.map((d) => {
                              const key = fmt(d);
                              const dayTotal = columnTotals[key] ?? 0;
                              return (
                                <td key={key} className="text-center px-2 py-2.5">
                                  <span
                                    className={cn(
                                      "text-[13px] font-mono font-semibold",
                                      dayTotal > 10
                                        ? "text-rose-400"
                                        : dayTotal > 8
                                        ? "text-amber-400"
                                        : dayTotal > 0
                                        ? "text-slate-300"
                                        : "text-slate-600",
                                    )}
                                  >
                                    {dayTotal > 0 ? dayTotal.toFixed(1) : "—"}
                                  </span>
                                  {dayTotal > 8 && (
                                    <AlertTriangle className="size-3 text-amber-500 inline ml-1" />
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center px-3 py-2.5">
                              <span className="text-[13px] font-mono font-bold text-primary">
                                {totalHours.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                          <tr className="bg-white/[0.01] border-t border-neutral-border/50">
                            <td
                              colSpan={weekDays.length + 2}
                              className="px-4 py-2 text-[12px] text-slate-500"
                            >
                              Total hours this week:{" "}
                              <span className="font-semibold text-slate-300">
                                {totalHours.toFixed(1)}h
                              </span>
                              {" "}· Billable:{" "}
                              <span className="font-semibold text-emerald-400">
                                {billableHours.toFixed(1)}h
                              </span>
                              {" "}({billableRatio}%)
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </section>
            ) : (
              /* ---- LIST VIEW ---- */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent entries with inline editing */}
                <section>
                  <h3 className="text-[13px] font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Recent Time Entries
                  </h3>
                  <div className="border border-neutral-border rounded-sm bg-neutral-surface/40 divide-y divide-neutral-border/50 max-h-[400px] overflow-y-auto">
                    {recentEntries.length === 0 ? (
                      <div className="text-center text-[13px] text-slate-500 py-10">
                        No entries for this period
                      </div>
                    ) : (
                      recentEntries.map((entry) => {
                        const task = allTasks.find((t) => t.id === entry.taskId);
                        const projectId = entry.projectId ?? task?.projectId;
                        const project = projectId
                          ? allProjects.find((p) => p.id === projectId)
                          : null;
                        const user = getUser(entry.userId);
                        const isOwn =
                          timeTrackingData.currentUser?.id === entry.userId;
                        return (
                          <InlineEntryRow
                            key={entry.id}
                            entry={entry}
                            taskTitle={task?.title ?? entry.taskId}
                            projectName={project?.name ?? "No Project"}
                            userInitials={user?.initials ?? "?"}
                            userName={user?.name ?? "Unknown"}
                            isOwn={isOwn}
                            isUpdating={timeTrackingData.isUpdatingTimeEntry}
                            isDeleting={timeTrackingData.isDeletingTimeEntry}
                            onUpdate={(patch) =>
                              timeTrackingData.updateTimeEntry(entry.id, entry, patch)
                            }
                            onDelete={() => timeTrackingData.deleteTimeEntry(entry.id)}
                          />
                        );
                      })
                    )}
                  </div>
                </section>

                {/* Team overview */}
                <section>
                  <h3 className="text-[13px] font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    Team Overview
                  </h3>
                  <div className="border border-neutral-border rounded-sm bg-neutral-surface/40 p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {teamOverview.map((item) => {
                      const pct =
                        maxTeamHours > 0 ? (item.hours / maxTeamHours) * 100 : 0;
                      return (
                        <div key={item.user.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="size-6 rounded-full bg-slate-700 border border-neutral-border flex items-center justify-center text-[9px] font-semibold text-slate-300">
                                {item.user.initials}
                              </div>
                              <span className="text-[13px] text-slate-200">
                                {item.user.name}
                              </span>
                            </div>
                            <span className="text-[12px] font-mono font-semibold text-slate-300">
                              {item.hours.toFixed(1)}h
                            </span>
                          </div>
                          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-primary/70"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {teamOverview.every((t) => t.hours === 0) && (
                      <div className="text-center text-[13px] text-slate-500 py-6">
                        No hours logged this period
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>

      {/* ---- LOG TIME MODAL ---- */}
      <AnimatePresence>
        {showLogModal && timeTrackingData.currentUser && (
          <LogTimeModal
            onClose={() => setShowLogModal(false)}
            onSave={async (data) => {
              await timeTrackingData.createTimeEntry(data);
              setShowLogModal(false);
            }}
            tasks={allTasks}
            currentUser={timeTrackingData.currentUser}
            isSaving={timeTrackingData.isCreatingTimeEntry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// TIMER WIDGET
// ============================================================

interface TimerWidgetProps {
  timer: ReturnType<typeof useTimeTrackingData>["timer"];
  tasks: { id: string; title: string; projectId?: string | null }[];
  projects: { id: string; name: string }[];
  onStart: (taskId: string, description: string, isBillable: boolean) => Promise<void>;
  onPause: () => void;
  onResume: () => void;
  onStop: () => Promise<void>;
}

function TimerWidget({
  timer,
  tasks,
  projects,
  onStart,
  onPause,
  onResume,
  onStop,
}: TimerWidgetProps) {
  const [taskId, setTaskId] = useState(timer.taskId ?? "");
  const [description, setDescription] = useState(timer.description ?? "");
  const [isBillable, setIsBillable] = useState(timer.isBillable ?? false);
  const [taskSearch, setTaskSearch] = useState("");
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Sync task from timer state when it changes externally
  useEffect(() => {
    if (timer.state !== "idle") {
      setTaskId(timer.taskId ?? "");
      setDescription(timer.description ?? "");
      setIsBillable(timer.isBillable ?? false);
    }
  }, [timer.state, timer.taskId, timer.description, timer.isBillable]);

  const selectedTask = tasks.find((t) => t.id === taskId);
  const autoProject = selectedTask?.projectId
    ? projects.find((p) => p.id === selectedTask.projectId)
    : null;

  const filteredTasks = useMemo(() => {
    const q = taskSearch.toLowerCase();
    if (!q) return tasks.slice(0, 20);
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, taskSearch]);

  const isIdle = timer.state === "idle";
  const isRunning = timer.state === "running";
  const isPaused = timer.state === "paused";

  const handleStart = async () => {
    if (!taskId) return;
    await onStart(taskId, description, isBillable);
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await onStop();
    } finally {
      setIsStopping(false);
      setTaskId("");
      setDescription("");
      setIsBillable(false);
      setTaskSearch("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "border rounded-sm p-4 transition-colors",
        isRunning
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isPaused
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-neutral-border bg-neutral-surface/40",
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        {/* Active indicator + timer display */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isRunning && (
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-400" />
            </span>
          )}
          {isPaused && (
            <span className="relative flex size-2.5">
              <span className="relative inline-flex rounded-full size-2.5 bg-amber-400" />
            </span>
          )}
          {isIdle && <Timer className="size-4 text-slate-500" />}

          <span
            className={cn(
              "font-mono text-2xl font-bold tracking-widest leading-none tabular-nums",
              isRunning
                ? "text-emerald-400"
                : isPaused
                ? "text-amber-400"
                : "text-slate-600",
            )}
          >
            {formatElapsed(timer.elapsedSeconds)}
          </span>
        </div>

        {/* Task selector */}
        <div className="relative flex-1 min-w-[180px]">
          <div
            className={cn(
              "flex items-center h-8 bg-white/[0.03] border rounded-sm overflow-hidden",
              !isIdle ? "border-white/[0.06] opacity-60 pointer-events-none" : "border-neutral-border",
            )}
          >
            <Search className="size-3.5 text-slate-500 ml-2.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Select task..."
              value={selectedTask ? selectedTask.title : taskSearch}
              onChange={(e) => {
                setTaskSearch(e.target.value);
                setTaskId("");
                setShowTaskDropdown(true);
              }}
              onFocus={() => setShowTaskDropdown(true)}
              disabled={!isIdle}
              className="flex-1 h-full bg-transparent px-2 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none"
            />
            {taskId && isIdle && (
              <button
                onClick={() => {
                  setTaskId("");
                  setTaskSearch("");
                }}
                className="mr-2 text-slate-500 hover:text-slate-300"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          {showTaskDropdown && !taskId && isIdle && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTaskDropdown(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-surface border border-neutral-border rounded-sm shadow-xl z-50 py-1 max-h-40 overflow-y-auto">
                {filteredTasks.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-slate-500">No tasks found</div>
                ) : (
                  filteredTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTaskId(t.id);
                        setTaskSearch("");
                        setShowTaskDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[13px] text-slate-300 hover:bg-white/5 hover:text-slate-200 transition-colors"
                    >
                      {t.title}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Project auto-fill */}
        {autoProject && (
          <div className="text-[12px] text-slate-500 flex-shrink-0 hidden sm:block">
            <span className="text-slate-600">Project:</span>{" "}
            <span className="text-slate-400">{autoProject.name}</span>
          </div>
        )}

        {/* Description */}
        <input
          type="text"
          placeholder="Description (optional)"
          value={isIdle ? description : timer.description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isIdle}
          className={cn(
            "h-8 flex-1 min-w-[140px] bg-white/[0.03] border border-neutral-border rounded-sm px-3 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary/50 transition-colors",
            !isIdle && "opacity-60 pointer-events-none",
          )}
        />

        {/* Billable toggle */}
        <label className={cn("flex items-center gap-1.5 text-[12px] text-slate-400 flex-shrink-0 cursor-pointer", !isIdle && "opacity-60 pointer-events-none")}>
          <input
            type="checkbox"
            checked={isIdle ? isBillable : timer.isBillable}
            onChange={(e) => setIsBillable(e.target.checked)}
            disabled={!isIdle}
            className="size-3.5 rounded border-neutral-border bg-white/[0.03] text-primary focus:ring-primary/50"
          />
          <DollarSign className="size-3 text-slate-500" />
          Billable
        </label>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isIdle && (
            <button
              onClick={() => void handleStart()}
              disabled={!taskId}
              className="h-8 px-3 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-medium rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="size-3.5" />
              Start
            </button>
          )}
          {isRunning && (
            <>
              <button
                onClick={onPause}
                className="h-8 px-3 flex items-center gap-1.5 bg-amber-600/80 hover:bg-amber-600 text-white text-[13px] font-medium rounded-sm transition-colors"
              >
                <Pause className="size-3.5" />
                Pause
              </button>
              <button
                onClick={() => void handleStop()}
                disabled={isStopping}
                className="h-8 px-3 flex items-center gap-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-[13px] font-medium rounded-sm transition-colors disabled:opacity-60"
              >
                <Square className="size-3.5" />
                {isStopping ? "Saving..." : "Stop"}
              </button>
            </>
          )}
          {isPaused && (
            <>
              <button
                onClick={onResume}
                className="h-8 px-3 flex items-center gap-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-[13px] font-medium rounded-sm transition-colors"
              >
                <Play className="size-3.5" />
                Resume
              </button>
              <button
                onClick={() => void handleStop()}
                disabled={isStopping}
                className="h-8 px-3 flex items-center gap-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-[13px] font-medium rounded-sm transition-colors disabled:opacity-60"
              >
                <Square className="size-3.5" />
                {isStopping ? "Saving..." : "Stop"}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// STATS BAR
// ============================================================

function StatsBar({
  totalHours,
  billableHours,
  nonBillableHours,
  billablePct,
  tasksTracked,
  avgHoursPerDay,
  todayHours,
  dateRangeLabel,
  todayLabel,
  daysInRange,
}: {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePct: number;
  tasksTracked: number;
  avgHoursPerDay: number;
  todayHours: number;
  dateRangeLabel: string;
  todayLabel: string;
  daysInRange: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatPill
        label="Total Hours"
        value={totalHours.toFixed(1) + "h"}
        sub={dateRangeLabel}
        color="primary"
        icon={<Clock className="size-3.5 text-primary" />}
      />
      <StatPill
        label="Billable"
        value={billableHours.toFixed(1) + "h"}
        sub={`${billablePct}% of total`}
        color="emerald"
        icon={<DollarSign className="size-3.5 text-emerald-400" />}
      />
      <StatPill
        label="Non-Billable"
        value={nonBillableHours.toFixed(1) + "h"}
        sub={`${100 - billablePct}% of total`}
        color="slate"
        icon={<FileText className="size-3.5 text-slate-400" />}
      />
      <StatPill
        label="Tasks Tracked"
        value={tasksTracked.toString()}
        sub="unique tasks"
        color="sky"
        icon={<BarChart3 className="size-3.5 text-sky-400" />}
      />
      <StatPill
        label="Avg / Day"
        value={avgHoursPerDay.toFixed(1) + "h"}
        sub={`over ${daysInRange} days`}
        color="amber"
        icon={<TrendingUp className="size-3.5 text-amber-400" />}
      />
      <StatPill
        label="Today"
        value={todayHours.toFixed(1) + "h"}
        sub={todayLabel}
        color="violet"
        icon={<Timer className="size-3.5 text-violet-400" />}
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: "primary" | "emerald" | "slate" | "sky" | "amber" | "violet";
  icon: React.ReactNode;
}) {
  const borderMap: Record<string, string> = {
    primary: "border-primary/20",
    emerald: "border-emerald-500/20",
    slate: "border-white/[0.06]",
    sky: "border-sky-500/20",
    amber: "border-amber-500/20",
    violet: "border-violet-500/20",
  };
  const bgMap: Record<string, string> = {
    primary: "bg-primary/5",
    emerald: "bg-emerald-500/5",
    slate: "bg-white/[0.02]",
    sky: "bg-sky-500/5",
    amber: "bg-amber-500/5",
    violet: "bg-violet-500/5",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("border rounded-sm px-3 py-2.5", borderMap[color], bgMap[color])}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
          {label}
        </span>
        {icon}
      </div>
      <div className="text-lg font-bold font-mono text-slate-100 leading-none">{value}</div>
      <div className="text-[10px] text-slate-600 mt-0.5 truncate">{sub}</div>
    </motion.div>
  );
}

// ============================================================
// INLINE ENTRY ROW
// ============================================================

interface InlineEntryRowProps {
  entry: TimeTrackingEntry;
  taskTitle: string;
  projectName: string;
  userInitials: string;
  userName: string;
  isOwn: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onUpdate: (patch: { hours?: number; description?: string; isBillable?: boolean }) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}

function InlineEntryRow({
  entry,
  taskTitle,
  projectName,
  userInitials,
  userName,
  isOwn,
  isUpdating,
  isDeleting,
  onUpdate,
  onDelete,
}: InlineEntryRowProps) {
  const [editingHours, setEditingHours] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [hoursVal, setHoursVal] = useState(entry.hours.toString());
  const [descVal, setDescVal] = useState(entry.description ?? "");
  const [savedFlash, setSavedFlash] = useState(false);
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLInputElement>(null);

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const commitHours = async () => {
    const parsed = parseFloat(hoursVal);
    if (!isNaN(parsed) && parsed > 0 && parsed !== entry.hours) {
      await onUpdate({ hours: parsed });
      flashSaved();
    }
    setEditingHours(false);
  };

  const commitDesc = async () => {
    if (descVal !== (entry.description ?? "")) {
      await onUpdate({ description: descVal });
      flashSaved();
    }
    setEditingDesc(false);
  };

  const handleHoursKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void commitHours();
    if (e.key === "Escape") {
      setHoursVal(entry.hours.toString());
      setEditingHours(false);
    }
  };

  const handleDescKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void commitDesc();
    if (e.key === "Escape") {
      setDescVal(entry.description ?? "");
      setEditingDesc(false);
    }
  };

  useEffect(() => {
    if (editingHours) hoursInputRef.current?.focus();
  }, [editingHours]);
  useEffect(() => {
    if (editingDesc) descInputRef.current?.focus();
  }, [editingDesc]);

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
      {/* Avatar */}
      <div className="size-7 rounded-full bg-slate-700 border border-neutral-border flex items-center justify-center flex-shrink-0 text-[10px] font-semibold text-slate-300 mt-0.5">
        {userInitials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-slate-200 truncate">{taskTitle}</span>

          {/* Editable hours */}
          {editingHours ? (
            <input
              ref={hoursInputRef}
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              value={hoursVal}
              onChange={(e) => setHoursVal(e.target.value)}
              onBlur={() => void commitHours()}
              onKeyDown={handleHoursKeyDown}
              className="w-16 h-6 bg-neutral-surface border border-primary/50 rounded-sm px-1.5 text-[12px] text-slate-100 font-mono outline-none"
            />
          ) : (
            <button
              onClick={() => {
                if (!isOwn) return;
                setHoursVal(entry.hours.toString());
                setEditingHours(true);
              }}
              title={isOwn ? "Click to edit hours" : undefined}
              className={cn(
                "text-[12px] font-mono font-semibold text-primary ml-auto flex-shrink-0",
                isOwn && "hover:underline cursor-pointer",
              )}
            >
              {entry.hours}h
            </button>
          )}

          {/* Save flash */}
          <AnimatePresence>
            {savedFlash && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 text-[11px] text-emerald-400"
              >
                <Check className="size-3" /> Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-slate-500">{projectName}</span>
          <span className="text-[11px] text-slate-600">·</span>
          <span className="text-[11px] text-slate-500">{userName}</span>
          <span className="text-[11px] text-slate-600">·</span>
          <span className="text-[11px] text-slate-500">{entry.date}</span>

          {/* Billable toggle */}
          {isOwn && (
            <>
              <span className="text-[11px] text-slate-600">·</span>
              <button
                onClick={() => void onUpdate({ isBillable: !entry.isBillable }).then(flashSaved)}
                disabled={isUpdating}
                className={cn(
                  "text-[11px] flex items-center gap-0.5 transition-colors",
                  entry.isBillable ? "text-emerald-400 hover:text-emerald-300" : "text-slate-600 hover:text-slate-400",
                )}
                title="Toggle billable"
              >
                <DollarSign className="size-2.5" />
                {entry.isBillable ? "Billable" : "Non-billable"}
              </button>
            </>
          )}
        </div>

        {/* Editable description */}
        {editingDesc ? (
          <input
            ref={descInputRef}
            type="text"
            value={descVal}
            onChange={(e) => setDescVal(e.target.value)}
            onBlur={() => void commitDesc()}
            onKeyDown={handleDescKeyDown}
            placeholder="Add description..."
            className="mt-1 w-full h-6 bg-neutral-surface border border-primary/50 rounded-sm px-1.5 text-[12px] text-slate-200 outline-none"
          />
        ) : (
          <p
            onClick={() => {
              if (!isOwn) return;
              setDescVal(entry.description ?? "");
              setEditingDesc(true);
            }}
            title={isOwn ? "Click to edit description" : undefined}
            className={cn(
              "text-[12px] text-slate-400 mt-1 truncate",
              isOwn && "cursor-pointer hover:text-slate-200 transition-colors",
              !entry.description && isOwn && "text-slate-600 italic",
            )}
          >
            {entry.description || (isOwn ? "Add description..." : "")}
          </p>
        )}
      </div>

      {/* Delete button */}
      {isOwn && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (!window.confirm("Delete this time entry?")) return;
            await onDelete();
          }}
          disabled={isDeleting}
          className="mt-0.5 flex size-7 items-center justify-center rounded-sm border border-neutral-border text-slate-500 transition-colors hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
          aria-label="Delete time entry"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ============================================================
// DROPDOWN MENU
// ============================================================

function DropdownMenu({
  items,
  selected,
  onSelect,
  onClose,
}: {
  items: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full left-0 mt-1 w-52 bg-neutral-surface border border-neutral-border rounded-sm shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={cn(
              "w-full text-left px-3 py-1.5 text-[13px] transition-colors",
              item.value === selected
                ? "bg-primary/10 text-primary"
                : "text-slate-300 hover:bg-white/5 hover:text-slate-200",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ============================================================
// LOG TIME MODAL
// ============================================================

function LogTimeModal({
  onClose,
  onSave,
  tasks,
  currentUser,
  isSaving = false,
}: {
  onClose: () => void;
  onSave: (data: {
    taskId: string;
    date: string;
    hours: number;
    description?: string;
    isBillable?: boolean;
  }) => Promise<void>;
  tasks: { id: string; title: string }[];
  currentUser: { id: string; name: string };
  isSaving?: boolean;
}) {
  const [taskSearch, setTaskSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  const filteredTasks = useMemo(() => {
    if (!taskSearch) return tasks.slice(0, 20);
    const q = taskSearch.toLowerCase();
    return tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q),
    );
  }, [tasks, taskSearch]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const canSave = selectedTaskId && date && hours && parseFloat(hours) > 0;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    await onSave({
      taskId: selectedTaskId,
      date,
      hours: parseFloat(hours),
      description: description || undefined,
      isBillable,
    });
  }, [canSave, date, description, hours, isBillable, onSave, selectedTaskId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-neutral-surface border border-neutral-border rounded-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Clock className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-slate-100">Log Time</h2>
              <p className="text-[11px] text-slate-500">Logging as {currentUser.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-sm transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Task selector */}
          <div>
            <label className="block text-[12px] font-medium text-slate-400 mb-1.5">Task</label>
            <div className="relative">
              <div className="flex items-center h-9 bg-white/[0.03] border border-neutral-border rounded-sm overflow-hidden">
                <Search className="size-3.5 text-slate-500 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={selectedTask ? selectedTask.title : taskSearch}
                  onChange={(e) => {
                    setTaskSearch(e.target.value);
                    setSelectedTaskId("");
                    setShowTaskDropdown(true);
                  }}
                  onFocus={() => setShowTaskDropdown(true)}
                  className="flex-1 h-full bg-transparent px-2 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none"
                />
                {selectedTaskId && (
                  <button
                    onClick={() => {
                      setSelectedTaskId("");
                      setTaskSearch("");
                    }}
                    className="mr-2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
              {showTaskDropdown && !selectedTaskId && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTaskDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-surface border border-neutral-border rounded-sm shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    {filteredTasks.length === 0 ? (
                      <div className="px-3 py-2 text-[12px] text-slate-500">No tasks found</div>
                    ) : (
                      filteredTasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskId(t.id);
                            setTaskSearch("");
                            setShowTaskDropdown(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-[13px] text-slate-300 hover:bg-white/5 hover:text-slate-200 transition-colors"
                        >
                          <span className="text-slate-500 text-[11px] font-mono mr-2">{t.id}</span>
                          {t.title}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Date & hours row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-400 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 bg-white/[0.03] border border-neutral-border rounded-sm px-3 text-[13px] text-slate-200 outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-400 mb-1.5">Hours</label>
              <input
                type="number"
                min="0.25"
                max="24"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0.0"
                className="w-full h-9 bg-white/[0.03] border border-neutral-border rounded-sm px-3 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary/50 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-medium text-slate-400 mb-1.5">
              Description{" "}
              <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full bg-white/[0.03] border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-[12px] text-slate-300">
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              className="size-4 rounded border-neutral-border bg-white/[0.03] text-primary focus:ring-primary/50"
            />
            Mark as billable
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-border">
          <button
            onClick={onClose}
            className="h-8 px-3 text-[13px] text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!canSave || isSaving}
            className="h-8 px-4 text-[13px] font-medium bg-primary hover:bg-primary/90 text-white rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
