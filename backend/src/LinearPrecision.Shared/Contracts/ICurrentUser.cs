namespace LinearPrecision.Shared.Contracts;

/// <summary>
/// Provides the current authenticated user context.
/// </summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    string? FullName { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
}
