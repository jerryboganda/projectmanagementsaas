using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Modules.Projects.Models;
using LinearPrecision.Api.Modules.Workspace.Models;
using LinearPrecision.Integration.Tests.Fixtures;
using LinearPrecision.Integration.Tests.Helpers;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Integration.Tests.Modules.System;

[Collection("Api")]
public class TenancyContractTests
{
    private readonly ApiFixture _fixture;

    public TenancyContractTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Unauthenticated_tenant_scoped_request_should_return_401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/api/v1/projects/");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Authenticated_request_without_workspace_header_should_return_400()
    {
        var client = _fixture.CreateClient();
        await AuthHelper.CreateAuthenticatedClientAsync(
            client,
            email: $"tenant-header-{Guid.NewGuid():N}@test.com");

        var response = await client.GetAsync("/api/v1/projects/");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Route_scoped_workspace_invitation_creation_should_succeed_for_owner_without_header()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            client,
            email: $"workspace-owner-{Guid.NewGuid():N}@test.com");

        session.Workspaces.Should().ContainSingle(workspace => workspace.WorkspaceId == session.ActiveWorkspaceId!.Value)
            .Which.Role.Should().Be(MembershipRole.Owner);

        await using (var scope = _fixture.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LinearPrecision.Api.Infrastructure.Persistence.AppDbContext>();
            var hasMembership = await db.Memberships
                .IgnoreQueryFilters()
                .AnyAsync(membership =>
                    membership.WorkspaceId == session.ActiveWorkspaceId!.Value &&
                    membership.UserId == session.User.Id &&
                    membership.IsActive);

            hasMembership.Should().BeTrue();
        }

        var response = await authedClient.PostAsJsonAsync(
            $"/api/v1/workspaces/{session.ActiveWorkspaceId}/invitations",
            new
            {
                email = $"invite-{Guid.NewGuid():N}@test.com",
                role = MembershipRole.Member,
                projectIds = (Guid[]?)null
            });

        var responseBody = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(
            HttpStatusCode.Created,
            $"session user {session.User.Id}, session workspace {session.ActiveWorkspaceId}, body {responseBody}");
    }

    [Fact]
    public async Task Authenticated_non_member_on_route_scoped_workspace_endpoint_should_return_403()
    {
        var ownerClient = _fixture.CreateClient();
        var (_, ownerSession) = await AuthHelper.CreateAuthenticatedClientAsync(
            ownerClient,
            email: $"workspace-a-{Guid.NewGuid():N}@test.com");

        var outsiderClient = _fixture.CreateClient();
        await AuthHelper.CreateAuthenticatedClientAsync(
            outsiderClient,
            email: $"workspace-b-{Guid.NewGuid():N}@test.com");

        var response = await outsiderClient.GetAsync($"/api/v1/workspaces/{ownerSession.ActiveWorkspaceId}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Cross_tenant_project_lookup_should_return_404()
    {
        var ownerClient = _fixture.CreateClient();
        var (ownerAuthedClient, ownerSession) = await AuthHelper.CreateAuthenticatedClientAsync(
            ownerClient,
            email: $"project-owner-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(ownerAuthedClient, ownerSession.ActiveWorkspaceId!.Value);

        var createProjectResponse = await ownerAuthedClient.PostAsJsonAsync(
            "/api/v1/projects/",
            new CreateProjectRequest(
                "Tenant Project",
                $"P{Guid.NewGuid():N}".Substring(0, 8).ToUpperInvariant(),
                "Created to verify cross-tenant isolation",
                "#2563EB",
                null,
                ProjectStatus.Active,
                ProjectVisibility.Workspace,
                null,
                null,
                null,
                null));
        var createProjectBody = await createProjectResponse.Content.ReadAsStringAsync();
        createProjectResponse.StatusCode.Should().Be(HttpStatusCode.Created, createProjectBody);

        var createdProject = JsonSerializer.Deserialize<ProjectResponse>(
            createProjectBody,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));
        createdProject.Should().NotBeNull();

        var outsiderClient = _fixture.CreateClient();
        var (outsiderAuthedClient, outsiderSession) = await AuthHelper.CreateAuthenticatedClientAsync(
            outsiderClient,
            email: $"project-outsider-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(outsiderAuthedClient, outsiderSession.ActiveWorkspaceId!.Value);

        var response = await outsiderAuthedClient.GetAsync($"/api/v1/projects/{createdProject!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Project_favorite_toggle_should_be_reflected_in_project_list()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            client,
            email: $"project-favorite-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var createProjectResponse = await authedClient.PostAsJsonAsync(
            "/api/v1/projects/",
            new CreateProjectRequest(
                "Favorite Project",
                $"F{Guid.NewGuid():N}".Substring(0, 8).ToUpperInvariant(),
                "Created to verify project favorite list state.",
                "#2563EB",
                null,
                ProjectStatus.Active,
                ProjectVisibility.Workspace,
                null,
                null,
                null,
                null));
        createProjectResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdProject = await createProjectResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        createdProject.Should().NotBeNull();
        createdProject!.IsFavorited.Should().BeFalse();

        var favoriteResponse = await authedClient.PostAsync(
            $"/api/v1/projects/{createdProject.Id}/favorite",
            JsonContent.Create(new { }));
        favoriteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var listResponse = await authedClient.GetAsync("/api/v1/projects/");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var projects = await listResponse.Content.ReadFromJsonAsync<List<ProjectResponse>>();
        projects.Should().NotBeNull();
        projects!
            .Should()
            .ContainSingle(project => project.Id == createdProject.Id && project.IsFavorited);
    }

    [Fact]
    public async Task Route_scoped_workspace_settings_should_return_typed_settings_with_defaults_and_saved_values()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            client,
            email: $"workspace-settings-{Guid.NewGuid():N}@test.com");

        await using (var scope = _fixture.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LinearPrecision.Api.Infrastructure.Persistence.AppDbContext>();
            var workspace = await db.Workspaces.FirstAsync(
                item => item.Id == session.ActiveWorkspaceId!.Value);

            workspace.Settings = JsonDocument.Parse("""
                {
                  "timezone": "Europe/London",
                  "dateFormat": "DD/MM/YYYY"
                }
                """);

            await db.SaveChangesAsync();
        }

        var response = await authedClient.GetAsync($"/api/v1/workspaces/{session.ActiveWorkspaceId}/settings");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<WorkspaceSettingsResponse>();
        payload.Should().NotBeNull();
        payload!.WorkspaceId.Should().Be(session.ActiveWorkspaceId!.Value);
        payload.Name.Should().NotBeNullOrWhiteSpace();
        payload.Slug.Should().NotBeNullOrWhiteSpace();
        payload.CurrentUserRole.Should().Be(MembershipRole.Owner);
        payload.Timezone.Should().Be("Europe/London");
        payload.DateFormat.Should().Be("DD/MM/YYYY");
        payload.TimeFormat.Should().Be("12h");
        payload.WeekStartsOn.Should().Be("Monday");
    }

    [Fact]
    public async Task Archived_notification_should_be_hidden_from_default_list_and_visible_in_archived_list()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            client,
            email: $"notifications-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var notificationId = Guid.CreateVersion7();

        await using (var scope = _fixture.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LinearPrecision.Api.Infrastructure.Persistence.AppDbContext>();
            db.Notifications.Add(new Notification
            {
                Id = notificationId,
                WorkspaceId = session.ActiveWorkspaceId.Value,
                RecipientId = session.User.Id,
                Type = "comment",
                Title = "Commented on your task",
                Body = "Please review the latest implementation.",
                EntityType = "Task",
                EntityId = Guid.CreateVersion7(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });

            await db.SaveChangesAsync();
        }

        var defaultListResponse = await authedClient.GetAsync("/api/v1/notifications");
        defaultListResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var defaultNotifications = await defaultListResponse.Content.ReadFromJsonAsync<List<LinearPrecision.Api.Modules.Notifications.Models.NotificationResponse>>();
        defaultNotifications.Should().NotBeNull();
        defaultNotifications!.Should().ContainSingle(notification => notification.Id == notificationId && !notification.IsArchived);

        var archiveResponse = await authedClient.PutAsync($"/api/v1/notifications/{notificationId}/archive", JsonContent.Create(new { }));
        archiveResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var activeListAfterArchive = await authedClient.GetAsync("/api/v1/notifications");
        activeListAfterArchive.StatusCode.Should().Be(HttpStatusCode.OK);

        var activeNotifications = await activeListAfterArchive.Content.ReadFromJsonAsync<List<LinearPrecision.Api.Modules.Notifications.Models.NotificationResponse>>();
        activeNotifications.Should().NotBeNull();
        activeNotifications!.Should().NotContain(notification => notification.Id == notificationId);

        var archivedListResponse = await authedClient.GetAsync("/api/v1/notifications?isArchived=true");
        archivedListResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var archivedNotifications = await archivedListResponse.Content.ReadFromJsonAsync<List<LinearPrecision.Api.Modules.Notifications.Models.NotificationResponse>>();
        archivedNotifications.Should().NotBeNull();
        archivedNotifications!
            .Should()
            .ContainSingle(notification => notification.Id == notificationId && notification.IsArchived);
    }

    private static void SetWorkspaceHeader(HttpClient client, Guid workspaceId)
    {
        client.DefaultRequestHeaders.Remove("X-Workspace-Id");
        client.DefaultRequestHeaders.Add("X-Workspace-Id", workspaceId.ToString());
    }
}
