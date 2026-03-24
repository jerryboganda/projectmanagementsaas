using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LinearPrecision.Api.Modules.Tasks.Models;
using LinearPrecision.Integration.Tests.Fixtures;
using LinearPrecision.Integration.Tests.Helpers;

namespace LinearPrecision.Integration.Tests.Modules.Tasks;

/// <summary>
/// Integration tests for the Tasks endpoints.
/// These require Docker to be running for Testcontainers.
/// </summary>
[Collection("Api")]
public class TaskEndpointTests
{
    private readonly ApiFixture _fixture;

    public TaskEndpointTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Unauthenticated_request_should_return_401()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/api/v1/tasks");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_task_without_workspace_header_should_fail()
    {
        var client = _fixture.CreateClient();
        var (authedClient, _) = await AuthHelper.CreateAuthenticatedClientAsync(
            client,
            email: $"task-test-{Guid.NewGuid():N}@test.com");

        var request = new CreateTaskRequest(
            ProjectId: Guid.NewGuid(),
            Title: "Test Task",
            Description: null,
            Status: null,
            Priority: null,
            TaskType: null,
            Labels: null,
            AssigneeId: null,
            ParentTaskId: null,
            SprintId: null,
            StartDate: null,
            DueDate: null,
            EstimatePoints: null,
            EstimateHours: null,
            CustomFields: null);

        var response = await authedClient.PostAsJsonAsync("/api/v1/tasks", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
