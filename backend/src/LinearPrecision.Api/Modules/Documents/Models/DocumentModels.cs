namespace LinearPrecision.Api.Modules.Documents.Models;

// ── Response DTOs ──
public sealed record DocumentResponse(
    Guid Id,
    Guid WorkspaceId,
    string Title,
    string? Content,
    string ContentFormat,
    Guid? ProjectId,
    Guid? ParentDocumentId,
    UserBriefResponse Creator,
    bool IsPublished,
    DateTime? PublishedAt,
    int SortOrder,
    List<DocumentResponse>? ChildDocuments,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserBriefResponse(
    Guid Id,
    string FullName,
    string? AvatarUrl);

// ── Request DTOs ──
public sealed record CreateDocumentRequest(
    string Title,
    string? Content,
    string? ContentFormat,
    Guid? ProjectId,
    Guid? ParentDocumentId,
    bool? IsPublished,
    int? SortOrder);

public sealed record UpdateDocumentRequest(
    string Title,
    string? Content,
    string? ContentFormat,
    Guid? ProjectId,
    Guid? ParentDocumentId,
    bool? IsPublished,
    int? SortOrder);
