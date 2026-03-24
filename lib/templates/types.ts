import type { ProjectTemplateResponse } from "@/lib/api/contracts";

export type ProjectTemplate = ProjectTemplateResponse;
export type TemplateCategory = ProjectTemplate["category"];
export type TemplateTask = ProjectTemplate["taskTemplates"][number];

export function getTemplateTaskCount(template: Pick<ProjectTemplate, "taskTemplates">) {
  return template.taskTemplates.length;
}

export function getTemplateSubtaskCount(template: Pick<ProjectTemplate, "taskTemplates">) {
  return template.taskTemplates.reduce(
    (total, task) => total + task.subtasks.length,
    0,
  );
}

export function buildProjectIdentifier(projectName: string) {
  const words = projectName.match(/[A-Za-z0-9]+/g) ?? [];
  const initials = words
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  const randomSuffix = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const candidate = `${initials || "PRJ"}${randomSuffix}`.replace(/[^A-Z0-9]/g, "");
  const normalized = /^[A-Z]/.test(candidate) ? candidate : `P${candidate}`;
  return normalized.slice(0, 10);
}
