export interface UpdateProfileRequest {
  fullName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
  locale?: string | null;
  jobTitle?: string | null;
}
