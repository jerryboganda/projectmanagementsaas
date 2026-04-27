export interface TeamMemberResponse {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface TeamResponse {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  memberCount: number;
  members: TeamMemberResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string | null;
  color?: string | null;
  memberIds?: string[] | null;
}

export interface UpdateTeamRequest {
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface SetTeamMembersRequest {
  userIds: string[];
}
