using System.Text.Json;
using System.Text.RegularExpressions;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Workspace.Endpoints;

public static partial class WorkspaceEndpoints
{
    // ── Slug helper ──
    internal static string GenerateSlug(string name)
    {
        var slug = name.ToLowerInvariant();
        slug = slug.Replace(' ', '-');
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", string.Empty);
        slug = Regex.Replace(slug, @"-{2,}", "-");
        slug = slug.Trim('-');
        return slug;
    }

    private static async Task<IResult?> RequireWorkspaceRoleAsync(
        Guid workspaceId,
        MembershipRole minimumRole,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        if (!currentUser.UserId.HasValue)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: StatusCodes.Status401Unauthorized);
        }

        var role = await db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(membership =>
                membership.WorkspaceId == workspaceId
                && membership.UserId == currentUser.UserId.Value
                && membership.IsActive)
            .Select(membership => (MembershipRole?)membership.Role)
            .FirstOrDefaultAsync(ct);

        if (!role.HasValue || !SatisfiesRequirement(role.Value, minimumRole))
        {
            return Results.Problem(
                title: ProblemTitles.Forbidden,
                detail: "You do not have permission to access this workspace.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        return null;
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

    private static string ReadSetting(JsonDocument? settings, string key, string fallback)
    {
        if (settings is null || settings.RootElement.ValueKind != JsonValueKind.Object)
        {
            return fallback;
        }

        if (settings.RootElement.TryGetProperty(key, out var property)
            && property.ValueKind == JsonValueKind.String)
        {
            var value = property.GetString();
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return fallback;
    }
}
