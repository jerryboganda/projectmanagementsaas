using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LinearPrecision.Api.Modules.Goals.Models;
using LinearPrecision.Api.Modules.Projects.Models;
using LinearPrecision.Integration.Tests.Fixtures;
using LinearPrecision.Integration.Tests.Helpers;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Integration.Tests.Modules.Goals;

[Collection("Api")]
public class GoalEndpointTests
{
    private readonly ApiFixture _fixture;

    public GoalEndpointTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Goal_detail_should_include_subgoals_project_links_and_initiatives()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            client,
            email: $"goal-contract-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var createProjectResponse = await authedClient.PostAsJsonAsync(
            "/api/v1/projects/",
            new CreateProjectRequest(
                "Goals Contract Project",
                $"G{Guid.NewGuid():N}".Substring(0, 8).ToUpperInvariant(),
                "Created to verify goal project-link contracts.",
                "#2563EB",
                null,
                ProjectStatus.Active,
                ProjectVisibility.Workspace,
                null,
                null,
                null,
                null));
        createProjectResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var project = await createProjectResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        project.Should().NotBeNull();

        var createGoalResponse = await authedClient.PostAsJsonAsync(
            "/api/v1/goals/",
            new CreateGoalRequest(
                "Launch Revenue Objective",
                "Primary commercial objective for Q3.",
                GoalStatus.OnTrack,
                GoalType.Objective,
                35,
                GoalProgressSource.Manual,
                session.User.Id,
                new DateOnly(2026, 7, 1),
                new DateOnly(2026, 9, 30),
                null));
        createGoalResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var rootGoal = await createGoalResponse.Content.ReadFromJsonAsync<GoalResponse>();
        rootGoal.Should().NotBeNull();

        var createChildResponse = await authedClient.PostAsJsonAsync(
            "/api/v1/goals/",
            new CreateGoalRequest(
                "Improve Activation Rate",
                "Sub-goal owned by growth.",
                GoalStatus.AtRisk,
                GoalType.KeyResult,
                20,
                GoalProgressSource.Manual,
                session.User.Id,
                new DateOnly(2026, 7, 15),
                new DateOnly(2026, 8, 31),
                rootGoal!.Id));
        createChildResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var linkProjectResponse = await authedClient.PostAsJsonAsync(
            $"/api/v1/goals/{rootGoal!.Id}/projects",
            new LinkProjectRequest(project!.Id));
        linkProjectResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createInitiativeResponse = await authedClient.PostAsJsonAsync(
            $"/api/v1/goals/{rootGoal.Id}/initiatives/",
            new CreateInitiativeRequest(
                "Launch onboarding experiment",
                "Test conversion improvements for new users.",
                InitiativeStatus.InProgress,
                session.User.Id,
                new DateOnly(2026, 7, 20),
                new DateOnly(2026, 8, 20),
                40));
        createInitiativeResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var detailResponse = await authedClient.GetAsync($"/api/v1/goals/{rootGoal.Id}");
        detailResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await detailResponse.Content.ReadFromJsonAsync<GoalResponse>();
        payload.Should().NotBeNull();
        payload!.Id.Should().Be(rootGoal.Id);
        payload.Title.Should().Be("Launch Revenue Objective");
        payload.Type.Should().Be(GoalType.Objective);
        payload.Status.Should().Be(GoalStatus.OnTrack);
        payload.ProgressPercent.Should().Be(35);
        payload.Owner.Should().NotBeNull();
        payload.Owner!.Id.Should().Be(session.User.Id);
        payload.SubGoals.Should().ContainSingle();
        payload.SubGoals![0].Title.Should().Be("Improve Activation Rate");
        payload.SubGoals[0].ParentGoalId.Should().Be(rootGoal.Id);
        payload.SubGoals[0].Type.Should().Be(GoalType.KeyResult);
        payload.ProjectLinks.Should().ContainSingle();
        payload.ProjectLinks![0].ProjectId.Should().Be(project.Id);
        payload.Initiatives.Should().ContainSingle();
        payload.Initiatives![0].Title.Should().Be("Launch onboarding experiment");
        payload.Initiatives[0].Status.Should().Be(InitiativeStatus.InProgress);
        payload.Initiatives[0].Owner.Should().NotBeNull();
        payload.Initiatives[0].Owner!.Id.Should().Be(session.User.Id);
    }

    private static void SetWorkspaceHeader(HttpClient client, Guid workspaceId)
    {
        client.DefaultRequestHeaders.Remove("X-Workspace-Id");
        client.DefaultRequestHeaders.Add("X-Workspace-Id", workspaceId.ToString());
    }
}
