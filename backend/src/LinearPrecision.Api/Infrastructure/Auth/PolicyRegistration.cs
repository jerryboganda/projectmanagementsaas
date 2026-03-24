using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using LinearPrecision.Shared.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Infrastructure.Auth;

public static class PolicyRegistration
{
    public const string WorkspaceOwner = nameof(WorkspaceOwner);
    public const string WorkspaceAdmin = nameof(WorkspaceAdmin);
    public const string WorkspaceMember = nameof(WorkspaceMember);
    public const string WorkspaceGuest = nameof(WorkspaceGuest);

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
    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;

    public WorkspaceRoleAuthorizationHandler(AppDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        WorkspaceRoleRequirement requirement)
    {
        var userId = context.User.GetUserId();
        if (!userId.HasValue || !_tenantContext.WorkspaceId.HasValue)
        {
            return;
        }

        var role = await _db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(membership =>
                membership.WorkspaceId == _tenantContext.WorkspaceId.Value &&
                membership.UserId == userId.Value &&
                membership.IsActive)
            .Select(membership => (MembershipRole?)membership.Role)
            .FirstOrDefaultAsync();

        if (role.HasValue && SatisfiesRequirement(role.Value, requirement.MinimumRole))
        {
            context.Succeed(requirement);
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
