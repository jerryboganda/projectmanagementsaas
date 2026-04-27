import { describe, expect, it } from "vitest";
import { getTemplateSubtaskCount, getTemplateTaskCount } from "./types";

type TaskStandIn = { subtasks: unknown[] };
type TaskTemplates = Parameters<typeof getTemplateTaskCount>[0]["taskTemplates"];

describe("getTemplateTaskCount", () => {
  it("returns 0 for empty template", () => {
    expect(getTemplateTaskCount({ taskTemplates: [] })).toBe(0);
  });

  it("returns count of top-level tasks", () => {
    const tasks: TaskStandIn[] = [{ subtasks: [] }, { subtasks: [] }, { subtasks: [] }];
    expect(getTemplateTaskCount({ taskTemplates: tasks as unknown as TaskTemplates })).toBe(3);
  });
});

describe("getTemplateSubtaskCount", () => {
  it("returns 0 when no tasks", () => {
    expect(getTemplateSubtaskCount({ taskTemplates: [] })).toBe(0);
  });

  it("sums subtasks across all tasks", () => {
    const tasks: TaskStandIn[] = [
      { subtasks: [{}, {}] },
      { subtasks: [{}, {}, {}] },
      { subtasks: [] },
    ];
    expect(getTemplateSubtaskCount({ taskTemplates: tasks as unknown as TaskTemplates })).toBe(5);
  });
});
