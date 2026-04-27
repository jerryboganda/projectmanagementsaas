using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Api.Modules.Identity.Services;
using LinearPrecision.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using StackExchange.Redis;

namespace LinearPrecision.Api.Tests.Modules.Identity;

public sealed class TokenServiceTests
{
    private readonly IConnectionMultiplexer _redis = Substitute.For<IConnectionMultiplexer>();
    private readonly IDatabase _db = Substitute.For<IDatabase>();

    public TokenServiceTests()
    {
        _redis.GetDatabase(Arg.Any<int>(), Arg.Any<object?>()).Returns(_db);
    }

    [Fact]
    public async Task GenerateTokenPairAsync_ThrowsInvalidOperationException_WhenEmailIsUnconfirmed()
    {
        var workspaceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var scope = await TestDbFactory.CreateAsync(workspaceId, userId);
        var user = await scope.Context.Users.FindAsync(userId);
        user.Should().NotBeNull();

        var userManager = CreateUserManager();
        userManager.IsEmailConfirmedAsync(user!).Returns(false);
        var sut = CreateSut(scope, userManager);

        var act = async () => await sut.GenerateTokenPairAsync(user!, workspaceId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Email confirmation is required before issuing authentication sessions.");
    }

    [Fact]
    public async Task GenerateTokenPairAsync_StoresRefreshTokenWithSecurityStamp_AndIndexesUser()
    {
        var workspaceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var scope = await TestDbFactory.CreateAsync(workspaceId, userId);
        var user = await scope.Context.Users.FindAsync(userId);
        user.Should().NotBeNull();

        _db.StringSetAsync(
                Arg.Any<RedisKey>(),
                Arg.Any<RedisValue>(),
                Arg.Any<TimeSpan?>(),
                Arg.Any<When>(),
                Arg.Any<CommandFlags>())
            .Returns(true);
        _db.SetAddAsync(Arg.Any<RedisKey>(), Arg.Any<RedisValue>(), Arg.Any<CommandFlags>()).Returns(true);
        _db.KeyExpireAsync(Arg.Any<RedisKey>(), Arg.Any<TimeSpan?>(), Arg.Any<CommandFlags>()).Returns(true);

        var userManager = CreateUserManager();
        userManager.IsEmailConfirmedAsync(user!).Returns(true);
        var sut = CreateSut(scope, userManager);

        var session = await sut.GenerateTokenPairAsync(user!, workspaceId);

        var tokenHash = HashToken(session.RefreshToken);
        var stringSetCall = _db.ReceivedCalls()
            .Single(call => call.GetMethodInfo().Name == nameof(IDatabase.StringSetAsync));
        var stringSetArgs = stringSetCall.GetArguments();

        ((RedisKey)stringSetArgs[0]!).ToString().Should().Be($"rt:{tokenHash}");
        using var refreshTokenJson = JsonDocument.Parse(((RedisValue)stringSetArgs[1]!).ToString());
        refreshTokenJson.RootElement.GetProperty("UserId").GetGuid().Should().Be(userId);
        refreshTokenJson.RootElement.GetProperty("ActiveWorkspaceId").GetGuid().Should().Be(workspaceId);
        refreshTokenJson.RootElement.GetProperty("SecurityStamp").GetString().Should().Be(user!.SecurityStamp);

        await _db.Received(1).SetAddAsync(
            new RedisKey($"rt:user:{userId}"),
            new RedisValue(tokenHash),
            Arg.Any<CommandFlags>());
        var keyExpireCall = _db.ReceivedCalls()
            .Single(call => call.GetMethodInfo().Name == nameof(IDatabase.KeyExpireAsync));
        var keyExpireArgs = keyExpireCall.GetArguments();
        ((RedisKey)keyExpireArgs[0]!).ToString().Should().Be($"rt:user:{userId}");
        keyExpireArgs[1].Should().NotBeNull("the per-user refresh-token index must expire with the refresh-token window");
    }

    [Fact]
    public async Task RefreshAsync_ReturnsNull_WhenSecurityStampChanged()
    {
        var workspaceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var scope = await TestDbFactory.CreateAsync(workspaceId, userId);
        var currentUser = new User
        {
            Id = userId,
            Email = "test@linearprecision.dev",
            UserName = "test@linearprecision.dev",
            FullName = "Test User",
            IsActive = true,
            EmailConfirmed = true,
            SecurityStamp = "current-security-stamp"
        };
        var userManager = CreateUserManager();
        userManager.FindByIdAsync(userId.ToString()).Returns(currentUser);
        userManager.IsLockedOutAsync(currentUser).Returns(false);
        userManager.IsEmailConfirmedAsync(currentUser).Returns(true);

        const string refreshToken = "refresh-token";
        var tokenHash = HashToken(refreshToken);
        var storedEntry = JsonSerializer.Serialize(new
        {
            UserId = userId,
            ActiveWorkspaceId = workspaceId,
            SecurityStamp = "old-security-stamp",
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        });
        _db.StringGetAsync(new RedisKey($"rt:{tokenHash}"), Arg.Any<CommandFlags>())
            .Returns(new RedisValue(storedEntry));

        var sut = CreateSut(scope, userManager);

        var session = await sut.RefreshAsync(refreshToken);

        session.Should().BeNull();
        await _db.Received(1).KeyDeleteAsync(new RedisKey($"rt:{tokenHash}"), Arg.Any<CommandFlags>());
        await _db.Received(1).SetRemoveAsync(
            new RedisKey($"rt:user:{userId}"),
            new RedisValue(tokenHash),
            Arg.Any<CommandFlags>());
    }

    [Fact]
    public async Task RefreshAsync_ReturnsNull_AndRevokesRefreshTokens_WhenEmailIsUnconfirmed()
    {
        var workspaceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var scope = await TestDbFactory.CreateAsync(workspaceId, userId);
        var currentUser = new User
        {
            Id = userId,
            Email = "test@linearprecision.dev",
            UserName = "test@linearprecision.dev",
            FullName = "Test User",
            IsActive = true,
            EmailConfirmed = false,
            SecurityStamp = "current-security-stamp"
        };
        var userManager = CreateUserManager();
        userManager.FindByIdAsync(userId.ToString()).Returns(currentUser);
        userManager.IsLockedOutAsync(currentUser).Returns(false);
        userManager.IsEmailConfirmedAsync(currentUser).Returns(false);

        const string refreshToken = "refresh-token";
        var tokenHash = HashToken(refreshToken);
        var storedEntry = JsonSerializer.Serialize(new
        {
            UserId = userId,
            ActiveWorkspaceId = workspaceId,
            SecurityStamp = currentUser.SecurityStamp,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        });
        _db.StringGetAsync(new RedisKey($"rt:{tokenHash}"), Arg.Any<CommandFlags>())
            .Returns(new RedisValue(storedEntry));
        _db.SetMembersAsync(new RedisKey($"rt:user:{userId}"), Arg.Any<CommandFlags>())
            .Returns(new RedisValue[] { tokenHash });

        var sut = CreateSut(scope, userManager);

        var session = await sut.RefreshAsync(refreshToken);

        session.Should().BeNull();
        await _db.Received(2).KeyDeleteAsync(new RedisKey($"rt:{tokenHash}"), Arg.Any<CommandFlags>());
        await _db.Received(1).KeyDeleteAsync(new RedisKey($"rt:user:{userId}"), Arg.Any<CommandFlags>());
    }

    [Fact]
    public async Task RevokeAllRefreshTokensForUserAsync_DeletesIndexedRefreshTokensAndUserIndex()
    {
        var workspaceId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        await using var scope = await TestDbFactory.CreateAsync(workspaceId, userId);
        var userManager = CreateUserManager();
        var tokenHashes = new RedisValue[] { "hash-one", "hash-two" };
        _db.SetMembersAsync(new RedisKey($"rt:user:{userId}"), Arg.Any<CommandFlags>())
            .Returns(tokenHashes);
        var sut = CreateSut(scope, userManager);

        await sut.RevokeAllRefreshTokensForUserAsync(userId);

        await _db.Received(1).KeyDeleteAsync(new RedisKey("rt:hash-one"), Arg.Any<CommandFlags>());
        await _db.Received(1).KeyDeleteAsync(new RedisKey("rt:hash-two"), Arg.Any<CommandFlags>());
        await _db.Received(1).KeyDeleteAsync(new RedisKey($"rt:user:{userId}"), Arg.Any<CommandFlags>());
    }

    private TokenService CreateSut(TestDbScope scope, UserManager<User> userManager) => new(
        CreateJwtTokenGenerator(),
        _redis,
        userManager,
        scope.Context);

    private static JwtTokenGenerator CreateJwtTokenGenerator()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "super-secret-development-key-that-is-at-least-32-bytes-long!",
                ["Jwt:Issuer"] = "https://api.linearprecision.com",
                ["Jwt:Audience"] = "linear-precision-api",
            })
            .Build();

        return new JwtTokenGenerator(config);
    }

    private static UserManager<User> CreateUserManager()
    {
        var store = Substitute.For<IUserPasswordStore<User>, IUserSecurityStampStore<User>, IUserLockoutStore<User>>();
        return Substitute.For<UserManager<User>>(
            store,
            Substitute.For<IOptions<IdentityOptions>>(),
            Substitute.For<IPasswordHasher<User>>(),
            Array.Empty<IUserValidator<User>>(),
            Array.Empty<IPasswordValidator<User>>(),
            Substitute.For<ILookupNormalizer>(),
            new IdentityErrorDescriber(),
            null,
            Substitute.For<ILogger<UserManager<User>>>());
    }

    private static string HashToken(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
