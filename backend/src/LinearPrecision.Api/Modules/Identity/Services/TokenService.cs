using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

namespace LinearPrecision.Api.Modules.Identity.Services;

public interface ITokenService
{
    Task<AuthSessionResponse> GenerateTokenPairAsync(User user, Guid? activeWorkspaceId = null);
    Task<AuthSessionResponse?> RefreshAsync(string refreshToken);
    Task RevokeAsync(string accessTokenJti, string? refreshToken);
}

public sealed class TokenService : ITokenService
{
    private readonly JwtTokenGenerator _jwtGenerator;
    private readonly IConnectionMultiplexer _redis;
    private readonly UserManager<User> _userManager;
    private readonly AppDbContext _db;

    private const int AccessTokenExpirySeconds = 900; // 15 minutes
    private static readonly TimeSpan RefreshTokenExpiry = TimeSpan.FromDays(7);
    private static readonly TimeSpan BlocklistExpiry = TimeSpan.FromMinutes(15);

    private const string RefreshTokenKeyPrefix = "rt:";
    private const string BlocklistKeyPrefix = "blocklist:at:";

    public TokenService(
        JwtTokenGenerator jwtGenerator,
        IConnectionMultiplexer redis,
        UserManager<User> userManager,
        AppDbContext db)
    {
        _jwtGenerator = jwtGenerator;
        _redis = redis;
        _userManager = userManager;
        _db = db;
    }

    public async Task<AuthSessionResponse> GenerateTokenPairAsync(User user, Guid? activeWorkspaceId = null)
    {
        var session = await BuildSessionAsync(user, activeWorkspaceId);
        var accessToken = _jwtGenerator.GenerateAccessToken(
            user,
            session.ActiveWorkspaceRole,
            session.ActiveWorkspaceId);
        var refreshToken = JwtTokenGenerator.GenerateRefreshToken();

        var tokenHash = HashToken(refreshToken);
        var db = _redis.GetDatabase();
        var data = new RefreshTokenEntry(
            UserId: user.Id,
            ActiveWorkspaceId: session.ActiveWorkspaceId,
            CreatedAt: DateTime.UtcNow,
            ExpiresAt: DateTime.UtcNow.Add(RefreshTokenExpiry));

        var json = JsonSerializer.Serialize(data);
        await db.StringSetAsync($"{RefreshTokenKeyPrefix}{tokenHash}", json, RefreshTokenExpiry);

        return new AuthSessionResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresIn: AccessTokenExpirySeconds,
            TokenType: "Bearer",
            User: MapToUserResponse(user),
            ActiveWorkspaceId: session.ActiveWorkspaceId,
            Workspaces: session.Workspaces);
    }

    public async Task<AuthSessionResponse?> RefreshAsync(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var db = _redis.GetDatabase();

        var json = await db.StringGetAsync($"{RefreshTokenKeyPrefix}{tokenHash}");
        if (json.IsNullOrEmpty)
        {
            return null;
        }

        var entry = JsonSerializer.Deserialize<RefreshTokenEntry>(json!);
        if (entry is null || entry.ExpiresAt < DateTime.UtcNow)
        {
            return null;
        }

        await db.KeyDeleteAsync($"{RefreshTokenKeyPrefix}{tokenHash}");

        var user = await _userManager.FindByIdAsync(entry.UserId.ToString());
        if (user is null || !user.IsActive)
        {
            return null;
        }

        return await GenerateTokenPairAsync(user, entry.ActiveWorkspaceId);
    }

    public async Task RevokeAsync(string accessTokenJti, string? refreshToken)
    {
        var db = _redis.GetDatabase();

        if (!string.IsNullOrEmpty(accessTokenJti))
        {
            await db.StringSetAsync(
                $"{BlocklistKeyPrefix}{accessTokenJti}",
                "revoked",
                BlocklistExpiry);
        }

        if (!string.IsNullOrEmpty(refreshToken))
        {
            var tokenHash = HashToken(refreshToken);
            await db.KeyDeleteAsync($"{RefreshTokenKeyPrefix}{tokenHash}");
        }
    }

    private async Task<AuthSessionSnapshot> BuildSessionAsync(User user, Guid? preferredWorkspaceId)
    {
        var workspaces = await _db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(membership => membership.UserId == user.Id && membership.IsActive)
            .Join(
                _db.Workspaces.AsNoTracking().IgnoreQueryFilters().Where(workspace => !workspace.IsDeleted),
                membership => membership.WorkspaceId,
                workspace => workspace.Id,
                (membership, workspace) => new
                {
                    Workspace = workspace,
                    membership.Role
                })
            .OrderBy(item => item.Workspace.CreatedAt)
            .Select(item => new UserWorkspaceResponse(
                item.Workspace.Id,
                item.Workspace.Name,
                item.Workspace.Slug,
                item.Workspace.LogoUrl,
                item.Role,
                item.Workspace.CreatedAt))
            .ToListAsync();

        Guid? resolvedWorkspaceId = null;
        var persistedWorkspaceId = user.LastActiveWorkspaceId;
        if (preferredWorkspaceId.HasValue && workspaces.Any(workspace => workspace.WorkspaceId == preferredWorkspaceId.Value))
        {
            resolvedWorkspaceId = preferredWorkspaceId.Value;
        }
        else if (persistedWorkspaceId.HasValue && workspaces.Any(workspace => workspace.WorkspaceId == persistedWorkspaceId.Value))
        {
            resolvedWorkspaceId = persistedWorkspaceId.Value;
        }
        else
        {
            resolvedWorkspaceId = workspaces.FirstOrDefault()?.WorkspaceId;
        }

        var activeWorkspaceRole = workspaces
            .Where(workspace => workspace.WorkspaceId == resolvedWorkspaceId)
            .Select(workspace => (MembershipRole?)workspace.Role)
            .FirstOrDefault();

        return new AuthSessionSnapshot(
            Workspaces: workspaces,
            ActiveWorkspaceId: resolvedWorkspaceId,
            ActiveWorkspaceRole: activeWorkspaceRole);
    }

    private static UserResponse MapToUserResponse(User user) => new(
        Id: user.Id,
        Email: user.Email ?? string.Empty,
        FullName: user.FullName,
        DisplayName: user.DisplayName,
        AvatarUrl: user.AvatarUrl,
        Timezone: user.Timezone,
        Locale: user.Locale,
        JobTitle: user.JobTitle,
        IsActive: user.IsActive,
        CreatedAt: user.CreatedAt);

    private static string HashToken(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}

internal sealed record RefreshTokenEntry(
    Guid UserId,
    Guid? ActiveWorkspaceId,
    DateTime CreatedAt,
    DateTime ExpiresAt);

internal sealed record AuthSessionSnapshot(
    IReadOnlyList<UserWorkspaceResponse> Workspaces,
    Guid? ActiveWorkspaceId,
    MembershipRole? ActiveWorkspaceRole);
