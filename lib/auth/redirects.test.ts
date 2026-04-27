import { describe, expect, it } from "vitest";
import { normalizeAppRedirect } from "./redirects";

describe("normalizeAppRedirect", () => {
  it("returns null for nullish input", () => {
    expect(normalizeAppRedirect(null)).toBeNull();
    expect(normalizeAppRedirect(undefined)).toBeNull();
    expect(normalizeAppRedirect("")).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(normalizeAppRedirect("   ")).toBeNull();
  });

  it("rejects protocol-relative URLs", () => {
    expect(normalizeAppRedirect("//evil.com/foo")).toBeNull();
    expect(normalizeAppRedirect("  //evil.com")).toBeNull();
  });

  it("rejects absolute URLs", () => {
    expect(normalizeAppRedirect("https://evil.com")).toBeNull();
    expect(normalizeAppRedirect("http://example.com/path")).toBeNull();
  });

  it("rejects paths that don't start with /", () => {
    expect(normalizeAppRedirect("dashboard")).toBeNull();
    expect(normalizeAppRedirect("./relative")).toBeNull();
  });

  it("accepts valid app-internal paths", () => {
    expect(normalizeAppRedirect("/dashboard")).toBe("/dashboard");
    expect(normalizeAppRedirect("/projects/123?foo=bar")).toBe("/projects/123?foo=bar");
    expect(normalizeAppRedirect("/")).toBe("/");
  });

  it("trims whitespace from valid paths", () => {
    expect(normalizeAppRedirect("  /home  ")).toBe("/home");
  });
});
