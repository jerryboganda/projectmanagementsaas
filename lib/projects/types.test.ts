import { describe, expect, it } from "vitest";
import {
  buildProjectIdentifier,
  calculateProjectProgress,
  toApiProjectStatus,
} from "./types";

describe("calculateProjectProgress", () => {
  it("returns 0 when taskCount is 0", () => {
    expect(calculateProjectProgress(0, 0)).toBe(0);
  });

  it("returns 0 for negative taskCount", () => {
    expect(calculateProjectProgress(-5, 2)).toBe(0);
  });

  it("returns 100 when fully complete", () => {
    expect(calculateProjectProgress(10, 10)).toBe(100);
  });

  it("rounds progress to nearest integer", () => {
    expect(calculateProjectProgress(3, 1)).toBe(33);
    expect(calculateProjectProgress(3, 2)).toBe(67);
  });

  it("returns 50 for half-completed", () => {
    expect(calculateProjectProgress(8, 4)).toBe(50);
  });
});

describe("buildProjectIdentifier", () => {
  it("uses initials when at least two words", () => {
    expect(buildProjectIdentifier("Acme Project")).toBe("AP");
    expect(buildProjectIdentifier("Big Hairy Audacious Goal")).toBe("BHAG");
  });

  it("falls back to uppercased letters when single word", () => {
    expect(buildProjectIdentifier("phoenix")).toBe("PHOENIX");
  });

  it("strips non-alphanumeric characters from fallback", () => {
    expect(buildProjectIdentifier("hello-world")).toBe("HW");
  });

  it("returns PRJ when name has no usable characters", () => {
    expect(buildProjectIdentifier("---")).toBe("PRJ");
    expect(buildProjectIdentifier("")).toBe("PRJ");
  });

  it("pads single-letter identifiers to length 2", () => {
    expect(buildProjectIdentifier("A")).toBe("AX");
  });

  it("truncates to 10 characters max", () => {
    expect(buildProjectIdentifier("A B C D E F G H I J K L").length).toBeLessThanOrEqual(10);
  });

  it("uppercases the result", () => {
    expect(buildProjectIdentifier("acme project")).toBe("AP");
  });
});

describe("toApiProjectStatus", () => {
  it("maps Paused to Paused", () => {
    expect(toApiProjectStatus("Paused")).toBe("Paused");
  });

  it("maps Completed to Completed", () => {
    expect(toApiProjectStatus("Completed")).toBe("Completed");
  });

  it("maps everything else to Active", () => {
    expect(toApiProjectStatus("Planning")).toBe("Active");
    expect(toApiProjectStatus("In Progress")).toBe("Active");
  });
});
