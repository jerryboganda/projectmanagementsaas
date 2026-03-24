namespace LinearPrecision.Api.Modules.Identity.Models;

public record AuthSessionResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType,
    UserResponse User,
    Guid? ActiveWorkspaceId,
    IReadOnlyList<UserWorkspaceResponse> Workspaces);

[Obsolete("Use AuthSessionResponse instead.")]
public sealed record TokenResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType,
    UserResponse User,
    Guid? ActiveWorkspaceId,
    IReadOnlyList<UserWorkspaceResponse> Workspaces)
    : AuthSessionResponse(
        AccessToken,
        RefreshToken,
        ExpiresIn,
        TokenType,
        User,
        ActiveWorkspaceId,
        Workspaces);
