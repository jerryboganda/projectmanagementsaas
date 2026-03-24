using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Extensions;

namespace LinearPrecision.Api.Infrastructure.Auth;

public sealed class CurrentUserAccessor : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private System.Security.Claims.ClaimsPrincipal? Principal
        => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId => Principal?.GetUserId();

    public string? Email => Principal?.GetEmail();

    public string? FullName => Principal?.GetFullName();

    public bool IsAuthenticated
        => Principal?.Identity?.IsAuthenticated ?? false;

    public IReadOnlyList<string> Roles
        => Principal?.FindAll(System.Security.Claims.ClaimTypes.Role)
               .Select(c => c.Value)
               .ToList()
           ?? [];
}
