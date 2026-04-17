namespace LinearPrecision.Api.Modules.Teams.Models;

public sealed record TeamMemberResponse(
    Guid UserId,
    string FullName,
    string Email,
    string? AvatarUrl);

public sealed record TeamResponse(
    Guid Id,
    string Name,
    string? Description,
    string? Color,
    int MemberCount,
    IReadOnlyList<TeamMemberResponse> Members,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record CreateTeamRequest(
    string Name,
    string? Description,
    string? Color,
    IReadOnlyList<Guid>? MemberIds);

public sealed record UpdateTeamRequest(
    string Name,
    string? Description,
    string? Color);

public sealed record SetTeamMembersRequest(
    IReadOnlyList<Guid> UserIds);
