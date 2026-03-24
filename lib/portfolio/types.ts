import type {
  CreateGoalRequest,
  CreateInitiativeRequest,
  GoalResponse,
  GoalStatus as ApiGoalStatus,
  GoalType as ApiGoalType,
  GoalProgressSource as ApiGoalProgressSource,
  InitiativeResponse,
  InitiativeStatus as ApiInitiativeStatus,
  ProjectResponse,
  UpdateGoalRequest,
  UpdateInitiativeRequest,
  WorkspaceMemberResponse,
} from "@/lib/api/contracts";

export type PortfolioGoalStatus = "OnTrack" | "AtRisk" | "OffTrack" | "Completed" | "Cancelled";
export type PortfolioGoalType = "Objective" | "KeyResult";
export type PortfolioGoalProgressSource = "Manual" | "LinkedProjects" | "LinkedTasks";
export type PortfolioInitiativeStatus = "Planned" | "InProgress" | "Completed" | "Cancelled";

export interface PortfolioOwner {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface PortfolioProject {
  id: string;
  name: string;
  identifier: string;
  status: string;
  color: string | null;
}

export interface PortfolioInitiative {
  id: string;
  goalId: string;
  title: string;
  description?: string | null;
  status: PortfolioInitiativeStatus;
  progress: number;
  owner?: PortfolioOwner | null;
  startDate?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioGoalItem {
  id: string;
  title: string;
  description?: string | null;
  status: PortfolioGoalStatus;
  type: PortfolioGoalType;
  progress: number;
  progressSource: PortfolioGoalProgressSource;
  ownerId?: string | null;
  owner?: PortfolioOwner | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
  subGoals: PortfolioGoalItem[];
  linkedProjects: PortfolioProject[];
  initiatives: PortfolioInitiative[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioGoalRow extends PortfolioGoalItem {
  level: number;
}

export interface PortfolioSurfaceContext {
  projectsById: Map<string, ProjectResponse>;
  membersByUserId: Map<string, WorkspaceMemberResponse>;
}

export interface PortfolioGoalCreateInput {
  title: string;
  description?: string | null;
  status?: PortfolioGoalStatus | null;
  type?: PortfolioGoalType | null;
  progressPercent?: number | null;
  progressSource?: PortfolioGoalProgressSource | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
}

export interface PortfolioGoalUpdateInput {
  title: string;
  description?: string | null;
  status: PortfolioGoalStatus;
  type: PortfolioGoalType;
  progressPercent?: number | null;
  progressSource?: PortfolioGoalProgressSource | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
}

export interface PortfolioInitiativeCreateInput {
  title: string;
  description?: string | null;
  status?: PortfolioInitiativeStatus | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  progressPercent?: number | null;
}

export interface PortfolioInitiativeUpdateInput {
  title: string;
  description?: string | null;
  status: PortfolioInitiativeStatus;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  progressPercent?: number | null;
}

function toGoalStatus(value: ApiGoalStatus | number | null | undefined): PortfolioGoalStatus {
  if (typeof value === "number") {
    switch (value) {
      case 1:
        return "AtRisk";
      case 2:
        return "OffTrack";
      case 3:
        return "Completed";
      case 4:
        return "Cancelled";
      default:
        return "OnTrack";
    }
  }

  switch (value) {
    case "AtRisk":
      return "AtRisk";
    case "OffTrack":
      return "OffTrack";
    case "Completed":
      return "Completed";
    case "Cancelled":
      return "Cancelled";
    default:
      return "OnTrack";
  }
}

function toGoalType(value: ApiGoalType | number | null | undefined): PortfolioGoalType {
  if (typeof value === "number") {
    return value === 1 ? "KeyResult" : "Objective";
  }

  return value === "KeyResult" ? "KeyResult" : "Objective";
}

function toProgressSource(
  value: ApiGoalProgressSource | number | null | undefined,
): PortfolioGoalProgressSource {
  if (typeof value === "number") {
    if (value === 1) {
      return "LinkedProjects";
    }
    if (value === 2) {
      return "LinkedTasks";
    }
    return "Manual";
  }

  if (value === "LinkedProjects") {
    return "LinkedProjects";
  }

  if (value === "LinkedTasks") {
    return "LinkedTasks";
  }

  return "Manual";
}

function toInitiativeStatus(
  value: ApiInitiativeStatus | number | null | undefined,
): PortfolioInitiativeStatus {
  if (typeof value === "number") {
    if (value === 1) {
      return "InProgress";
    }

    if (value === 2) {
      return "Completed";
    }

    if (value === 3) {
      return "Cancelled";
    }

    return "Planned";
  }

  if (value === "InProgress") {
    return "InProgress";
  }

  if (value === "Completed") {
    return "Completed";
  }

  if (value === "Cancelled") {
    return "Cancelled";
  }

  return "Planned";
}

function toOwner(
  owner: GoalResponse["owner"] | InitiativeResponse["owner"] | null | undefined,
  ownerId: string | null | undefined,
  context: PortfolioSurfaceContext,
): PortfolioOwner | null {
  if (owner?.id) {
    return {
      id: owner.id,
      fullName: owner.fullName,
      avatarUrl: owner.avatarUrl ?? null,
    };
  }

  if (ownerId) {
    const member = context.membersByUserId.get(ownerId);
    if (member) {
      return {
        id: member.userId,
        fullName: member.fullName,
        avatarUrl: member.avatarUrl ?? null,
      };
    }
  }

  return null;
}

export function toPortfolioInitiative(
  initiative: InitiativeResponse,
  context: PortfolioSurfaceContext,
): PortfolioInitiative {
  return {
    id: initiative.id,
    goalId: initiative.goalId,
    title: initiative.title,
    description: initiative.description ?? null,
    status: toInitiativeStatus(initiative.status),
    progress: initiative.progressPercent,
    owner: toOwner(initiative.owner, initiative.owner?.id, context),
    startDate: initiative.startDate ?? null,
    targetDate: initiative.targetDate ?? null,
    createdAt: initiative.createdAt,
    updatedAt: initiative.updatedAt,
  };
}

export function toPortfolioGoalItem(
  goal: GoalResponse,
  context: PortfolioSurfaceContext,
): PortfolioGoalItem {
  const owner = toOwner(goal.owner, goal.owner?.id, context);
  const linkedProjects = (goal.projectLinks ?? [])
    .map((link) => {
      const project = context.projectsById.get(link.projectId);
      if (!project) {
        return null;
      }

      return {
        id: project.id,
        name: project.name,
        identifier: project.identifier,
        status: typeof project.status === "string" ? project.status : String(project.status),
        color: project.color ?? null,
      } satisfies PortfolioProject;
    })
    .filter((project): project is PortfolioProject => project !== null);

  return {
    id: goal.id,
    title: goal.title,
    description: goal.description ?? null,
    status: toGoalStatus(goal.status),
    type: toGoalType(goal.type),
    progress: goal.progressPercent,
    progressSource: toProgressSource(goal.progressSource),
    ownerId: owner?.id ?? goal.owner?.id ?? null,
    owner,
    startDate: goal.startDate ?? null,
    targetDate: goal.targetDate ?? null,
    parentGoalId: goal.parentGoalId ?? null,
    subGoals: (goal.subGoals ?? []).map((child) => toPortfolioGoalItem(child, context)),
    linkedProjects,
    initiatives: (goal.initiatives ?? []).map((initiative) =>
      toPortfolioInitiative(initiative, context),
    ),
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

export function buildPortfolioGoalTree(
  goals: GoalResponse[],
  context: PortfolioSurfaceContext,
): PortfolioGoalItem[] {
  const byParentId = new Map<string | null, GoalResponse[]>();

  for (const goal of goals) {
    const parentId = goal.parentGoalId ?? null;
    const siblings = byParentId.get(parentId) ?? [];
    siblings.push(goal);
    byParentId.set(parentId, siblings);
  }

  const visit = (goal: GoalResponse): PortfolioGoalItem => {
    const item = toPortfolioGoalItem(goal, context);
    const children = (byParentId.get(goal.id) ?? []).map((child) => visit(child));
    return {
      ...item,
      subGoals: children,
    };
  };

  return (byParentId.get(null) ?? []).map((goal) => visit(goal));
}

export function flattenPortfolioGoalTree(goals: PortfolioGoalItem[]) {
  const flattened: PortfolioGoalRow[] = [];

  const walk = (goal: PortfolioGoalItem, level: number) => {
    flattened.push({ ...goal, level });
    for (const child of goal.subGoals) {
      walk(child, level + 1);
    }
  };

  for (const goal of goals) {
    walk(goal, 0);
  }

  return flattened;
}

export function findPortfolioGoalItem(
  goals: PortfolioGoalItem[],
  goalId: string | null,
): PortfolioGoalItem | null {
  if (!goalId) {
    return null;
  }

  for (const goal of goals) {
    if (goal.id === goalId) {
      return goal;
    }

    const child = findPortfolioGoalItem(goal.subGoals, goalId);
    if (child) {
      return child;
    }
  }

  return null;
}

export function portfolioGoalStatusToApi(value: PortfolioGoalStatus): ApiGoalStatus {
  return value;
}

export function portfolioGoalTypeToApi(value: PortfolioGoalType): ApiGoalType {
  return value;
}

export function portfolioProgressSourceToApi(
  value: PortfolioGoalProgressSource,
): ApiGoalProgressSource {
  return value;
}

export function portfolioInitiativeStatusToApi(
  value: PortfolioInitiativeStatus,
): ApiInitiativeStatus {
  return value;
}

export function toCreateGoalRequest(
  input: PortfolioGoalCreateInput,
): CreateGoalRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status ? portfolioGoalStatusToApi(input.status) : null,
    type: input.type ? portfolioGoalTypeToApi(input.type) : null,
    progressPercent: input.progressPercent ?? null,
    progressSource: input.progressSource ? portfolioProgressSourceToApi(input.progressSource) : null,
    ownerId: input.ownerId ?? null,
    startDate: input.startDate ?? null,
    targetDate: input.targetDate ?? null,
    parentGoalId: input.parentGoalId ?? null,
  };
}

export function toUpdateGoalRequest(
  input: PortfolioGoalUpdateInput,
): UpdateGoalRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: portfolioGoalStatusToApi(input.status),
    type: portfolioGoalTypeToApi(input.type),
    progressPercent: input.progressPercent ?? null,
    progressSource: input.progressSource ? portfolioProgressSourceToApi(input.progressSource) : null,
    ownerId: input.ownerId ?? null,
    startDate: input.startDate ?? null,
    targetDate: input.targetDate ?? null,
    parentGoalId: input.parentGoalId ?? null,
  };
}

export function toCreateInitiativeRequest(
  input: PortfolioInitiativeCreateInput,
): CreateInitiativeRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status ? portfolioInitiativeStatusToApi(input.status) : null,
    ownerId: input.ownerId ?? null,
    startDate: input.startDate ?? null,
    targetDate: input.targetDate ?? null,
    progressPercent: input.progressPercent ?? null,
  };
}

export function toUpdateInitiativeRequest(
  input: PortfolioInitiativeUpdateInput,
): UpdateInitiativeRequest {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: portfolioInitiativeStatusToApi(input.status),
    ownerId: input.ownerId ?? null,
    startDate: input.startDate ?? null,
    targetDate: input.targetDate ?? null,
    progressPercent: input.progressPercent ?? null,
  };
}
