import { describe, expect, it } from "vitest";
import { ApiError } from "./client";

describe("ApiError", () => {
  it("is an Error subclass", () => {
    const err = new ApiError("Boom", 500, null);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });

  it("preserves message, status, and payload", () => {
    const payload = { errors: { email: ["required"] } };
    const err = new ApiError("Validation failed", 400, payload);
    expect(err.message).toBe("Validation failed");
    expect(err.status).toBe(400);
    expect(err.payload).toBe(payload);
  });

  it("has name set to ApiError for identification", () => {
    const err = new ApiError("x", 404, null);
    expect(err.name).toBe("ApiError");
  });

  it("supports null/undefined payloads", () => {
    expect(new ApiError("x", 401, null).payload).toBeNull();
    expect(new ApiError("x", 401, undefined).payload).toBeUndefined();
  });

  it("captures stack trace", () => {
    const err = new ApiError("x", 500, null);
    expect(typeof err.stack).toBe("string");
    expect(err.stack).toContain("ApiError");
  });
});
