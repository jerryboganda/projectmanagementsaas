using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Api.Modules.Workspace.Models;
using LinearPrecision.Integration.Tests.Fixtures;
using LinearPrecision.Integration.Tests.Helpers;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace LinearPrecision.Integration.Tests.Modules.Identity;

[Collection("Api")]
public class AuthLifecycleEndpointTests
{
    private readonly ApiFixture _fixture;

    public AuthLifecycleEndpointTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Forgot_password_should_return_accepted_for_existing_user()
    {
        var client = _fixture.CreateClient();
        var email = $"forgot-{Guid.NewGuid():N}@test.com";

        var registerResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest(email, "Password1", "Forgot Password User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/forgot-password",
            new
            {
                email
            });

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);
    }

    [Fact]
    public async Task Reset_password_should_allow_login_with_new_password()
    {
        var client = _fixture.CreateClient();
        var email = $"reset-{Guid.NewGuid():N}@test.com";
        const string originalPassword = "Password1";
        const string nextPassword = "Password2";

        var registerResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/register",
            new RegisterRequest(email, originalPassword, "Reset Password User"));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        await using var scope = _fixture.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var user = await userManager.FindByEmailAsync(email);
        user.Should().NotBeNull();

        var token = await userManager.GeneratePasswordResetTokenAsync(user!);

        var resetResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/reset-password",
            new
            {
                email,
                token,
                newPassword = nextPassword
            });
        resetResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var loginResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new LoginRequest(email, nextPassword));
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Setting_active_workspace_should_return_updated_session()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            client,
            email: $"workspace-switch-{Guid.NewGuid():N}@test.com");

        var createResponse = await authedClient.PostAsJsonAsync(
            "/api/v1/workspaces",
            new CreateWorkspaceRequest("Second Workspace", "Used for switching"));
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var workspace = await createResponse.Content.ReadFromJsonAsync<WorkspaceResponse>();
        workspace.Should().NotBeNull();
        workspace!.Id.Should().NotBe(session.ActiveWorkspaceId!.Value);

        var setActiveResponse = await authedClient.PutAsJsonAsync(
            "/api/v1/users/me/active-workspace",
            new
            {
                workspaceId = workspace.Id
            });

        setActiveResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedSession = await setActiveResponse.Content.ReadFromJsonAsync<AuthSessionResponse>();
        updatedSession.Should().NotBeNull();
        updatedSession!.ActiveWorkspaceId.Should().Be(workspace.Id);
        updatedSession.Workspaces.Should().Contain(item => item.WorkspaceId == workspace.Id);
    }

    [Fact]
    public async Task Accepting_invitation_should_add_membership_and_switch_active_workspace()
    {
        var ownerClient = _fixture.CreateClient();
        var (ownerAuthedClient, ownerSession) = await AuthHelper.CreateAuthenticatedClientAsync(
            ownerClient,
            email: $"owner-{Guid.NewGuid():N}@test.com");

        var inviteeEmail = $"invitee-{Guid.NewGuid():N}@test.com";

        await using var scope = _fixture.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<LinearPrecision.Api.Infrastructure.Persistence.AppDbContext>();
        var invitation = new Invitation
        {
            WorkspaceId = ownerSession.ActiveWorkspaceId!.Value,
            Email = inviteeEmail,
            Role = MembershipRole.Member,
            Status = InvitationStatus.Pending,
            InvitedBy = ownerSession.User.Id,
            Token = Guid.NewGuid().ToString("N"),
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        db.Invitations.Add(invitation);
        await db.SaveChangesAsync();

        var inviteeClient = _fixture.CreateClient();
        var (inviteeAuthedClient, _) = await AuthHelper.CreateAuthenticatedClientAsync(
            inviteeClient,
            email: inviteeEmail);

        var acceptResponse = await inviteeAuthedClient.PostAsync(
            $"/api/v1/invitations/{invitation!.Token}/accept",
            content: null);

        acceptResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var acceptedSession = await acceptResponse.Content.ReadFromJsonAsync<AuthSessionResponse>();
        acceptedSession.Should().NotBeNull();
        acceptedSession!.ActiveWorkspaceId.Should().Be(ownerSession.ActiveWorkspaceId!.Value);
        acceptedSession.Workspaces.Should().Contain(item => item.WorkspaceId == ownerSession.ActiveWorkspaceId!.Value);
    }
}
