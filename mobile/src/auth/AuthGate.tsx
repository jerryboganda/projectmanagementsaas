import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  getAccessToken,
  getRefreshToken,
  loadPersistedSession,
  persistSession,
  setAccessToken,
  setRefreshToken,
} from './token-store';
import { api } from '../api/client';

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

/**
 * Boot-time auth gate.
 *
 * On mount:
 *  1. Hydrate the persisted session (activeWorkspaceId + workspaces) from
 *     Preferences so the X-Workspace-Id header can be attached immediately.
 *  2. If an in-memory access token already exists (hot reload), trust it.
 *  3. Otherwise, try a silent refresh against /auth/refresh using the
 *     Preferences-stored refresh token. On success, populate the access
 *     token + rotated refresh token and persist the new session.
 *  4. On failure, send the user to /login preserving the intended path.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<AuthState>('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadPersistedSession();

      if (getAccessToken()) {
        if (!cancelled) setState('authenticated');
        return;
      }

      const refresh = await getRefreshToken();
      if (!refresh) {
        if (!cancelled) setState('unauthenticated');
        return;
      }

      try {
        const session = await api.auth.refresh(refresh);
        setAccessToken(session.accessToken);
        if (session.refreshToken) await setRefreshToken(session.refreshToken);
        await persistSession(session);
        if (!cancelled) setState('authenticated');
      } catch {
        if (!cancelled) setState('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'checking') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A]">
        <div className="h-8 w-8 animate-pulse rounded-full bg-[#0066FF]/40" />
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
