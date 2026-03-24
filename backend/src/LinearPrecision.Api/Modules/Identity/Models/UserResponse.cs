using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Identity.Models;

public sealed record UserResponse(
    Guid Id,
    string Email,
    string FullName,
    string? DisplayName,
    string? AvatarUrl,
    string? Timezone,
    string? Locale,
    string? JobTitle,
    bool IsActive,
    DateTime CreatedAt);

public sealed record UserWorkspaceResponse(
    Guid WorkspaceId,
    string Name,
    string Slug,
    string? LogoUrl,
    MembershipRole Role,
    DateTime CreatedAt);
