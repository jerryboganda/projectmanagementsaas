using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LinearPrecision.Api.Modules.Projects.Models;
using LinearPrecision.Api.Modules.Tasks.Models;
using LinearPrecision.Integration.Tests.Fixtures;
using LinearPrecision.Integration.Tests.Helpers;

namespace LinearPrecision.Integration.Tests.Modules.Tasks;

[Collection("Api")]
public class TaskSubresourceEndpointTests
{
    private readonly ApiFixture _fixture;

    public TaskSubresourceEndpointTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [DockerFact]
    public async Task Get_task_comments_should_return_author_metadata_after_comment_created()
    {
        var client = await CreateWorkspaceScopedClientAsync();
        var taskId = await CreateTaskAsync(client);

        var createCommentResponse = await client.PostAsJsonAsync(
            $"/api/v1/tasks/{taskId}/comments",
            new AddCommentRequest("Comment from integration test", null));

        createCommentResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await client.GetAsync($"/api/v1/tasks/{taskId}/comments");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.ValueKind.Should().Be(JsonValueKind.Array);
        payload.GetArrayLength().Should().Be(1);
        payload[0].GetProperty("content").GetString().Should().Be("Comment from integration test");
        payload[0].GetProperty("authorName").GetString().Should().NotBeNullOrWhiteSpace();
        payload[0].GetProperty("authorInitials").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [DockerFact]
    public async Task Get_task_checklist_should_return_frontend_friendly_items()
    {
        var client = await CreateWorkspaceScopedClientAsync();
        var taskId = await CreateTaskAsync(client);

        var createChecklistResponse = await client.PostAsJsonAsync(
            $"/api/v1/tasks/{taskId}/checklist",
            new AddChecklistItemRequest("Ship board subresources", false, null));

        createChecklistResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await client.GetAsync($"/api/v1/tasks/{taskId}/checklist");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.ValueKind.Should().Be(JsonValueKind.Array);
        payload.GetArrayLength().Should().Be(1);
        payload[0].GetProperty("text").GetString().Should().Be("Ship board subresources");
        payload[0].GetProperty("isCompleted").GetBoolean().Should().BeFalse();
    }

    [DockerFact]
    public async Task Get_task_watchers_should_return_member_identity_metadata()
    {
        var client = await CreateWorkspaceScopedClientAsync();
        var taskId = await CreateTaskAsync(client);
        var userId = GetCurrentUserId(client);

        var addWatcherResponse = await client.PostAsJsonAsync(
            $"/api/v1/tasks/{taskId}/watchers",
            new AddWatcherRequest(userId));

        addWatcherResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await client.GetAsync($"/api/v1/tasks/{taskId}/watchers");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.ValueKind.Should().Be(JsonValueKind.Array);
        payload.GetArrayLength().Should().Be(1);
        payload[0].GetProperty("userId").GetGuid().Should().Be(userId);
        payload[0].GetProperty("userName").GetString().Should().NotBeNullOrWhiteSpace();
        payload[0].GetProperty("userInitials").GetString().Should().NotBeNullOrWhiteSpace();
    }

    [DockerFact]
    public async Task Task_attachments_should_support_presign_list_and_delete()
    {
        var client = await CreateWorkspaceScopedClientAsync();
        var taskId = await CreateTaskAsync(client);

        var presignResponse = await client.PostAsJsonAsync(
            $"/api/v1/tasks/{taskId}/attachments/upload",
            new
            {
                fileName = "board-contract.txt",
                contentType = "text/plain",
                fileSizeBytes = 42L,
            });

        presignResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var presignPayload = await presignResponse.Content.ReadFromJsonAsync<JsonElement>();
        var attachmentId = presignPayload.GetProperty("attachmentId").GetGuid();
        presignPayload.GetProperty("uploadUrl").GetString().Should().StartWith("https://storage.test/upload/");

        var listResponse = await client.GetAsync($"/api/v1/tasks/{taskId}/attachments");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var listPayload = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        listPayload.ValueKind.Should().Be(JsonValueKind.Array);
        listPayload.GetArrayLength().Should().Be(1);
        listPayload[0].GetProperty("id").GetGuid().Should().Be(attachmentId);
        listPayload[0].GetProperty("fileName").GetString().Should().Be("board-contract.txt");
        listPayload[0].GetProperty("downloadUrl").GetString().Should().StartWith("https://storage.test/download/");

        var deleteResponse = await client.DeleteAsync($"/api/v1/tasks/{taskId}/attachments/{attachmentId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var afterDeleteResponse = await client.GetAsync($"/api/v1/tasks/{taskId}/attachments");
        afterDeleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var afterDeletePayload = await afterDeleteResponse.Content.ReadFromJsonAsync<JsonElement>();
        afterDeletePayload.ValueKind.Should().Be(JsonValueKind.Array);
        afterDeletePayload.GetArrayLength().Should().Be(0);
    }

    private async Task<HttpClient> CreateWorkspaceScopedClientAsync()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            _fixture,
            client,
            email: $"task-subresources-{Guid.NewGuid():N}@test.com");

        session.ActiveWorkspaceId.Should().NotBeNull();
        authedClient.DefaultRequestHeaders.Add("X-Workspace-Id", session.ActiveWorkspaceId!.Value.ToString());
        return authedClient;
    }

    private static Guid GetCurrentUserId(HttpClient client)
    {
        var token = client.DefaultRequestHeaders.Authorization?.Parameter;
        token.Should().NotBeNullOrWhiteSpace();

        var jwt = new global::System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().ReadJwtToken(token);
        return Guid.Parse(jwt.Subject);
    }

    private static async Task<Guid> CreateTaskAsync(HttpClient client)
    {
        var projectResponse = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProjectRequest(
                Name: "Task Subresources",
                Identifier: $"TS{Guid.NewGuid():N}"[..6].ToUpperInvariant(),
                Description: "Integration test project",
                Color: null,
                IconUrl: null,
                Status: null,
                Visibility: null,
                LeadId: null,
                StartDate: null,
                TargetDate: null,
                Metadata: null));

        projectResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var project = await projectResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        project.Should().NotBeNull();

        var taskResponse = await client.PostAsJsonAsync(
            "/api/v1/tasks",
            new CreateTaskRequest(
                ProjectId: project!.Id,
                Title: "Board subresource contract",
                Description: "Verify task subresource endpoints",
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
                CustomFields: null));

        taskResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdTask = await taskResponse.Content.ReadFromJsonAsync<CreatedTaskEnvelope>();
        createdTask.Should().NotBeNull();
        return createdTask!.Id;
    }

    private sealed record CreatedTaskEnvelope(Guid Id, string Identifier);
}
