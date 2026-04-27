import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  truncate,
  groupBy,
  slugify,
  getInitials,
  formatNumber,
  formatDate,
  debounce,
} from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "no", "yes")).toBe("base yes");
  });

  it("dedupes Tailwind conflicts via tailwind-merge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("truncate", () => {
  it("returns string unchanged when under limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });

  it("trims trailing whitespace before ellipsis", () => {
    expect(truncate("hello  world", 6)).toBe("hello…");
  });
});

describe("groupBy", () => {
  it("groups by string key", () => {
    const items = [
      { type: "a", v: 1 },
      { type: "b", v: 2 },
      { type: "a", v: 3 },
    ];
    expect(groupBy(items, "type")).toEqual({
      a: [
        { type: "a", v: 1 },
        { type: "a", v: 3 },
      ],
      b: [{ type: "b", v: 2 }],
    });
  });

  it("groups by computed key function", () => {
    const items = [1, 2, 3, 4];
    expect(groupBy(items, (n) => (n % 2 === 0 ? "even" : "odd"))).toEqual({
      odd: [1, 3],
      even: [2, 4],
    });
  });

  it("returns empty object for empty input", () => {
    expect(groupBy([], "x" as never)).toEqual({});
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips punctuation", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses multiple separators", () => {
    expect(slugify("foo   bar___baz")).toBe("foo-bar-baz");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("--foo--")).toBe("foo");
  });
});

describe("getInitials", () => {
  it("returns first letter for single name", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("returns first + last initial for multi-word names", () => {
    expect(getInitials("Alice Bob Carol")).toBe("AC");
  });

  it("uppercases initials", () => {
    expect(getInitials("alice bob")).toBe("AB");
  });

  it("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });
});

describe("formatNumber", () => {
  it("formats a plain number with thousand separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formats compact", () => {
    expect(formatNumber(1500, { compact: true })).toBe("1.5K");
  });

  it("formats currency", () => {
    expect(formatNumber(99.5, { currency: "USD" })).toContain("99.50");
  });

  it("formats percentage", () => {
    expect(formatNumber(42, { percentage: true })).toBe("42%");
  });
});

describe("formatDate", () => {
  it("returns 'Invalid date' for non-parseable input", () => {
    expect(formatDate("not-a-date")).toBe("Invalid date");
  });

  it("returns relative 'just now' within the last minute", () => {
    const d = new Date(Date.now() - 5_000);
    expect(formatDate(d, "relative")).toBe("just now");
  });

  it("returns relative minutes", () => {
    const d = new Date(Date.now() - 5 * 60_000);
    expect(formatDate(d, "relative")).toBe("5 minutes ago");
  });

  it("formats short date", () => {
    expect(formatDate(new Date("2026-04-26T12:00:00Z"), "short")).toMatch(
      /Apr/
    );
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes the callback only after the delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("passes arguments to the callback", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);

    debounced("a", 1);
    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledWith("a", 1);
  });
});
