import type { TaskPriority } from "./task";

export type IntakeFieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "priority"
  | "assignee";

export interface IntakeFieldSchema {
  id: string;
  type: IntakeFieldType;
  label: string;
  required: boolean;
  options?: string[] | null;
}

export interface IntakeFormSchema {
  fields: IntakeFieldSchema[];
  autoAssigneeId?: string | null;
}

export interface IntakeFormResponse {
  id: string;
  title: string;
  description?: string | null;
  slug: string;
  isActive: boolean;
  isPublic: boolean;
  formSchema: IntakeFormSchema | Record<string, unknown>;
  defaultProjectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IntakeSubmissionStatus =
  | "New"
  | "InReview"
  | "Accepted"
  | "Rejected"
  | "ConvertedToTask"
  | number;

export interface IntakeSubmissionResponse {
  id: string;
  requestFormId: string;
  data: Record<string, unknown>;
  status: IntakeSubmissionStatus;
  submitterEmail?: string | null;
  submitterUserId?: string | null;
  convertedToTaskId?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

export interface SubmitIntakeRequest {
  data: Record<string, unknown>;
  submitterEmail?: string | null;
  submitterName?: string | null;
}

export interface IntakeReviewSubmissionRequest {
  status: IntakeSubmissionStatus;
  reviewNotes?: string | null;
}

export interface IntakeConvertToTaskRequest {
  projectId: string;
  title?: string | null;
  priority?: TaskPriority | null;
  assigneeId?: string | null;
}

export interface IntakeConvertToTaskResponse {
  taskId: string;
  identifier: string;
  title: string;
}
