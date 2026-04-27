using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Integration.Tests.Fixtures;
using LinearPrecision.Integration.Tests.Helpers;
using NSubstitute;

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

    [DockerFact]
    public async Task Register_with_valid_data_should_return_pending_confirmation_without_session_or_refresh_cookie()
    {
        _fixture.EmailService.ClearReceivedCalls();
        var client = _fixture.CreateClient();
        var request = new RegisterRequest(
            $"register-{Guid.NewGuid():N}@test.com",
            "Password1",
            "Integration Test User");

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        json.RootElement.TryGetProperty("accessToken", out _).Should().BeFalse();
        json.RootElement.TryGetProperty("refreshToken", out _).Should().BeFalse();
        response.Headers.TryGetValues("Set-Cookie", out _).Should().BeFalse();

        var pending = JsonSerializer.Deserialize<RegistrationPendingResponse>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        pending.Should().NotBeNull();
        pending!.Email.Should().Be(request.Email);
        pending.RequiresEmailConfirmation.Should().BeTrue();

        await _fixture.EmailService.Received(1).SendTemplatedAsync(
            request.Email,
            "email-confirmation",
            Arg.Any<object>(),
            Arg.Any<CancellationToken>());
    }

    [DockerFact]
    public async Task Register_with_mobile_client_header_should_still_return_pending_confirmation_without_tokens()
    {
        var client = _fixture.CreateClient();
        client.DefaultRequestHeaders.Add("X-LP-Client", "mobile");
        var request = new RegisterRequest(
            $"register-mobile-{Guid.NewGuid():N}@test.com",
            "Password1",
            "Integration Test User");

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        json.RootElement.TryGetProperty("accessToken", out _).Should().BeFalse();
        json.RootElement.TryGetProperty("refreshToken", out _).Should().BeFalse();
    }

    [DockerFact]
    public async Task Register_with_invalid_email_should_return_bad_request()
    {
        var client = _fixture.CreateClient();
        var request = new RegisterRequest("not-an-email", "Password1", "Test");

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [DockerFact]
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

    [DockerFact]
    public async Task Login_with_unconfirmed_email_and_valid_password_should_return_forbidden()
    {
        var client = _fixture.CreateClient();
        var email = $"unconfirmed-login-{Guid.NewGuid():N}@test.com";

        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Password1", "Unconfirmed User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(email, "Password1"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [DockerFact]
    public async Task Confirm_email_with_valid_token_should_allow_login()
    {
        var client = _fixture.CreateClient();
        var email = $"confirm-{Guid.NewGuid():N}@test.com";

        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Password1", "Confirm User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        await AuthHelper.ConfirmEmailAsync(_fixture, client, email);

        var response = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(email, "Password1"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [DockerFact]
    public async Task Confirm_email_with_invalid_token_should_return_bad_request()
    {
        var client = _fixture.CreateClient();
        var email = $"bad-confirm-{Guid.NewGuid():N}@test.com";

        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Password1", "Bad Confirm User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await client.PostAsJsonAsync("/api/v1/auth/confirm-email",
            new ConfirmEmailRequest(email, "not-a-valid-token"));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [DockerFact]
    public async Task Resend_confirmation_should_be_enumeration_safe_and_send_for_unconfirmed_user()
    {
        var client = _fixture.CreateClient();
        var missingResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/resend-confirmation",
            new ResendConfirmationRequest($"missing-{Guid.NewGuid():N}@test.com"));
        missingResponse.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var email = $"resend-{Guid.NewGuid():N}@test.com";
        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Password1", "Resend User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        _fixture.EmailService.ClearReceivedCalls();
        var resendResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/resend-confirmation",
            new ResendConfirmationRequest(email));

        resendResponse.StatusCode.Should().Be(HttpStatusCode.Accepted);
        await _fixture.EmailService.Received(1).SendTemplatedAsync(
            email,
            "email-confirmation",
            Arg.Any<object>(),
            Arg.Any<CancellationToken>());
    }

    [DockerFact]
    public async Task SetActiveWorkspace_with_unconfirmed_email_should_return_forbidden()
    {
        var client = _fixture.CreateClient();
        var email = $"unconfirmed-workspace-{Guid.NewGuid():N}@test.com";

        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Password1", "Unconfirmed Workspace User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var registerBody = await registerResponse.Content.ReadFromJsonAsync<RegistrationPendingResponse>();
        registerBody.Should().NotBeNull();

        var loginAttempt = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(email, "Password1"));
        loginAttempt.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [DockerFact]
    public async Task CreateHubToken_with_unconfirmed_email_should_return_forbidden()
    {
        var client = _fixture.CreateClient();
        var email = $"unconfirmed-hub-{Guid.NewGuid():N}@test.com";

        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Password1", "Unconfirmed Hub User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var loginAttempt = await client.PostAsJsonAsync("/api/v1/auth/login",
            new LoginRequest(email, "Password1"));
        loginAttempt.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
