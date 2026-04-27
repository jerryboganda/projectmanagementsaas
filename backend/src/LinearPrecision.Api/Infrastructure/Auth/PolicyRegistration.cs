using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using LinearPrecision.Shared.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace LinearPrecision.Api.Infrastructure.Auth;

public static class PolicyRegistration
{
    // Aliases kept for backward compatibility. Prefer LinearPrecision.Api.Constants.WorkspaceRoles
    // for new code; both expand to the same authorization policy names.
    public const string WorkspaceOwner = "WorkspaceOwner";
    public const string WorkspaceAdmin = WorkspaceRoles.Admin;
    public const string WorkspaceMember = WorkspaceRoles.Member;
    public const string WorkspaceGuest = WorkspaceRoles.Guest;

    public static IServiceCollection AddAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddScoped<IAuthorizationHandler, WorkspaceRoleAuthorizationHandler>();

        services.AddAuthorizationBuilder()
            .AddPolicy(WorkspaceOwner, policy =>
                policy.AddRequirements(new WorkspaceRoleRequirement(MembershipRole.Owner)))
            .AddPolicy(WorkspaceAdmin, policy =>
                policy.AddRequirements(new WorkspaceRoleRequirement(MembershipRole.Admin)))
            .AddPolicy(WorkspaceMember, policy =>
                policy.AddRequirements(new WorkspaceRoleRequirement(MembershipRole.Member)))
            .AddPolicy(WorkspaceGuest, policy =>
                policy.AddRequirements(new WorkspaceRoleRequirement(MembershipRole.Guest)));

        return services;
    }
}

public sealed record WorkspaceRoleRequirement(MembershipRole MinimumRole) : IAuthorizationRequirement;

public sealed class WorkspaceRoleAuthorizationHandler : AuthorizationHandler<WorkspaceRoleRequirement>
{
    private static readonly DistributedCacheEntryOptions RoleCacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
    };

    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;
    private readonly IDistributedCache _cache;

    public WorkspaceRoleAuthorizationHandler(AppDbContext db, ITenantContext tenantContext, IDistributedCache cache)
    {
        _db = db;
        _tenantContext = tenantContext;
        _cache = cache;
    }

    public static string RoleCacheKey(Guid workspaceId, Guid userId)
        => $"auth:workspace-role:{workspaceId:N}:{userId:N}";

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        WorkspaceRoleRequirement requirement)
    {
        var userId = context.User.GetUserId();
        if (!userId.HasValue || !_tenantContext.WorkspaceId.HasValue)
        {
            return;
        }

        var workspaceId = _tenantContext.WorkspaceId.Value;
        var cacheKey = RoleCacheKey(workspaceId, userId.Value);
        var cachedRoleValue = await _cache.GetStringAsync(cacheKey, CancellationToken.None);

        if (Enum.TryParse<MembershipRole>(cachedRoleValue, out var cachedRole))
        {
            if (SatisfiesRequirement(cachedRole, requirement.MinimumRole))
            {
                context.Succeed(requirement);
            }

            return;
        }

        var role = await _db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(membership =>
                membership.WorkspaceId == workspaceId &&
                membership.UserId == userId.Value &&
                membership.IsActive)
            .Select(membership => (MembershipRole?)membership.Role)
            .FirstOrDefaultAsync();

        if (role.HasValue)
        {
            await _cache.SetStringAsync(cacheKey, role.Value.ToString(), RoleCacheOptions, CancellationToken.None);

            if (SatisfiesRequirement(role.Value, requirement.MinimumRole))
            {
                context.Succeed(requirement);
            }
        }
    }

    private static bool SatisfiesRequirement(MembershipRole actualRole, MembershipRole requiredRole)
        => actualRole switch
        {
            MembershipRole.Owner => true,
            MembershipRole.Admin => requiredRole is MembershipRole.Admin or MembershipRole.Member or MembershipRole.Guest,
            MembershipRole.Member => requiredRole is MembershipRole.Member or MembershipRole.Guest,
            MembershipRole.Guest => requiredRole is MembershipRole.Guest,
            _ => false
        };
}
