"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildConvertToTaskRequest,
  getSubmissionCountForForm,
  MOCK_FORMS,
  MOCK_MEMBERS,
  MOCK_PROJECTS,
  MOCK_SUBMISSIONS,
  type IntakeFormSurface,
  type IntakeSubmissionSurface,
  type IntakeSurfaceStatus,
} from "@/components/intake/data";

export function useIntakeData() {
  const [submissions, setSubmissions] = useState<IntakeSubmissionSurface[]>(MOCK_SUBMISSIONS);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const projectsById = useMemo(
    () => new Map(MOCK_PROJECTS.map((project) => [project.id, project])),
    [],
  );

  const membersById = useMemo(
    () => new Map(MOCK_MEMBERS.map((member) => [member.userId, member])),
    [],
  );

  const submissionCounts = useMemo(
    () =>
      new Map(
        MOCK_FORMS.map((form) => [form.id, getSubmissionCountForForm(form.id, submissions)]),
      ),
    [submissions],
  );

  const reviewSubmission = useCallback(
    async (
      submissionId: string,
      status: Extract<IntakeSurfaceStatus, "inReview" | "accepted" | "rejected">,
      reviewNotes?: string | null,
    ) => {
      setIsReviewing(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 300));
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId
            ? {
                ...sub,
                status,
                reviewedAt: new Date().toISOString(),
                reviewNotes: reviewNotes ?? sub.reviewNotes,
              }
            : sub,
        ),
      );
      setIsReviewing(false);
    },
    [],
  );

  const submitRequest = useCallback(
    async (form: IntakeFormSurface, values: Record<string, string>) => {
      setIsSubmitting(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      const newSubmission: IntakeSubmissionSurface = {
        id: `sub-${Date.now()}`,
        formId: form.id,
        values,
        rawValues: values,
        status: "new",
        submittedAt: new Date().toISOString(),
        submitterEmail: "demo@example.com",
        submitterUserId: null,
        convertedTaskId: null,
        reviewedAt: null,
        reviewNotes: null,
      };
      setSubmissions((prev) => [newSubmission, ...prev]);
      setIsSubmitting(false);
    },
    [],
  );

  const convertSubmission = useCallback(
    async (form: IntakeFormSurface, submission: IntakeSubmissionSurface) => {
      const request = buildConvertToTaskRequest(form, submission);
      if (!request) {
        throw new Error(
          "This form needs a default project before submissions can be converted.",
        );
      }
      setIsConverting(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      const taskId = `LP-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submission.id
            ? { ...sub, status: "converted" as IntakeSurfaceStatus, convertedTaskId: taskId }
            : sub,
        ),
      );
      setIsConverting(false);
    },
    [],
  );

  return {
    forms: MOCK_FORMS,
    submissions,
    members: MOCK_MEMBERS,
    projectsById,
    membersById,
    submissionCounts,
    isLoading: false,
    isRefreshing: false,
    error: null,
    dependencyWarning: null,
    getSubmissionsForForm: (formId: string) =>
      submissions.filter((sub) => sub.formId === formId),
    getSubmissionCount: (formId: string) => submissionCounts.get(formId) ?? 0,
    getProjectName: (projectId?: string | null) =>
      projectId ? (projectsById.get(projectId)?.name ?? null) : null,
    getMemberName: (userId?: string | null, fallbackEmail?: string | null) =>
      userId
        ? (membersById.get(userId)?.fullName ?? fallbackEmail ?? "Workspace member")
        : (fallbackEmail ?? "Anonymous"),
    reviewSubmission,
    submitRequest,
    convertSubmission,
    canConvertSubmission: (form: IntakeFormSurface, submission: IntakeSubmissionSurface) =>
      Boolean(form.projectId) && submission.status === "accepted",
    refresh: async () => {},
    isSubmitting,
    isReviewing,
    isConverting,
    isWorkspaceReady: true,
  };
}
