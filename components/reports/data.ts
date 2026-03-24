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

export interface ReportCatalogItem {
  id: LiveReportId;
  label: string;
  category: ReportCategory;
}

export const LIVE_REPORT_CATALOG: ReportCatalogItem[] = [
  { id: "project-health", label: "Overview", category: "overview" },
  { id: "team-velocity", label: "Delivery", category: "delivery" },
  { id: "workload", label: "Workload", category: "workload" },
];

export const PLANNED_REPORT_CATALOG = [
  { id: "goals", label: "Goals" },
  { id: "financial", label: "Financial" },
] as const;
