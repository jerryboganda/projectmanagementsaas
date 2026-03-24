"use client";

import {
  type AuthSessionResponse,
  type CreateWorkspaceRequest,
  type ForgotPasswordRequest,
  type LoginRequest,
  type PersistedAuthSession,
  type RegisterRequest,
  type ResetPasswordRequest,
  type WorkspaceResponse,
} from "@/lib/api/contracts";
import { createApiClient, type LinearPrecisionApiClient } from "@/lib/api/client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  apiClient: LinearPrecisionApiClient;
  session: PersistedAuthSession | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (input: LoginRequest) => Promise<PersistedAuthSession>;
  register: (input: RegisterRequest) => Promise<PersistedAuthSession>;
  forgotPassword: (input: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (input: ResetPasswordRequest) => Promise<void>;
  refresh: () => Promise<PersistedAuthSession | null>;
  logout: () => Promise<void>;
  createWorkspace: (input: CreateWorkspaceRequest) => Promise<WorkspaceResponse>;
  acceptInvitation: (token: string) => Promise<PersistedAuthSession>;
  setActiveWorkspaceId: (workspaceId: string) => Promise<PersistedAuthSession>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toPersistedSession(session: AuthSessionResponse): PersistedAuthSession {
  return {
    accessToken: session.accessToken,
    expiresAt: Date.now() + session.expiresIn * 1000,
    tokenType: session.tokenType,
    user: session.user,
    activeWorkspaceId: session.activeWorkspaceId ?? null,
    workspaces: session.workspaces,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PersistedAuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const applySession = useCallback((nextSession: PersistedAuthSession | null) => {
    setSession(nextSession);
    setStatus(nextSession ? "authenticated" : "anonymous");
    return nextSession;
  }, []);

  const apiClient = useMemo(
    () =>
      createApiClient({
        accessToken: session?.accessToken ?? null,
        workspaceId: session?.activeWorkspaceId ?? null,
      }),
    [session?.accessToken, session?.activeWorkspaceId],
  );

  const refresh = useCallback(async () => {
    try {
      const refreshed = await createApiClient().refresh();
      return applySession(toPersistedSession(refreshed));
    } catch {
      return applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const refreshed = await createApiClient().refresh();
        if (isMounted) {
          applySession(toPersistedSession(refreshed));
        }
      } catch {
        if (isMounted) {
          applySession(null);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [applySession]);

  const login = useCallback(
    async (input: LoginRequest) => {
      const nextSession = toPersistedSession(await createApiClient().login(input));
      return applySession(nextSession)!;
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterRequest) => {
      const nextSession = toPersistedSession(await createApiClient().register(input));
      return applySession(nextSession)!;
    },
    [applySession],
  );

  const forgotPassword = useCallback(async (input: ForgotPasswordRequest) => {
    await createApiClient().forgotPassword(input);
  }, []);

  const resetPassword = useCallback(async (input: ResetPasswordRequest) => {
    await createApiClient().resetPassword(input);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } finally {
      applySession(null);
    }
  }, [apiClient, applySession]);

  const createWorkspace = useCallback(
    async (input: CreateWorkspaceRequest) => apiClient.createWorkspace(input),
    [apiClient],
  );

  const acceptInvitation = useCallback(
    async (token: string) => {
      const nextSession = toPersistedSession(await apiClient.acceptInvitation(token));
      return applySession(nextSession)!;
    },
    [apiClient, applySession],
  );

  const setActiveWorkspaceId = useCallback(
    async (workspaceId: string) => {
      const nextSession = toPersistedSession(await apiClient.setActiveWorkspace(workspaceId));
      return applySession(nextSession)!;
    },
    [apiClient, applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      apiClient,
      session,
      status,
      isAuthenticated: status === "authenticated" && !!session,
      login,
      register,
      forgotPassword,
      resetPassword,
      refresh,
      logout,
      createWorkspace,
      acceptInvitation,
      setActiveWorkspaceId,
    }),
    [
      apiClient,
      session,
      status,
      login,
      register,
      forgotPassword,
      resetPassword,
      refresh,
      logout,
      createWorkspace,
      acceptInvitation,
      setActiveWorkspaceId,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
