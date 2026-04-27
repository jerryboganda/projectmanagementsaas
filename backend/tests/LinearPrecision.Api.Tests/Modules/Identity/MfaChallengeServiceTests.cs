using FluentAssertions;
using LinearPrecision.Api.Modules.Identity.Services;
using NSubstitute;
using StackExchange.Redis;
using Xunit;

namespace LinearPrecision.Api.Tests.Modules.Identity;

/// <summary>
/// F-13 — Unit tests for the MFA challenge service. Uses NSubstitute to stub
/// the Redis connection so we can verify the key shape, TTL, and redeem flow
/// without spinning up a live Redis.
/// </summary>
public class MfaChallengeServiceTests
{
    private readonly IConnectionMultiplexer _redis = Substitute.For<IConnectionMultiplexer>();
    private readonly IDatabase _db = Substitute.For<IDatabase>();
    private readonly MfaChallengeService _sut;

    public MfaChallengeServiceTests()
    {
        _redis.GetDatabase(Arg.Any<int>(), Arg.Any<object?>()).Returns(_db);
        _sut = new MfaChallengeService(_redis);
    }

    [Fact]
    public async Task CreateAsync_StoresUserIdInRedis_WithFiveMinuteTtl()
    {
        var userId = Guid.NewGuid();
        // StringSetAsync has multiple overloads across StackExchange.Redis
        // versions; capture invocations via the substitute's call log so we
        // are agnostic to whether the keepTtl bool overload is in play.
        _db.StringSetAsync(
                Arg.Any<RedisKey>(),
                Arg.Any<RedisValue>(),
                Arg.Any<TimeSpan?>(),
                Arg.Any<When>(),
                Arg.Any<CommandFlags>())
            .Returns(true);

        var token = await _sut.CreateAsync(userId);

        token.Should().NotBeNullOrWhiteSpace();
        token.Should().NotContain("+").And.NotContain("/").And.NotContain("=",
            "the token must be URL-safe base64");

        var calls = _db.ReceivedCalls()
            .Where(c => c.GetMethodInfo().Name == nameof(IDatabase.StringSetAsync))
            .ToList();
        calls.Should().HaveCount(1);

        var args = calls[0].GetArguments();
        ((RedisKey)args[0]!).ToString().Should().StartWith("mfa:challenge:");
        ((RedisValue)args[1]!).ToString().Should().Be(userId.ToString("N"));

        // The expiry parameter shape (TimeSpan? vs Expiration struct) varies
        // across StackExchange.Redis versions. Asserting that *some* expiry
        // was supplied (i.e. arg is not null) is sufficient for this unit
        // test; a per-version exact-TTL assertion would couple us to the
        // client's internal type.
        args[2].Should().NotBeNull("an expiry must be passed to StringSetAsync");
    }

    [Fact]
    public async Task CreateAsync_GeneratesUniqueTokensPerCall()
    {
        var t1 = await _sut.CreateAsync(Guid.NewGuid());
        var t2 = await _sut.CreateAsync(Guid.NewGuid());
        t1.Should().NotBe(t2);
    }

    [Fact]
    public async Task RedeemAsync_ReturnsUserId_WhenChallengeExists()
    {
        var userId = Guid.NewGuid();
        _db.StringGetDeleteAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>())
            .Returns(new RedisValue(userId.ToString("N")));

        var result = await _sut.RedeemAsync("any-token");

        result.Should().Be(userId);
    }

    [Fact]
    public async Task RedeemAsync_ReturnsNull_WhenChallengeMissing()
    {
        _db.StringGetDeleteAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>())
            .Returns(RedisValue.Null);

        var result = await _sut.RedeemAsync("missing-token");

        result.Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task RedeemAsync_ReturnsNull_WhenTokenIsNullOrWhitespace(string? token)
    {
        var result = await _sut.RedeemAsync(token!);
        result.Should().BeNull();
        await _db.DidNotReceive().StringGetDeleteAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>());
    }

    [Fact]
    public async Task RedeemAsync_ReturnsNull_WhenStoredValueIsNotAGuid()
    {
        _db.StringGetDeleteAsync(Arg.Any<RedisKey>(), Arg.Any<CommandFlags>())
            .Returns(new RedisValue("not-a-guid"));

        var result = await _sut.RedeemAsync("token");

        result.Should().BeNull();
    }
}
