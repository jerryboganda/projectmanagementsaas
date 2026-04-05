export type ReportCategory = "overview" | "delivery" | "workload";
export type TrendDirection = "up" | "down" | "flat";
export type TrendSentiment = "positive" | "negative" | "neutral";

export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  format?: "number" | "percentage" | "currency" | "duration";
  trend: {
    value: string | number;
    direction: TrendDirection;
    sentiment: TrendSentiment;
    label: string;
  };
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface ReportProjectOwner {
  name: string;
  initials: string;
  avatar?: string;
}

export interface ReportProject {
  id: string;
  name: string;
  status: "on-track" | "at-risk" | "off-track" | "completed";
  progress: number;
  owner: ReportProjectOwner;
  dueDate: string;
  healthScore: number;
}

export interface ReportData {
  id: LiveReportId;
  title: string;
  category: ReportCategory;
  description: string;
  lastUpdated: string;
  kpis: KPIMetric[];
  chartData: ChartDataPoint[];
  projects: ReportProject[];
}

export type LiveReportId = "project-health" | "team-velocity" | "workload";
export type PlannedReportId = "goals" | "financial";
export type ReportSidebarId = LiveReportId | PlannedReportId;

export type DateRangePreset =
  | "last-7-days"
  | "last-30-days"
  | "last-90-days"
  | "this-quarter"
  | "this-year"
  | "all-time";

export const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "last-7-days", label: "Last 7 days" },
  { value: "last-30-days", label: "Last 30 days" },
  { value: "last-90-days", label: "Last 90 days" },
  { value: "this-quarter", label: "This quarter" },
  { value: "this-year", label: "This year" },
  { value: "all-time", label: "All time" },
];

export const KPI_DESCRIPTIONS: Record<string, string> = {
  "active-projects": "Total number of tracked projects currently in an active state in this workspace.",
  "task-completion-rate": "Percentage of all tasks that have been completed relative to the total number of tasks.",
  "overdue-open-work": "Count of open tasks whose due date has passed without being completed.",
  "avg-tasks-per-project": "Average number of tasks assigned per project across the workspace.",
  "avg-velocity": "Average story points completed per sprint across all tracked sprints.",
  "completed-points": "Total story points completed across all sprints in the sampled period.",
  "planned-points": "Total story points planned across all sprints in the sampled period.",
  "members-with-work": "Number of team members with at least one assigned task in this workspace.",
  "tasks-assigned": "Total number of tasks currently assigned to team members.",
  "hours-logged": "Total hours logged by all team members across all tasks and projects.",
  "completion-rate": "Percentage of assigned tasks that have been completed by current assignees.",
};

export interface ReportCatalogItem {
  id: LiveReportId;
  label: string;
  category: ReportCategory;
}

export interface PlannedReportCatalogItem {
  id: PlannedReportId;
  label: string;
}

export const LIVE_REPORT_CATALOG: ReportCatalogItem[] = [
  { id: "project-health", label: "Overview", category: "overview" },
  { id: "team-velocity", label: "Delivery", category: "delivery" },
  { id: "workload", label: "Workload", category: "workload" },
];

export const PLANNED_REPORT_CATALOG: PlannedReportCatalogItem[] = [
  { id: "goals", label: "Goals" },
  { id: "financial", label: "Financial" },
];
