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
