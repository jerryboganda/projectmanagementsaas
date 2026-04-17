import { ApiError } from "@/lib/api/client";

type ValidationProblemErrors = Record<string, string[]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getApiFieldErrors(error: unknown): ValidationProblemErrors {
  if (!(error instanceof ApiError) || !isRecord(error.payload)) {
    return {};
  }

  const { errors } = error.payload;
  if (!isRecord(errors)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, value.filter((item): item is string => typeof item === "string")];
        }

        if (typeof value === "string") {
          return [key, [value]];
        }

        return [key, []];
      })
      .filter(([, value]) => value.length > 0),
  );
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const fieldErrors = getApiFieldErrors(error);
    const firstFieldError = Object.values(fieldErrors).flat()[0];
    if (firstFieldError) {
      return firstFieldError;
    }

    if (isRecord(error.payload)) {
      if (typeof error.payload.detail === "string" && error.payload.detail.trim()) {
        return error.payload.detail;
      }

      if (typeof error.payload.title === "string" && error.payload.title.trim()) {
        return error.payload.title;
      }
    }

    if (error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    // Map AbortError / TimeoutError to a friendly networking message so the
    // user sees actionable feedback instead of a generic "aborted" string
    // when the backend is unreachable.
    const name = error.name ?? "";
    if (name === "TimeoutError" || name === "AbortError") {
      return "The server didn't respond in time. Check your connection and try again.";
    }
    // Native fetch network failures surface as TypeError: "Failed to fetch"
    if (name === "TypeError" && /fetch|network/i.test(error.message)) {
      return "We couldn't reach the server. Please verify your connection and try again.";
    }
    if (error.message.trim()) {
      return error.message;
    }
  }

  return fallback;
}
