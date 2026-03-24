import type {
  GoalProgressSource as ApiGoalProgressSource,
  GoalResponse,
  GoalStatus as ApiGoalStatus,
  GoalType as ApiGoalType,
  InitiativeResponse,
  InitiativeStatus as ApiInitiativeStatus,
  ProjectResponse,
  WorkspaceMemberResponse,
} from "@/lib/api/contracts";

export type GoalSurfaceStatus = "OnTrack" | "AtRisk" | "OffTrack" | "Completed" | "Cancelled";
export type GoalSurfaceType = "Objective" | "KeyResult";
export type GoalSurfaceProgressSource = "Manual" | "LinkedProjects" | "LinkedTasks";
export type GoalInitiativeSurfaceStatus = "Planned" | "InProgress" | "Completed" | "Cancelled";

export interface GoalSurfaceOwner {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface GoalSurfaceProject {
  id: string;
  name: string;
  status: string;
  identifier: string;
  color: string | null;
}

export interface GoalSurfaceInitiative {
  id: string;
  goalId: string;
  title: string;
  description?: string | null;
  status: GoalInitiativeSurfaceStatus;
  progress: number;
  owner?: GoalSurfaceOwner | null;
  startDate?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSurfaceItem {
  id: string;
  title: string;
  description?: string | null;
  status: GoalSurfaceStatus;
  type: GoalSurfaceType;
  progress: number;
  progressSource: GoalSurfaceProgressSource;
  ownerId?: string | null;
  owner?: GoalSurfaceOwner | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
  subGoals: GoalSurfaceItem[];
  linkedProjects: GoalSurfaceProject[];
  initiatives: GoalSurfaceInitiative[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalCreateInput {
  title: string;
  description?: string | null;
  status?: GoalSurfaceStatus | null;
  type?: GoalSurfaceType | null;
  progressPercent?: number | null;
  progressSource?: GoalSurfaceProgressSource | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
}

export interface GoalUpdateInput {
  title: string;
  description?: string | null;
  status: GoalSurfaceStatus;
  type: GoalSurfaceType;
  progressPercent?: number | null;
  progressSource?: GoalSurfaceProgressSource | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  parentGoalId?: string | null;
}

export interface GoalLinkProjectInput {
  projectId: string;
}

export interface GoalInitiativeCreateInput {
  title: string;
  description?: string | null;
  status?: GoalInitiativeSurfaceStatus | null;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  progressPercent?: number | null;
}

export interface GoalInitiativeUpdateInput {
  title: string;
  description?: string | null;
  status: GoalInitiativeSurfaceStatus;
  ownerId?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  progressPercent?: number | null;
}

export interface GoalSurfaceContext {
  projectsById: Map<string, ProjectResponse>;
  membersByUserId: Map<string, WorkspaceMemberResponse>;
}

function toGoalStatus(value: ApiGoalStatus | number | null | undefined): GoalSurfaceStatus {
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

function toGoalType(value: ApiGoalType | number | null | undefined): GoalSurfaceType {
  if (typeof value === "number") {
    return value === 1 ? "KeyResult" : "Objective";
  }

  return value === "KeyResult" ? "KeyResult" : "Objective";
}

function toProgressSource(
  value: ApiGoalProgressSource | number | null | undefined,
): GoalSurfaceProgressSource {
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
): GoalInitiativeSurfaceStatus {
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

export function goalStatusToApi(value: GoalSurfaceStatus): ApiGoalStatus {
  return value;
}

export function goalTypeToApi(value: GoalSurfaceType): ApiGoalType {
  return value;
}

export function progressSourceToApi(value: GoalSurfaceProgressSource): ApiGoalProgressSource {
  return value;
}

export function initiativeStatusToApi(value: GoalInitiativeSurfaceStatus): ApiInitiativeStatus {
  return value;
}

function toOwner(
  owner: GoalResponse["owner"] | InitiativeResponse["owner"] | null | undefined,
  ownerId: string | null | undefined,
  context: GoalSurfaceContext,
): GoalSurfaceOwner | null {
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

export function toGoalSurfaceInitiative(
  initiative: InitiativeResponse,
  context: GoalSurfaceContext,
): GoalSurfaceInitiative {
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

export function toGoalSurfaceItem(
  goal: GoalResponse,
  context: GoalSurfaceContext,
): GoalSurfaceItem {
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
        status: typeof project.status === "string" ? project.status : String(project.status),
        identifier: project.identifier,
        color: project.color ?? null,
      } satisfies GoalSurfaceProject;
    })
    .filter((project): project is GoalSurfaceProject => project !== null);

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
    subGoals: (goal.subGoals ?? []).map((child) => toGoalSurfaceItem(child, context)),
    linkedProjects,
    initiatives: (goal.initiatives ?? []).map((initiative) =>
      toGoalSurfaceInitiative(initiative, context),
    ),
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

export function buildGoalSurfaceTree(goals: GoalResponse[], context: GoalSurfaceContext) {
  const byParentId = new Map<string | null, GoalResponse[]>();

  for (const goal of goals) {
    const parentId = goal.parentGoalId ?? null;
    const siblings = byParentId.get(parentId) ?? [];
    siblings.push(goal);
    byParentId.set(parentId, siblings);
  }

  const visit = (goal: GoalResponse): GoalSurfaceItem => {
    const item = toGoalSurfaceItem(goal, context);
    const children = (byParentId.get(goal.id) ?? []).map((child) => visit(child));
    return {
      ...item,
      subGoals: children,
    };
  };

  return (byParentId.get(null) ?? []).map((goal) => visit(goal));
}

export function flattenGoalSurfaceTree(goals: GoalSurfaceItem[]) {
  const flattened: GoalSurfaceItem[] = [];

  const walk = (goal: GoalSurfaceItem) => {
    flattened.push(goal);
    for (const child of goal.subGoals) {
      walk(child);
    }
  };

  for (const goal of goals) {
    walk(goal);
  }

  return flattened;
}

export function findGoalSurfaceItem(
  goals: GoalSurfaceItem[],
  goalId: string | null,
): GoalSurfaceItem | null {
  if (!goalId) {
    return null;
  }

  for (const goal of goals) {
    if (goal.id === goalId) {
      return goal;
    }

    const child = findGoalSurfaceItem(goal.subGoals, goalId);
    if (child) {
      return child;
    }
  }

  return null;
}

export type GoalItem = GoalSurfaceItem;
export type GoalType = GoalSurfaceType;
export type GoalStatus = GoalSurfaceStatus;
