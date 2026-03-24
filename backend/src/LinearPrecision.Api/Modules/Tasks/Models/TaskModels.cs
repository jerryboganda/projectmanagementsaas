using System.Text.Json;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Tasks.Models;

// ── Shared brief ──
public sealed record UserBriefResponse(Guid Id, string FullName, string? AvatarUrl);

// ── Task requests ──
public sealed record CreateTaskRequest(
    Guid ProjectId,
    string Title,
    string? Description,
    TaskItemStatus? Status,
    TaskPriority? Priority,
    string? TaskType,
    List<string>? Labels,
    Guid? AssigneeId,
    Guid? ParentTaskId,
    Guid? SprintId,
    DateOnly? StartDate,
    DateOnly? DueDate,
    int? EstimatePoints,
    decimal? EstimateHours,
    JsonDocument? CustomFields);

public sealed record UpdateTaskRequest(
    string Title,
    string? Description,
    TaskItemStatus Status,
    TaskPriority Priority,
    string? TaskType,
    List<string>? Labels,
    Guid? AssigneeId,
    Guid? ParentTaskId,
    Guid? SprintId,
    DateOnly? StartDate,
    DateOnly? DueDate,
    int? EstimatePoints,
    decimal? EstimateHours,
    int? SortOrder,
    JsonDocument? CustomFields);

public sealed record UpdateTaskStatusRequest(TaskItemStatus Status);

// ── Task responses ──
public sealed record TaskResponse(
    Guid Id,
    Guid ProjectId,
    string Identifier,
    string Title,
    string? Description,
    TaskItemStatus Status,
    TaskPriority Priority,
    string? TaskType,
    List<string> Labels,
    UserBriefResponse? Assignee,
    UserBriefResponse? Creator,
    Guid? ParentTaskId,
    Guid? SprintId,
    DateOnly? StartDate,
    DateOnly? DueDate,
    DateTime? CompletedAt,
    int? EstimatePoints,
    decimal? EstimateHours,
    int SortOrder,
    int CommentCount,
    int AttachmentCount,
    int ChecklistTotal,
    int ChecklistCompleted,
    int WatcherCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);

// ── Comment DTOs ──
public sealed record AddCommentRequest(string Body, Guid? ParentCommentId);
public sealed record EditCommentRequest(string Body);

public sealed record CommentResponse(
    Guid Id,
    Guid TaskId,
    UserBriefResponse Author,
    string Body,
    bool IsEdited,
    Guid? ParentCommentId,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record TaskCommentListItemResponse(
    Guid Id,
    string Content,
    Guid AuthorId,
    string AuthorName,
    string AuthorInitials,
    string? AuthorAvatarUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt);

// ── Checklist DTOs ──
public sealed record AddChecklistItemRequest(string Title, bool? IsCompleted, int? SortOrder);
public sealed record UpdateChecklistItemRequest(string? Title, bool? IsCompleted, int? SortOrder);

public sealed record ChecklistItemResponse(
    Guid Id,
    Guid TaskId,
    string Title,
    bool IsCompleted,
    DateTime? CompletedAt,
    int SortOrder,
    DateTime CreatedAt);

public sealed record TaskChecklistListItemResponse(
    Guid Id,
    string Text,
    bool IsCompleted,
    int SortOrder,
    DateTime CreatedAt);

// ── Dependency DTOs ──
public sealed record AddDependencyRequest(Guid DependsOnTaskId, DependencyType? Type);

public sealed record DependencyResponse(
    Guid Id,
    Guid TaskId,
    Guid DependsOnTaskId,
    DependencyType Type,
    DateTime CreatedAt);

// ── Watcher DTOs ──
public sealed record AddWatcherRequest(Guid UserId);

public sealed record WatcherResponse(
    Guid Id,
    Guid TaskId,
    Guid UserId,
    DateTime CreatedAt);

public sealed record TaskWatcherListItemResponse(
    Guid UserId,
    string UserName,
    string UserInitials,
    string? UserAvatarUrl,
    DateTime AddedAt);

public sealed record TaskAttachmentUploadRequest(
    string FileName,
    string ContentType,
    long FileSizeBytes);

public sealed record TaskAttachmentUploadResponse(
    Guid AttachmentId,
    string UploadUrl);

public sealed record TaskAttachmentListItemResponse(
    Guid Id,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    Guid UploadedById,
    string UploadedByName,
    DateTime CreatedAt,
    string DownloadUrl);
