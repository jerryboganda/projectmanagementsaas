using System.Net.Http.Headers;
using System.Net.Http.Json;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Integration.Tests.Fixtures;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace LinearPrecision.Integration.Tests.Helpers;

/// <summary>
/// Helper to register a test user and obtain a JWT for authenticated requests.
/// </summary>
public static class AuthHelper
{
    public static async Task<(HttpClient Client, AuthSessionResponse Session)> CreateAuthenticatedClientAsync(
        ApiFixture fixture,
        HttpClient client,
        string email = "test@example.com",
        string password = "Password1",
        string fullName = "Test User")
    {
        // Register
        var registerRequest = new RegisterRequest(email, password, fullName);
        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        registerResponse.EnsureSuccessStatusCode();

        await ConfirmEmailAsync(fixture, client, email);

        var session = await LoginAsync(client, email, password);

        // Attach JWT to client
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);

        return (client, session);
    }

    public static async Task<AuthSessionResponse> LoginAsync(
        HttpClient client,
        string email,
        string password)
    {
        var loginRequest = new LoginRequest(email, password);
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.EnsureSuccessStatusCode();

        var sessionBody = await response.Content.ReadFromJsonAsync<AuthSessionBodyResponse>();
        if (sessionBody is null) throw new InvalidOperationException("Failed to deserialize auth session response");

        var session = new AuthSessionResponse(
            sessionBody.AccessToken,
            string.Empty,
            sessionBody.ExpiresIn,
            sessionBody.TokenType,
            sessionBody.User,
            sessionBody.ActiveWorkspaceId,
            sessionBody.Workspaces);

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);

        return session;
    }

    public static async Task ConfirmEmailAsync(
        ApiFixture fixture,
        HttpClient client,
        string email)
    {
        await using var scope = fixture.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var user = await userManager.FindByEmailAsync(email)
            ?? throw new InvalidOperationException($"User '{email}' was not found.");

        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/confirm-email",
            new ConfirmEmailRequest(email, token));
        response.EnsureSuccessStatusCode();
    }
}
