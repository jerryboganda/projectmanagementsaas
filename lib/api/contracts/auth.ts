import type { WorkspaceRole } from "./workspace";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
  locale?: string | null;
  jobTitle?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthWorkspace {
  workspaceId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  role: WorkspaceRole;
  createdAt: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
  activeWorkspaceId?: string | null;
  workspaces: AuthWorkspace[];
}

export interface PersistedAuthSession {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  user: AuthUser;
  activeWorkspaceId?: string | null;
  workspaces: AuthWorkspace[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface RegistrationPendingResponse {
  email: string;
  requiresEmailConfirmation: boolean;
  message: string;
}

export interface ConfirmEmailRequest {
  email: string;
  token: string;
}

export interface ResendConfirmationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

// F-13 — Multi-factor authentication (TOTP)
export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
  challengeType: "totp";
}

export type LoginResult = AuthSessionResponse | MfaChallengeResponse;

export function isMfaChallenge<T extends object>(
  result: T | MfaChallengeResponse,
): result is MfaChallengeResponse {
  return (result as MfaChallengeResponse).mfaRequired === true;
}

export interface VerifyMfaLoginRequest {
  mfaToken: string;
  code: string;
}

export interface SetupMfaResponse {
  sharedKey: string;
  authenticatorUri: string;
}

export interface SetupMfaRequest {
  password: string;
}

export interface VerifyMfaSetupRequest {
  code: string;
}

export interface DisableMfaRequest {
  password: string;
  code: string;
}

export interface HubTokenRequest {
  hubPath: string;
  workspaceId: string;
}

export interface HubTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}
