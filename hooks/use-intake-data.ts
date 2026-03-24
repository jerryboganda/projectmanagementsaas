"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import type {
  IntakeReviewSubmissionRequest,
  IntakeSubmissionStatus,
  ProjectResponse,
  WorkspaceMemberResponse,
} from "@/lib/api/contracts";
import {
  buildConvertToTaskRequest,
  getSubmissionCountForForm,
  mapIntakeForm,
  mapIntakeSubmission,
  type IntakeFormSurface,
  type IntakeSubmissionSurface,
  type IntakeSurfaceStatus,
} from "@/components/intake/data";

function intakeFormsQueryKey(workspaceId: string | null) {
  return ["intake", workspaceId, "forms"] as const;
}

function intakeSubmissionsQueryKey(workspaceId: string | null) {
  return ["intake", workspaceId, "submissions"] as const;
}

function intakeProjectsQueryKey(workspaceId: string | null) {
  return ["intake", workspaceId, "projects"] as const;
}

function intakeMembersQueryKey(workspaceId: string | null) {
  return ["intake", workspaceId, "members"] as const;
}

function toReviewStatus(status: IntakeSurfaceStatus): IntakeSubmissionStatus {
  switch (status) {
    case "inReview":
      return "InReview";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "converted":
      return "ConvertedToTask";
    case "new":
    default:
      return "New";
  }
}

export function useIntakeData() {
  const { apiClient, session } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  const formsQuery = useQuery({
    queryKey: intakeFormsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.listRequestForms(),
  });

  const submissionsQuery = useQuery({
    queryKey: intakeSubmissionsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 15_000,
    queryFn: async () => apiClient.listIntakeSubmissions(),
  });

  const projectsQuery = useQuery<ProjectResponse[]>({
    queryKey: intakeProjectsQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () =>
      apiClient.listProjects({
        pageSize: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
  });

  const membersQuery = useQuery<WorkspaceMemberResponse[]>({
    queryKey: intakeMembersQueryKey(activeWorkspaceId),
    enabled: !!activeWorkspaceId,
    staleTime: 30_000,
    queryFn: async () => apiClient.listWorkspaceMembers(activeWorkspaceId!),
  });

  const forms = useMemo(
    () => (formsQuery.data ?? []).map(mapIntakeForm).filter((form) => form.isActive),
    [formsQuery.data],
  );

  const submissions = useMemo(
    () => (submissionsQuery.data ?? []).map(mapIntakeSubmission),
    [submissionsQuery.data],
  );

  const projectsById = useMemo(
    () =>
      new Map((projectsQuery.data ?? []).map((project) => [project.id, project])),
    [projectsQuery.data],
  );

  const membersById = useMemo(
    () =>
      new Map((membersQuery.data ?? []).map((member) => [member.userId, member])),
    [membersQuery.data],
  );

  const submissionCounts = useMemo(
    () =>
      new Map(forms.map((form) => [form.id, getSubmissionCountForForm(form.id, submissions)])),
    [forms, submissions],
  );

  const invalidateIntake = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: intakeFormsQueryKey(activeWorkspaceId),
      }),
      queryClient.invalidateQueries({
        queryKey: intakeSubmissionsQueryKey(activeWorkspaceId),
      }),
    ]);
  };

  const submitMutation = useMutation({
    mutationFn: async ({
      form,
      values,
    }: {
      form: IntakeFormSurface;
      values: Record<string, string>;
    }) =>
      apiClient.submitIntakeRequest(form.slug, {
        data: values,
        submitterEmail: session?.user.email ?? null,
        submitterName: session?.user.fullName ?? null,
      }),
    onSuccess: invalidateIntake,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      submissionId,
      status,
      reviewNotes,
    }: {
      submissionId: string;
      status: IntakeSurfaceStatus;
      reviewNotes?: string | null;
    }) => {
      const input: IntakeReviewSubmissionRequest = {
        status: toReviewStatus(status),
        reviewNotes: reviewNotes ?? null,
      };

      return apiClient.reviewIntakeSubmission(submissionId, input);
    },
    onSuccess: invalidateIntake,
  });

  const convertMutation = useMutation({
    mutationFn: async ({
      form,
      submission,
    }: {
      form: IntakeFormSurface;
      submission: IntakeSubmissionSurface;
    }) => {
      const request = buildConvertToTaskRequest(form, submission);
      if (!request) {
        throw new Error("This form needs a default project before submissions can be converted.");
      }

      return apiClient.convertIntakeSubmissionToTask(submission.id, request);
    },
    onSuccess: invalidateIntake,
  });

  const coreError = formsQuery.error ?? submissionsQuery.error ?? null;
  const hasDependencyWarning = Boolean(projectsQuery.error || membersQuery.error);

  return {
    activeWorkspaceId,
    session,
    forms,
    submissions,
    projects: projectsQuery.data ?? [],
    members: membersQuery.data ?? [],
    projectsById,
    membersById,
    submissionCounts,
    formsQuery,
    submissionsQuery,
    projectsQuery,
    membersQuery,
    isLoading: formsQuery.isLoading || submissionsQuery.isLoading,
    isRefreshing:
      formsQuery.isFetching ||
      submissionsQuery.isFetching ||
      projectsQuery.isFetching ||
      membersQuery.isFetching,
    error: coreError,
    dependencyWarning: hasDependencyWarning
      ? "Some supporting intake metadata is temporarily unavailable, so names and project labels may be incomplete."
      : null,
    getSubmissionsForForm: (formId: string) =>
      submissions.filter((submission) => submission.formId === formId),
    getSubmissionCount: (formId: string) => submissionCounts.get(formId) ?? 0,
    getProjectName: (projectId?: string | null) =>
      projectId ? projectsById.get(projectId)?.name ?? null : null,
    getMemberName: (userId?: string | null, fallbackEmail?: string | null) =>
      userId
        ? membersById.get(userId)?.fullName ?? fallbackEmail ?? "Workspace member"
        : fallbackEmail ?? "Anonymous",
    reviewSubmission: async (
      submissionId: string,
      status: Extract<IntakeSurfaceStatus, "inReview" | "accepted" | "rejected">,
      reviewNotes?: string | null,
    ) => reviewMutation.mutateAsync({ submissionId, status, reviewNotes }),
    submitRequest: async (form: IntakeFormSurface, values: Record<string, string>) =>
      submitMutation.mutateAsync({ form, values }),
    convertSubmission: async (form: IntakeFormSurface, submission: IntakeSubmissionSurface) =>
      convertMutation.mutateAsync({ form, submission }),
    canConvertSubmission: (form: IntakeFormSurface, submission: IntakeSubmissionSurface) =>
      Boolean(form.projectId) && submission.status === "accepted",
    refresh: async () => {
      await Promise.all([
        formsQuery.refetch(),
        submissionsQuery.refetch(),
        projectsQuery.refetch(),
        membersQuery.refetch(),
      ]);
    },
    isSubmitting: submitMutation.isPending,
    isReviewing: reviewMutation.isPending,
    isConverting: convertMutation.isPending,
    isWorkspaceReady: !!activeWorkspaceId,
  };
}
