import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getRuntimeConfig, WORKSPACE_HEADER } from "./runtime-config";

describe("WORKSPACE_HEADER", () => {
  it("is the canonical workspace id header name", () => {
    expect(WORKSPACE_HEADER).toBe("X-Workspace-Id");
  });
});

describe("getRuntimeConfig", () => {
  const originalApi = process.env.NEXT_PUBLIC_API_BASE_URL;
  const originalSignalR = process.env.NEXT_PUBLIC_SIGNALR_BASE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_SIGNALR_BASE_URL;
  });

  afterEach(() => {
    if (originalApi !== undefined) process.env.NEXT_PUBLIC_API_BASE_URL = originalApi;
    if (originalSignalR !== undefined) process.env.NEXT_PUBLIC_SIGNALR_BASE_URL = originalSignalR;
  });

  it("falls back to localhost:5156 when env not set", () => {
    const cfg = getRuntimeConfig();
    expect(cfg.apiBaseUrl).toBe("http://localhost:5156");
    expect(cfg.signalRBaseUrl).toBe("http://localhost:5156");
  });

  it("uses NEXT_PUBLIC_API_BASE_URL when provided", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    const cfg = getRuntimeConfig();
    expect(cfg.apiBaseUrl).toBe("https://api.example.com");
  });

  it("strips trailing slash from api base url", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/";
    expect(getRuntimeConfig().apiBaseUrl).toBe("https://api.example.com");
  });

  it("defaults signalRBaseUrl to apiBaseUrl when not set", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    expect(getRuntimeConfig().signalRBaseUrl).toBe("https://api.example.com");
  });

  it("uses NEXT_PUBLIC_SIGNALR_BASE_URL when provided independently", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    process.env.NEXT_PUBLIC_SIGNALR_BASE_URL = "https://hub.example.com/";
    const cfg = getRuntimeConfig();
    expect(cfg.signalRBaseUrl).toBe("https://hub.example.com");
  });
});
