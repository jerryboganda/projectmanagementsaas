import { Preferences } from '@capacitor/preferences';
import type { AuthSessionResponse, AuthUser, AuthWorkspace } from '../api/client';

/**
 * Mobile auth token store.
 * - Access token: in-memory only (cleared on app kill).
 * - Refresh token: stored via Capacitor Preferences under the
 *   platform secure store (Android EncryptedSharedPreferences /
 *   iOS UserDefaults). For biometric-gated refresh tokens, see
 *   ./biometric.ts which uses Keychain/Keystore instead.
 * - User + session metadata (active workspace, workspace list):
 *   persisted JSON so the shell can boot offline with accurate context.
 */

const REFRESH_KEY = 'lp.refresh';
const USER_KEY = 'lp.user';
const SESSION_KEY = 'lp.session';

let accessToken: string | null = null;
let activeWorkspaceId: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setActiveWorkspaceId(id: string | null): void {
  activeWorkspaceId = id;
}

export function getActiveWorkspaceId(): string | null {
  return activeWorkspaceId;
}

export async function setRefreshToken(token: string): Promise<void> {
  await Preferences.set({ key: REFRESH_KEY, value: token });
}

export async function getRefreshToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: REFRESH_KEY });
  return value;
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  activeWorkspaceId = null;
  await Preferences.remove({ key: REFRESH_KEY });
  await Preferences.remove({ key: USER_KEY });
  await Preferences.remove({ key: SESSION_KEY });
}

export async function setCurrentUser(serialized: string): Promise<void> {
  await Preferences.set({ key: USER_KEY, value: serialized });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { value } = await Preferences.get({ key: USER_KEY });
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export interface PersistedSession {
  activeWorkspaceId: string | null;
  workspaces: AuthWorkspace[];
}

export async function persistSession(session: AuthSessionResponse): Promise<void> {
  const data: PersistedSession = {
    activeWorkspaceId: session.activeWorkspaceId ?? session.workspaces[0]?.workspaceId ?? null,
    workspaces: session.workspaces,
  };
  activeWorkspaceId = data.activeWorkspaceId;
  await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(data) });
  await setCurrentUser(JSON.stringify(session.user));
}

export async function loadPersistedSession(): Promise<PersistedSession | null> {
  const { value } = await Preferences.get({ key: SESSION_KEY });
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as PersistedSession;
    activeWorkspaceId = parsed.activeWorkspaceId;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Switch the active workspace. Updates memory + persisted session.
 * Callers should invalidate their query cache afterwards because all
 * tenant-scoped data (projects, tasks, goals, ...) changes with workspace.
 */
export async function switchActiveWorkspace(workspaceId: string): Promise<void> {
  activeWorkspaceId = workspaceId;
  const existing = await loadPersistedSession();
  const next: PersistedSession = {
    activeWorkspaceId: workspaceId,
    workspaces: existing?.workspaces ?? [],
  };
  await Preferences.set({ key: SESSION_KEY, value: JSON.stringify(next) });
}
