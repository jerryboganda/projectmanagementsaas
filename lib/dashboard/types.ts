export interface DashboardKpi {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  neutral?: boolean;
}

export interface DashboardTaskItem {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "in-review";
  priority: string;
  project: string;
  dueLabel: string;
  dueTone: "danger" | "warning" | "muted";
}

export interface DashboardProjectHealthItem {
  name: string;
  health: "On Track" | "At Risk" | "Off Track";
  progress: number;
  tasks: string;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  snippet?: string | null;
  timeLabel: string;
  tone: "primary" | "success" | "warning" | "neutral";
}
