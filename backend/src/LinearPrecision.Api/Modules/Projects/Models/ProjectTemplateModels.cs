namespace LinearPrecision.Api.Modules.Projects.Models;

public sealed record ProjectTemplateTaskResponse(
    string Title,
    string Description,
    string Status,
    string Priority,
    IReadOnlyList<string> Subtasks,
    IReadOnlyList<string> Tags);

public sealed record ProjectTemplateResponse(
    Guid Id,
    string Name,
    string? Description,
    string Category,
    string? IconUrl,
    bool IsSystemTemplate,
    IReadOnlyList<ProjectTemplateTaskResponse> TaskTemplates,
    DateTime CreatedAt,
    DateTime UpdatedAt);

internal sealed record ProjectTemplatePayload(
    string Category,
    IReadOnlyList<ProjectTemplateTaskResponse> TaskTemplates);
