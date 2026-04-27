export type WorkspaceRole = "Owner" | "Admin" | "Member" | "Guest" | number;

export interface CreateWorkspaceRequest {
  name: string;
  description?: string | null;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
  currentUserRole?: WorkspaceRole | null;
  memberCount: number;
  createdAt: string;
}

export interface UpdateWorkspaceRequest {
  name?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
}

export interface WorkspaceSettingsResponse {
  workspaceId: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
  currentUserRole?: WorkspaceRole | null;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: string;
}

export interface UpdateWorkspaceSettingsRequest {
  settings: Record<string, unknown>;
}

export interface WorkspaceMemberResponse {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: WorkspaceRole;
  isActive: boolean;
  joinedAt?: string | null;
}

export interface InviteWorkspaceMemberRequest {
  email: string;
  role: WorkspaceRole;
  projectIds?: string[] | null;
}

export type InvitationStatus =
  | "Pending"
  | "Accepted"
  | "Declined"
  | "Expired"
  | "Revoked";

export interface InvitationDetailsResponse {
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  expiresAt: string;
}
