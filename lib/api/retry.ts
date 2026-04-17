import { ApiError } from "@/lib/api/client";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryOn?: (error: unknown) => boolean;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === "AbortError") return false;
  return false;
}

function defaultRetryOn(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 429) return true;
    if (error.status >= 500) return true;
    return false;
  }
  return isNetworkError(error);
}

function jitter(): number {
  return Math.random() * 500;
}

function computeDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
): number {
  const exponential = baseDelay * Math.pow(2, attempt);
  return Math.min(exponential + jitter(), maxDelay);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 10000;
  const retryOn = options?.retryOn ?? defaultRetryOn;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      if (attempt >= maxRetries || !retryOn(error)) {
        throw error;
      }

      const delay = computeDelay(attempt, baseDelay, maxDelay);
      await sleep(delay);
    }
  }

  throw lastError;
}
