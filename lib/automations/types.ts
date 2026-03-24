export type AutomationDocument = unknown;

export interface AutomationRuleResponse {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  trigger: AutomationDocument;
  action: AutomationDocument;
  projectId: string | null;
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationLogResponse {
  id: string;
  automationRuleId: string;
  status: "Success" | "Failed" | "Skipped" | string;
  triggerData: string | null;
  actionResult: string | null;
  errorMessage: string | null;
  executionDuration: string;
  createdAt: string;
}

export interface AutomationSurfaceItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationDocument;
  action: AutomationDocument;
  projectId: string | null;
  executionCount: number;
  lastTriggered: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationSurfaceLog {
  id: string;
  automationRuleId: string;
  status: AutomationLogResponse["status"];
  triggerData: string | null;
  actionResult: string | null;
  errorMessage: string | null;
  executionDuration: string;
  createdAt: string;
}

export interface AutomationUpsertInput {
  name: string;
  description?: string | null;
  isActive: boolean;
  trigger: AutomationDocument;
  action: AutomationDocument;
  projectId?: string | null;
}

export interface AutomationProjectOption {
  id: string;
  name: string;
}

export function toAutomationSurfaceItem(rule: AutomationRuleResponse): AutomationSurfaceItem {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description ?? "",
    enabled: rule.isActive,
    trigger: rule.trigger ?? {},
    action: rule.action ?? {},
    projectId: rule.projectId ?? null,
    executionCount: rule.executionCount,
    lastTriggered: rule.lastExecutedAt,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

export function toAutomationSurfaceLog(log: AutomationLogResponse): AutomationSurfaceLog {
  return {
    id: log.id,
    automationRuleId: log.automationRuleId,
    status: log.status,
    triggerData: log.triggerData,
    actionResult: log.actionResult,
    errorMessage: log.errorMessage,
    executionDuration: log.executionDuration,
    createdAt: log.createdAt,
  };
}

export function stringifyAutomationDocument(document: AutomationDocument | null | undefined) {
  return JSON.stringify(document ?? {}, null, 2);
}

export function summarizeAutomationDocument(document: AutomationDocument | null | undefined) {
  if (!isAutomationRecord(document) || Object.keys(document).length === 0) {
    return "Custom JSON";
  }

  if (typeof document.type === "string" && document.type.trim()) {
    return document.type.trim();
  }

  return `Custom JSON (${Object.keys(document).length} keys)`;
}

export function previewAutomationDocumentEntries(
  document: AutomationDocument | null | undefined,
  limit = 2,
) {
  if (!isAutomationRecord(document)) {
    return [] as string[];
  }

  return Object.entries(document)
    .filter(([key]) => key !== "type")
    .slice(0, limit)
    .map(([key, value]) => `${key}: ${formatPreviewValue(value)}`);
}

export function formatAutomationTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatAutomationDateTime(value: string | null | undefined) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatAutomationDuration(value: string | null | undefined) {
  if (!value) {
    return "0s";
  }

  const parts = value.split(":");
  if (parts.length !== 3) {
    return value;
  }

  const hours = Number.parseInt(parts[0] ?? "0", 10);
  const minutes = Number.parseInt(parts[1] ?? "0", 10);
  const seconds = Number.parseFloat(parts[2] ?? "0");

  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
    return value;
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  if (totalSeconds >= 3600) {
    return `${hours}h ${minutes}m`;
  }

  if (totalSeconds >= 60) {
    return `${minutes}m ${seconds.toFixed(seconds < 10 && !Number.isInteger(seconds) ? 1 : 0)}s`;
  }

  return `${seconds.toFixed(seconds < 10 && !Number.isInteger(seconds) ? 1 : 0)}s`;
}

function formatPreviewValue(value: unknown) {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (typeof value === "object") {
    return "object";
  }

  return String(value);
}

function isAutomationRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
