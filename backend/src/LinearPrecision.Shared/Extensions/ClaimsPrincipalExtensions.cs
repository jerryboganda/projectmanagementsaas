using System.Security.Claims;

namespace LinearPrecision.Shared.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst(ClaimTypes.NameIdentifier)
            ?? principal.FindFirst("sub");
        return claim is not null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    public static string? GetEmail(this ClaimsPrincipal principal)
        => principal.FindFirst(ClaimTypes.Email)?.Value;

    public static string? GetFullName(this ClaimsPrincipal principal)
        => principal.FindFirst(ClaimTypes.Name)?.Value
        ?? principal.FindFirst("name")?.Value;
}
