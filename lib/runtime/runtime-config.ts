const DEFAULT_API_BASE_URL = "http://localhost:5156";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const WORKSPACE_HEADER = "X-Workspace-Id";

export function getRuntimeConfig() {
  const apiBaseUrl = trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
  );
  const signalRBaseUrl = trimTrailingSlash(
    process.env.NEXT_PUBLIC_SIGNALR_BASE_URL || apiBaseUrl,
  );

  return {
    apiBaseUrl,
    signalRBaseUrl,
  };
}
