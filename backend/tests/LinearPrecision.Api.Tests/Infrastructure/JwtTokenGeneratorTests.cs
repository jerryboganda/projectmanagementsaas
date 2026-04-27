using System.IdentityModel.Tokens.Jwt;
using FluentAssertions;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace LinearPrecision.Api.Tests.Infrastructure;

public class JwtTokenGeneratorTests
{
    private static IConfiguration CreateConfiguration(
        string key = "super-secret-development-key-that-is-at-least-32-bytes-long!",
        string issuer = "https://api.linearprecision.com",
        string audience = "linear-precision-api")
    {
        var inMemory = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = key,
            ["Jwt:Issuer"] = issuer,
            ["Jwt:Audience"] = audience,
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemory)
            .Build();
    }

    [Fact]
    public void GenerateAccessToken_should_return_non_empty_string()
    {
        var config = CreateConfiguration();
        var generator = new JwtTokenGenerator(config);
        var user = new Api.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            FullName = "Test User",
            UserName = "test@example.com",
        };

        var token = generator.GenerateAccessToken(user, MembershipRole.Member, Guid.NewGuid());

        token.Should().NotBeNullOrWhiteSpace();
        token.Split('.').Should().HaveCount(3, "JWT should have 3 parts: header.payload.signature");
    }

    [Fact]
    public void GenerateHubAccessToken_should_scope_token_to_hub_path()
    {
        var config = CreateConfiguration();
        var generator = new JwtTokenGenerator(config);
        var user = new Api.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            FullName = "Test User",
            UserName = "test@example.com",
        };
        var workspaceId = Guid.NewGuid();

        var token = generator.GenerateHubAccessToken(
            user,
            MembershipRole.Member,
            workspaceId,
            "/hubs/board");

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(claim => claim.Type == "token_use" && claim.Value == "hub");
        jwt.Claims.Should().Contain(claim => claim.Type == "hub_path" && claim.Value == "/hubs/board");
        jwt.Claims.Should().Contain(claim => claim.Type == "workspace_id" && claim.Value == workspaceId.ToString());
        jwt.ValidTo.Should().BeCloseTo(DateTime.UtcNow.AddSeconds(60), TimeSpan.FromSeconds(10));
    }

    [Fact]
    public void GenerateRefreshToken_should_return_base64_string()
    {
        var token = JwtTokenGenerator.GenerateRefreshToken();

        token.Should().NotBeNullOrWhiteSpace();
        // Should be valid base64
        var action = () => Convert.FromBase64String(token);
        action.Should().NotThrow();
        Convert.FromBase64String(token).Length.Should().Be(64);
    }

    [Fact]
    public void GenerateAccessToken_without_key_should_throw()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var generator = new JwtTokenGenerator(config);
        var user = new Api.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "test@example.com",
            FullName = "Test User",
            UserName = "test@example.com",
        };

        var action = () => generator.GenerateAccessToken(user, MembershipRole.Member, Guid.NewGuid());
        action.Should().Throw<InvalidOperationException>();
    }
}
