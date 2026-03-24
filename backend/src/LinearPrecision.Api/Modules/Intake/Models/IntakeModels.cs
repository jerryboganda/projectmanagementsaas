using System.Text.Json;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Intake.Models;

// ── Request Form DTOs ──
public sealed record CreateRequestFormRequest(string Title, string? Description, string Slug, bool? IsActive, bool? IsPublic, JsonDocument FormSchema, Guid? DefaultProjectId);
public sealed record UpdateRequestFormRequest(string Title, string? Description, string Slug, bool? IsActive, bool? IsPublic, JsonDocument FormSchema, Guid? DefaultProjectId);
public sealed record RequestFormResponse(Guid Id, string Title, string? Description, string Slug, bool IsActive, bool IsPublic, JsonDocument FormSchema, Guid? DefaultProjectId, DateTime CreatedAt, DateTime UpdatedAt);

// ── Submission DTOs ──
public sealed record SubmitRequest(JsonDocument Data, string? SubmitterEmail, string? SubmitterName);
public sealed record SubmissionResponse(Guid Id, Guid RequestFormId, JsonDocument Data, SubmissionStatus Status, string? SubmitterEmail, Guid? SubmitterUserId, Guid? ConvertedToTaskId, DateTime? ReviewedAt, string? ReviewNotes, DateTime CreatedAt);
public sealed record ReviewSubmissionRequest(SubmissionStatus Status, string? ReviewNotes);

// ── Convert to Task DTOs ──
public sealed record ConvertToTaskRequest(Guid ProjectId, string? Title, TaskPriority? Priority, Guid? AssigneeId);
public sealed record ConvertToTaskResponse(Guid TaskId, string Identifier, string Title);
