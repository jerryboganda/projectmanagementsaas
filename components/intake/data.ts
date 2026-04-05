import type {
  IntakeConvertToTaskRequest,
  IntakeFieldSchema,
  IntakeFieldType,
  IntakeFormResponse,
  IntakeSubmissionResponse,
  TaskPriority,
} from "@/lib/api/contracts";

export type IntakeSurfaceStatus = "new" | "inReview" | "accepted" | "rejected" | "converted";

export interface IntakeFormSurface {
  id: string;
  name: string;
  description: string;
  slug: string;
  fields: IntakeFieldSchema[];
  projectId?: string | null;
  autoAssigneeId?: string | null;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeSubmissionSurface {
  id: string;
  formId: string;
  values: Record<string, string>;
  rawValues: Record<string, unknown>;
  status: IntakeSurfaceStatus;
  submittedAt: string;
  submitterEmail?: string | null;
  submitterUserId?: string | null;
  convertedTaskId?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFieldType(value: unknown): IntakeFieldType {
  switch (String(value ?? "").trim().toLowerCase()) {
    case "textarea":
      return "textarea";
    case "select":
      return "select";
    case "date":
      return "date";
    case "priority":
      return "priority";
    case "assignee":
      return "assignee";
    default:
      return "text";
  }
}

function normalizeFieldSchema(field: unknown, index: number): IntakeFieldSchema | null {
  if (!isPlainObject(field)) {
    return null;
  }

  const label = typeof field.label === "string" ? field.label.trim() : "";
  if (!label) {
    return null;
  }

  const rawOptions = Array.isArray(field.options)
    ? field.options.filter((option): option is string => typeof option === "string" && option.trim().length > 0)
    : [];

  return {
    id:
      typeof field.id === "string" && field.id.trim().length > 0
        ? field.id
        : `field-${index + 1}`,
    type: normalizeFieldType(field.type),
    label,
    required: Boolean(field.required),
    options: rawOptions.length > 0 ? rawOptions : undefined,
  };
}

function normalizeFormSchema(value: IntakeFormResponse["formSchema"]) {
  if (!isPlainObject(value)) {
    return {
      fields: [] as IntakeFieldSchema[],
      autoAssigneeId: null as string | null,
    };
  }

  const fields = Array.isArray(value.fields)
    ? value.fields
        .map((field, index) => normalizeFieldSchema(field, index))
        .filter((field): field is IntakeFieldSchema => field !== null)
    : [];

  return {
    fields,
    autoAssigneeId:
      typeof value.autoAssigneeId === "string" && value.autoAssigneeId.trim().length > 0
        ? value.autoAssigneeId
        : null,
  };
}

function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => toDisplayValue(item)).filter(Boolean).join(", ");
  }

  if (isPlainObject(value)) {
    return JSON.stringify(value);
  }

  return String(value);
}

export function mapIntakeForm(form: IntakeFormResponse): IntakeFormSurface {
  const schema = normalizeFormSchema(form.formSchema);

  return {
    id: form.id,
    name: form.title,
    description: form.description ?? "",
    slug: form.slug,
    fields: schema.fields,
    projectId: form.defaultProjectId ?? null,
    autoAssigneeId: schema.autoAssigneeId,
    isPublic: form.isPublic,
    isActive: form.isActive,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  };
}

export function mapIntakeSubmission(submission: IntakeSubmissionResponse): IntakeSubmissionSurface {
  const rawValues = isPlainObject(submission.data) ? submission.data : {};
  const values = Object.fromEntries(
    Object.entries(rawValues).map(([key, value]) => [key, toDisplayValue(value)]),
  );

  return {
    id: submission.id,
    formId: submission.requestFormId,
    values,
    rawValues,
    status: normalizeSubmissionStatus(submission.status),
    submittedAt: submission.createdAt,
    submitterEmail: submission.submitterEmail ?? null,
    submitterUserId: submission.submitterUserId ?? null,
    convertedTaskId: submission.convertedToTaskId ?? null,
    reviewedAt: submission.reviewedAt ?? null,
    reviewNotes: submission.reviewNotes ?? null,
  };
}

export function normalizeSubmissionStatus(status: IntakeSubmissionResponse["status"]): IntakeSurfaceStatus {
  const normalized = String(status).trim().toLowerCase();

  switch (normalized) {
    case "0":
    case "new":
      return "new";
    case "1":
    case "inreview":
      return "inReview";
    case "2":
    case "accepted":
      return "accepted";
    case "3":
    case "rejected":
      return "rejected";
    case "4":
    case "convertedtotask":
      return "converted";
    default:
      return "new";
  }
}

function findValueByField(
  form: IntakeFormSurface,
  submission: IntakeSubmissionSurface,
  predicate: (field: IntakeFieldSchema) => boolean,
) {
  const matchingField = form.fields.find(predicate);
  if (!matchingField) {
    return null;
  }

  const directValue = submission.values[matchingField.label]?.trim();
  if (directValue) {
    return directValue;
  }

  return null;
}

function normalizeTaskPriority(value: string | null): TaskPriority | null {
  switch (value?.trim().toLowerCase()) {
    case "none":
      return "None";
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
    default:
      return null;
  }
}

export function buildConvertToTaskRequest(
  form: IntakeFormSurface,
  submission: IntakeSubmissionSurface,
): IntakeConvertToTaskRequest | null {
  if (!form.projectId) {
    return null;
  }

  const explicitTitle =
    findValueByField(form, submission, (field) =>
      field.label.toLowerCase().includes("title") ||
      field.label.toLowerCase().includes("summary") ||
      field.label.toLowerCase().includes("name"),
    ) ??
    Object.values(submission.values).find((value) => value.trim().length > 0) ??
    null;

  const priorityValue =
    findValueByField(form, submission, (field) => field.type === "priority") ??
    findValueByField(form, submission, (field) => field.label.toLowerCase().includes("priority"));

  const assigneeId =
    findValueByField(form, submission, (field) => field.type === "assignee") ??
    form.autoAssigneeId ??
    null;

  return {
    projectId: form.projectId,
    title: explicitTitle,
    priority: normalizeTaskPriority(priorityValue),
    assigneeId,
  };
}

export function getSubmissionCountForForm(
  formId: string,
  submissions: IntakeSubmissionSurface[],
) {
  return submissions.filter((submission) => submission.formId === formId).length;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export interface MockProject {
  id: string;
  name: string;
}

export interface MockMember {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "Owner" | "Admin" | "Member";
  isActive: boolean;
}

export const MOCK_PROJECTS: MockProject[] = [
  { id: "proj-1", name: "Platform Redesign" },
  { id: "proj-2", name: "API v3 Overhaul" },
  { id: "proj-3", name: "Mobile App Launch" },
];

export const MOCK_MEMBERS: MockMember[] = [
  { id: "mbr-1", userId: "user-1", email: "alex.morgan@example.com", fullName: "Alex Morgan", avatarUrl: null, role: "Owner", isActive: true },
  { id: "mbr-2", userId: "user-2", email: "jordan.lee@example.com", fullName: "Jordan Lee", avatarUrl: null, role: "Admin", isActive: true },
  { id: "mbr-3", userId: "user-3", email: "casey.kim@example.com", fullName: "Casey Kim", avatarUrl: null, role: "Member", isActive: true },
  { id: "mbr-4", userId: "user-4", email: "riley.chen@example.com", fullName: "Riley Chen", avatarUrl: null, role: "Member", isActive: true },
];

export const MOCK_FORMS: IntakeFormSurface[] = [
  {
    id: "form-1",
    name: "Bug Report",
    description: "Report a bug or unexpected behavior in the platform.",
    slug: "bug-report",
    fields: [
      { id: "f1-1", type: "text", label: "Summary", required: true },
      { id: "f1-2", type: "textarea", label: "Steps to Reproduce", required: true },
      { id: "f1-3", type: "priority", label: "Severity", required: false },
      { id: "f1-4", type: "assignee", label: "Assignee", required: false },
    ],
    projectId: "proj-1",
    autoAssigneeId: null,
    isPublic: true,
    isActive: true,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-02-01T14:30:00Z",
  },
  {
    id: "form-2",
    name: "Feature Request",
    description: "Propose a new feature or improvement to the product.",
    slug: "feature-request",
    fields: [
      { id: "f2-1", type: "text", label: "Feature Title", required: true },
      { id: "f2-2", type: "textarea", label: "Description", required: true },
      { id: "f2-3", type: "select", label: "Category", required: false, options: ["UI", "Performance", "Integration", "Reporting", "Other"] },
      { id: "f2-4", type: "priority", label: "Priority", required: false },
    ],
    projectId: "proj-2",
    autoAssigneeId: null,
    isPublic: true,
    isActive: true,
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-02-05T11:00:00Z",
  },
  {
    id: "form-3",
    name: "Design Review Request",
    description: "Submit design artifacts for internal team review and approval.",
    slug: "design-review",
    fields: [
      { id: "f3-1", type: "text", label: "Design Title", required: true },
      { id: "f3-2", type: "select", label: "Design Type", required: true, options: ["Wireframe", "Mockup", "Prototype", "Spec"] },
      { id: "f3-3", type: "textarea", label: "Context & Scope", required: false },
      { id: "f3-4", type: "date", label: "Review Deadline", required: false },
    ],
    projectId: "proj-3",
    autoAssigneeId: "user-2",
    isPublic: false,
    isActive: true,
    createdAt: "2026-02-01T08:00:00Z",
    updatedAt: "2026-02-10T16:00:00Z",
  },
];

export const MOCK_SUBMISSIONS: IntakeSubmissionSurface[] = [
  {
    id: "sub-1",
    formId: "form-1",
    values: { Summary: "Login page flickers on Safari 17", "Steps to Reproduce": "1. Open Safari\n2. Navigate to /login\n3. Observe flicker on load", Severity: "High" },
    rawValues: { Summary: "Login page flickers on Safari 17", "Steps to Reproduce": "1. Open Safari\n2. Navigate to /login\n3. Observe flicker on load", Severity: "High" },
    status: "new",
    submittedAt: "2026-03-20T08:15:00Z",
    submitterEmail: "alex.morgan@example.com",
    submitterUserId: "user-1",
    convertedTaskId: null,
    reviewedAt: null,
    reviewNotes: null,
  },
  {
    id: "sub-2",
    formId: "form-1",
    values: { Summary: "Dashboard charts blank for workspaces with 1000+ tasks", "Steps to Reproduce": "1. Create workspace with 1000+ tasks\n2. Load dashboard\n3. Charts remain blank", Severity: "Urgent" },
    rawValues: { Summary: "Dashboard charts blank for workspaces with 1000+ tasks", "Steps to Reproduce": "1. Create workspace with 1000+ tasks\n2. Load dashboard\n3. Charts remain blank", Severity: "Urgent" },
    status: "inReview",
    submittedAt: "2026-03-18T14:30:00Z",
    submitterEmail: "jordan.lee@example.com",
    submitterUserId: "user-2",
    convertedTaskId: null,
    reviewedAt: "2026-03-19T09:00:00Z",
    reviewNotes: "Reproducing in staging. Escalated to backend team.",
  },
  {
    id: "sub-3",
    formId: "form-1",
    values: { Summary: "Notification badge count mismatch after mark-as-read", "Steps to Reproduce": "Mark notifications read, badge persists incorrectly", Severity: "Medium" },
    rawValues: { Summary: "Notification badge count mismatch after mark-as-read", "Steps to Reproduce": "Mark notifications read, badge persists incorrectly", Severity: "Medium" },
    status: "accepted",
    submittedAt: "2026-03-10T11:00:00Z",
    submitterEmail: "casey.kim@example.com",
    submitterUserId: "user-3",
    convertedTaskId: null,
    reviewedAt: "2026-03-11T10:00:00Z",
    reviewNotes: "Confirmed. Adding to sprint backlog.",
  },
  {
    id: "sub-4",
    formId: "form-1",
    values: { Summary: "Duplicate task created on rapid double-click", "Steps to Reproduce": "Double-click 'New Task' quickly in the board view", Severity: "Low" },
    rawValues: { Summary: "Duplicate task created on rapid double-click", "Steps to Reproduce": "Double-click 'New Task' quickly in the board view", Severity: "Low" },
    status: "converted",
    submittedAt: "2026-03-05T09:45:00Z",
    submitterEmail: "riley.chen@example.com",
    submitterUserId: "user-4",
    convertedTaskId: "LP-1024",
    reviewedAt: "2026-03-06T08:00:00Z",
    reviewNotes: null,
  },
  {
    id: "sub-5",
    formId: "form-2",
    values: { "Feature Title": "Bulk task re-assignment", Description: "Allow selecting multiple tasks and reassigning them to a different member in one action.", Category: "UI", Priority: "High" },
    rawValues: { "Feature Title": "Bulk task re-assignment", Description: "Allow selecting multiple tasks and reassigning them to a different member in one action.", Category: "UI", Priority: "High" },
    status: "new",
    submittedAt: "2026-03-22T13:00:00Z",
    submitterEmail: "alex.morgan@example.com",
    submitterUserId: "user-1",
    convertedTaskId: null,
    reviewedAt: null,
    reviewNotes: null,
  },
  {
    id: "sub-6",
    formId: "form-2",
    values: { "Feature Title": "Webhooks for task status changes", Description: "POST to a configurable endpoint whenever a task transitions state.", Category: "Integration", Priority: "Medium" },
    rawValues: { "Feature Title": "Webhooks for task status changes", Description: "POST to a configurable endpoint whenever a task transitions state.", Category: "Integration", Priority: "Medium" },
    status: "rejected",
    submittedAt: "2026-03-08T10:20:00Z",
    submitterEmail: "jordan.lee@example.com",
    submitterUserId: "user-2",
    convertedTaskId: null,
    reviewedAt: "2026-03-09T14:00:00Z",
    reviewNotes: "Already on the roadmap for Q3. Closing as duplicate.",
  },
  {
    id: "sub-7",
    formId: "form-3",
    values: { "Design Title": "Onboarding flow v2", "Design Type": "Prototype", "Context & Scope": "Revised onboarding journey for new org admins", "Review Deadline": "2026-04-01" },
    rawValues: { "Design Title": "Onboarding flow v2", "Design Type": "Prototype", "Context & Scope": "Revised onboarding journey for new org admins", "Review Deadline": "2026-04-01" },
    status: "inReview",
    submittedAt: "2026-03-21T09:30:00Z",
    submitterEmail: "casey.kim@example.com",
    submitterUserId: "user-3",
    convertedTaskId: null,
    reviewedAt: "2026-03-22T08:00:00Z",
    reviewNotes: "Reviewed first pass. Needs iteration on step 3.",
  },
];
