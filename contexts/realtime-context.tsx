"use client";

import { useAuth } from "@/contexts/auth-context";
import { useWorkspace } from "@/contexts/workspace-context";
import { createApiClient } from "@/lib/api/client";
import { getRuntimeConfig } from "@/lib/runtime/runtime-config";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";

interface RealtimeContextValue {
  connect: (hubPath: string) => Promise<HubConnection>;
  disconnectAll: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const connectionsRef = useRef(new Map<string, HubConnection>());
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const { activeWorkspaceId } = useWorkspace();
  const previousWorkspaceIdRef = useRef<string | null | undefined>(activeWorkspaceId);

  const disconnectAll = useCallback(async () => {
    const activeConnections = Array.from(connectionsRef.current.values());
    connectionsRef.current.clear();
    await Promise.allSettled(activeConnections.map((connection) => connection.stop()));
  }, []);

  useEffect(() => {
    if (!accessToken) {
      void disconnectAll();
    }
  }, [accessToken, disconnectAll]);

  useEffect(() => {
    void disconnectAll();
  }, [accessToken, activeWorkspaceId, disconnectAll]);

  useEffect(() => {
    if (previousWorkspaceIdRef.current === activeWorkspaceId) {
      return;
    }

    previousWorkspaceIdRef.current = activeWorkspaceId;
    void disconnectAll();
  }, [activeWorkspaceId, disconnectAll]);

  const connect = useCallback(
    async (hubPath: string) => {
      if (!accessToken || !activeWorkspaceId) {
        throw new Error("Realtime connection requires an authenticated workspace session.");
      }

      const existingConnection = connectionsRef.current.get(hubPath);
      if (existingConnection) {
        if (existingConnection.state === HubConnectionState.Disconnected) {
          try {
            await existingConnection.start();
          } catch {
            // Connection failed — app continues in offline/polling mode
          }
        }
        return existingConnection;
      }

      const { signalRBaseUrl } = getRuntimeConfig();
      const hubUrl = new URL(hubPath, signalRBaseUrl);

      if (activeWorkspaceId) {
        hubUrl.searchParams.set("workspaceId", activeWorkspaceId);
      }

      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl.toString(), {
          accessTokenFactory: async () => {
            const tokenClient = createApiClient({
              accessToken,
              workspaceId: activeWorkspaceId,
            });
            const hubToken = await tokenClient.createHubToken({
              hubPath,
              workspaceId: activeWorkspaceId,
            });
            return hubToken.accessToken;
          },
          // Only use LongPolling as final fallback so WebSocket errors are suppressed
          transport: undefined,
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(LogLevel.None)
        .build();

      connectionsRef.current.set(hubPath, connection);

      try {
        await connection.start();
      } catch {
        // Hub unavailable — remove from map so next call retries
        connectionsRef.current.delete(hubPath);
      }

      return connection;
    },
    [accessToken, activeWorkspaceId],
  );

  return (
    <RealtimeContext.Provider value={{ connect, disconnectAll }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }

  return context;
}
