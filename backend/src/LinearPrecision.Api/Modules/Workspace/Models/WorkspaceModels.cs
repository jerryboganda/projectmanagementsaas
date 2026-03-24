using System.Text.Json;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Workspace.Models;

// ── Response DTOs ──
public sealed record WorkspaceResponse(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? LogoUrl,
    string? Domain,
    MembershipRole? CurrentUserRole,
    int MemberCount,
    DateTime CreatedAt);

public sealed record WorkspaceSettingsResponse(
    Guid WorkspaceId,
    string Name,
    string Slug,
    string? Description,
    string? LogoUrl,
    string? Domain,
    MembershipRole? CurrentUserRole,
    string Timezone,
    string DateFormat,
    string TimeFormat,
    string WeekStartsOn);

public sealed record MemberResponse(
    Guid Id,
    Guid UserId,
    string Email,
    string FullName,
    string? AvatarUrl,
    MembershipRole Role,
    bool IsActive,
    DateTime? JoinedAt);

public sealed record InvitationDetailsResponse(
    Guid WorkspaceId,
    string WorkspaceName,
    string Email,
    MembershipRole Role,
    InvitationStatus Status,
    DateTime ExpiresAt);

// ── Request DTOs ──
public sealed record CreateWorkspaceRequest(
    string Name,
    string? Description);

public sealed record UpdateWorkspaceRequest(
    string? Name,
    string? Description,
    string? LogoUrl,
    string? Domain);

public sealed record InviteMemberRequest(
    string Email,
    MembershipRole Role,
    List<Guid>? ProjectIds);

public sealed record UpdateMemberRoleRequest(
    MembershipRole Role);

public sealed record UpdateSettingsRequest(
    JsonDocument Settings);
