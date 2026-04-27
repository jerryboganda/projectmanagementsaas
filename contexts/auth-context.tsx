"use client";

import {
  type AuthSessionResponse,
  type ConfirmEmailRequest,
  type CreateWorkspaceRequest,
  type ForgotPasswordRequest,
  isMfaChallenge,
  type LoginRequest,
  type LoginResult,
  type MfaChallengeResponse,
  type PersistedAuthSession,
  type RegisterRequest,
  type RegistrationPendingResponse,
  type ResendConfirmationRequest,
  type ResetPasswordRequest,
  type VerifyMfaLoginRequest,
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
  login: (input: LoginRequest) => Promise<PersistedAuthSession | MfaChallengeResponse>;
  verifyMfaLogin: (input: VerifyMfaLoginRequest) => Promise<PersistedAuthSession>;
  register: (input: RegisterRequest) => Promise<RegistrationPendingResponse>;
  confirmEmail: (input: ConfirmEmailRequest) => Promise<void>;
  resendEmailConfirmation: (input: ResendConfirmationRequest) => Promise<void>;
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8_000);
      try {
        const refreshed = await createApiClient().refresh({ signal: controller.signal });
        return applySession(toPersistedSession(refreshed));
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      return applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        // Cap refresh at 8s so a hung/unreachable backend does not trap the
        // user on the "Restoring your session" splash indefinitely.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8_000);
        try {
          const refreshed = await createApiClient().refresh({ signal: controller.signal });
          if (isMounted) {
            applySession(toPersistedSession(refreshed));
          }
        } finally {
          clearTimeout(timeoutId);
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
      const result: LoginResult = await createApiClient().login(input);
      if (isMfaChallenge(result)) {
        // Caller is responsible for prompting for the TOTP code and calling
        // verifyMfaLogin. The session has not been established yet.
        return result;
      }
      const nextSession = toPersistedSession(result);
      return applySession(nextSession)!;
    },
    [applySession],
  );

  const verifyMfaLogin = useCallback(
    async (input: VerifyMfaLoginRequest) => {
      const session = await createApiClient().verifyMfaLogin(input);
      const nextSession = toPersistedSession(session);
      return applySession(nextSession)!;
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterRequest) => {
      const pendingRegistration = await createApiClient().register(input);
      applySession(null);
      return pendingRegistration;
    },
    [applySession],
  );

  const confirmEmail = useCallback(async (input: ConfirmEmailRequest) => {
    await createApiClient().confirmEmail(input);
  }, []);

  const resendEmailConfirmation = useCallback(async (input: ResendConfirmationRequest) => {
    await createApiClient().resendEmailConfirmation(input);
  }, []);

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
      verifyMfaLogin,
      register,
      confirmEmail,
      resendEmailConfirmation,
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
      verifyMfaLogin,
      register,
      confirmEmail,
      resendEmailConfirmation,
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
