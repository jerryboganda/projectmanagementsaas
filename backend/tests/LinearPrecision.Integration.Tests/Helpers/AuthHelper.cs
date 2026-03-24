using System.Net.Http.Headers;
using System.Net.Http.Json;
using LinearPrecision.Api.Modules.Identity.Models;

namespace LinearPrecision.Integration.Tests.Helpers;

/// <summary>
/// Helper to register a test user and obtain a JWT for authenticated requests.
/// </summary>
public static class AuthHelper
{
    public static async Task<(HttpClient Client, AuthSessionResponse Session)> CreateAuthenticatedClientAsync(
        HttpClient client,
        string email = "test@example.com",
        string password = "Password1",
        string fullName = "Test User")
    {
        // Register
        var registerRequest = new RegisterRequest(email, password, fullName);
        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        registerResponse.EnsureSuccessStatusCode();

        var session = await registerResponse.Content.ReadFromJsonAsync<AuthSessionResponse>();
        if (session is null) throw new InvalidOperationException("Failed to deserialize auth session response");

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

        var session = await response.Content.ReadFromJsonAsync<AuthSessionResponse>();
        if (session is null) throw new InvalidOperationException("Failed to deserialize auth session response");

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);

        return session;
    }
}
