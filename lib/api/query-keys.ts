export const queryKeys = {
  board: {
    all: ["board"] as const,
    tasks: (workspaceId: string) => ["board", workspaceId, "tasks"] as const,
    task: (workspaceId: string, taskId: string) =>
      ["board", workspaceId, "tasks", taskId] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (workspaceId: string) => ["projects", workspaceId] as const,
    detail: (workspaceId: string, projectId: string) =>
      ["projects", workspaceId, projectId] as const,
  },
  calendar: {
    all: ["calendar"] as const,
    items: (workspaceId: string) =>
      ["calendar", workspaceId, "items"] as const,
  },
  goals: {
    all: ["goals"] as const,
    list: (workspaceId: string) => ["goals", workspaceId] as const,
    detail: (workspaceId: string, goalId: string) =>
      ["goals", workspaceId, goalId] as const,
  },
  sprints: {
    all: ["sprints"] as const,
    list: (workspaceId: string) => ["sprints", workspaceId] as const,
    detail: (workspaceId: string, sprintId: string) =>
      ["sprints", workspaceId, sprintId] as const,
  },
  inbox: {
    all: ["inbox"] as const,
    notifications: (workspaceId: string) =>
      ["inbox", workspaceId, "notifications"] as const,
  },
  docs: {
    all: ["docs"] as const,
    list: (workspaceId: string) => ["docs", workspaceId] as const,
    detail: (workspaceId: string, docId: string) =>
      ["docs", workspaceId, docId] as const,
  },
  reports: {
    all: ["reports"] as const,
    analytics: (workspaceId: string, type: string) =>
      ["reports", workspaceId, type] as const,
  },
  workload: {
    all: ["workload"] as const,
    data: (workspaceId: string) => ["workload", workspaceId] as const,
  },
  timeline: {
    all: ["timeline"] as const,
    data: (workspaceId: string) => ["timeline", workspaceId] as const,
  },
  settings: {
    all: ["settings"] as const,
    workspace: (workspaceId: string) =>
      ["settings", workspaceId] as const,
    profile: ["settings", "profile"] as const,
  },
  workspace: {
    all: ["workspace"] as const,
    members: (workspaceId: string) =>
      ["workspace", workspaceId, "members"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    data: (workspaceId: string) => ["dashboard", workspaceId] as const,
  },
  timeTracking: {
    all: ["time-tracking"] as const,
    entries: (workspaceId: string) =>
      ["time-tracking", workspaceId, "entries"] as const,
  },
  templates: {
    all: ["templates"] as const,
    list: (workspaceId: string) => ["templates", workspaceId] as const,
  },
  intake: {
    all: ["intake"] as const,
    forms: (workspaceId: string) =>
      ["intake", workspaceId, "forms"] as const,
    submissions: (workspaceId: string) =>
      ["intake", workspaceId, "submissions"] as const,
  },
  automations: {
    all: ["automations"] as const,
    list: (workspaceId: string) => ["automations", workspaceId] as const,
  },
} as const;
