using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Integration.Tests.Fixtures;

namespace LinearPrecision.Integration.Tests.Modules.Identity;

/// <summary>
/// Integration tests for the Identity/Auth endpoints.
/// These require Docker to be running for Testcontainers.
/// </summary>
[Collection("Api")]
public class AuthEndpointTests
{
    private readonly ApiFixture _fixture;

    public AuthEndpointTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Register_with_valid_data_should_return_session()
    {
        var client = _fixture.CreateClient();
        var request = new RegisterRequest(
            $"register-{Guid.NewGuid():N}@test.com",
            "Password1",
            "Integration Test User");

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var session = await response.Content.ReadFromJsonAsync<AuthSessionResponse>();
        session.Should().NotBeNull();
        session!.AccessToken.Should().NotBeNullOrWhiteSpace();
        session.RefreshToken.Should().NotBeNullOrWhiteSpace();
        session.TokenType.Should().Be("Bearer");
        session.ExpiresIn.Should().BeGreaterThan(0);
        session.User.Should().NotBeNull();
        session.User.Email.Should().Be(request.Email);
        session.ActiveWorkspaceId.Should().NotBeNull();
        session.Workspaces.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Register_with_invalid_email_should_return_bad_request()
    {
        var client = _fixture.CreateClient();
        var request = new RegisterRequest("not-an-email", "Password1", "Test");

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_with_wrong_password_should_return_unauthorized()
    {
        var client = _fixture.CreateClient();

        // First register
        var email = $"login-{Guid.NewGuid():N}@test.com";
        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Password1", "Test User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Then login with wrong password
        var response = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(email, "WrongPassword1"));

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Unauthorized,
            HttpStatusCode.BadRequest);
    }
}
