using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using LinearPrecision.Api.Modules.Calendar.Models;
using LinearPrecision.Integration.Tests.Fixtures;
using LinearPrecision.Integration.Tests.Helpers;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Integration.Tests.Modules.Calendar;

[Collection("Api")]
public class CalendarEndpointTests
{
    private readonly ApiFixture _fixture;

    public CalendarEndpointTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [DockerFact]
    public async Task List_calendar_items_should_require_start_and_end_query_parameters()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            _fixture,
            client,
            email: $"calendar-range-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var start = new DateTime(2026, 7, 14, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc);

        var missingStartResponse = await authedClient.GetAsync($"/api/v1/calendar?end={FormatQueryDate(end)}");
        missingStartResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var missingEndResponse = await authedClient.GetAsync($"/api/v1/calendar?start={FormatQueryDate(start)}");
        missingEndResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [DockerFact]
    public async Task List_calendar_items_should_return_calendar_items_with_creator_metadata()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            _fixture,
            client,
            email: $"calendar-list-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var startTime = new DateTime(2026, 7, 14, 9, 0, 0, DateTimeKind.Utc);
        var endTime = new DateTime(2026, 7, 14, 10, 30, 0, DateTimeKind.Utc);
        var rangeStart = new DateTime(2026, 7, 14, 0, 0, 0, DateTimeKind.Utc);
        var rangeEnd = new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc);

        var createRequest = BuildCreateRequest("Calendar list contract", startTime, endTime);
        var createResponse = await authedClient.PostAsJsonAsync("/api/v1/calendar", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var payload = await createResponse.Content.ReadFromJsonAsync<CalendarItemResponse>(
            IntegrationJsonOptions.SerializerOptions);
        payload.Should().NotBeNull();
        payload!.Id.Should().NotBeEmpty();

        var listResponse = await authedClient.GetAsync(
            $"/api/v1/calendar?start={FormatQueryDate(rangeStart)}&end={FormatQueryDate(rangeEnd)}");

        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var items = await listResponse.Content.ReadFromJsonAsync<List<CalendarItemResponse>>(
            IntegrationJsonOptions.SerializerOptions);
        items.Should().ContainSingle();

        var item = items!.Single();
        AssertCalendarItem(item, createRequest, session.User.Id, session.User.FullName);
        item.Id.Should().Be(payload.Id);
        item.Creator.AvatarUrl.Should().BeNull();
    }

    [DockerFact]
    public async Task Create_calendar_item_should_return_the_created_item_and_location_header()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            _fixture,
            client,
            email: $"calendar-create-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var startTime = new DateTime(2026, 7, 14, 9, 0, 0, DateTimeKind.Utc);
        var endTime = new DateTime(2026, 7, 14, 10, 30, 0, DateTimeKind.Utc);
        var request = BuildCreateRequest("Launch planning sync", startTime, endTime, "Backend calendar create contract.");

        var response = await authedClient.PostAsJsonAsync("/api/v1/calendar", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        response.Headers.Location!.ToString().Should().Contain("/api/v1/calendar/");

        var payload = await response.Content.ReadFromJsonAsync<CalendarItemResponse>(
            IntegrationJsonOptions.SerializerOptions);
        payload.Should().NotBeNull();
        AssertCalendarItem(payload!, request, session.User.Id, session.User.FullName);
        payload!.CreatedAt.Should().NotBe(default);
        payload.UpdatedAt.Should().NotBe(default);
    }

    [DockerFact]
    public async Task Get_calendar_item_should_return_the_created_item()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            _fixture,
            client,
            email: $"calendar-get-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var startTime = new DateTime(2026, 7, 15, 13, 0, 0, DateTimeKind.Utc);
        var endTime = new DateTime(2026, 7, 15, 14, 0, 0, DateTimeKind.Utc);
        var request = BuildCreateRequest("Sprint review", startTime, endTime, "Backend calendar get contract.");

        var createResponse = await authedClient.PostAsJsonAsync("/api/v1/calendar", request);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<CalendarItemResponse>(
            IntegrationJsonOptions.SerializerOptions);
        created.Should().NotBeNull();

        var detailResponse = await authedClient.GetAsync($"/api/v1/calendar/{created!.Id}");

        detailResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await detailResponse.Content.ReadFromJsonAsync<CalendarItemResponse>(
            IntegrationJsonOptions.SerializerOptions);
        payload.Should().NotBeNull();
        AssertCalendarItem(payload!, request, session.User.Id, session.User.FullName);
        payload!.Id.Should().Be(created.Id);
    }

    [DockerFact]
    public async Task Update_calendar_item_should_persist_changes()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            _fixture,
            client,
            email: $"calendar-update-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var originalStart = new DateTime(2026, 7, 16, 8, 0, 0, DateTimeKind.Utc);
        var originalEnd = new DateTime(2026, 7, 16, 9, 0, 0, DateTimeKind.Utc);
        var createRequest = BuildCreateRequest("Weekly sync", originalStart, originalEnd, "Initial schedule.");

        var createResponse = await authedClient.PostAsJsonAsync("/api/v1/calendar", createRequest);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<CalendarItemResponse>(
            IntegrationJsonOptions.SerializerOptions);
        created.Should().NotBeNull();

        var updatedStart = new DateTime(2026, 7, 16, 10, 0, 0, DateTimeKind.Utc);
        var updatedEnd = new DateTime(2026, 7, 16, 11, 30, 0, DateTimeKind.Utc);
        var updateRequest = BuildUpdateRequest(
            "Weekly sync updated",
            updatedStart,
            updatedEnd,
            "Updated schedule and contract coverage.",
            CalendarItemType.Reminder,
            "#0F766E");

        var updateResponse = await authedClient.PutAsJsonAsync($"/api/v1/calendar/{created!.Id}", updateRequest);

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await updateResponse.Content.ReadFromJsonAsync<CalendarItemResponse>(
            IntegrationJsonOptions.SerializerOptions);
        payload.Should().NotBeNull();
        AssertCalendarItem(payload!, updateRequest, session.User.Id, session.User.FullName);
        payload!.Id.Should().Be(created.Id);
        payload.UpdatedAt.Should().NotBe(default(DateTime));
    }

    [DockerFact]
    public async Task Delete_calendar_item_should_remove_the_item()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            _fixture,
            client,
            email: $"calendar-delete-{Guid.NewGuid():N}@test.com");
        SetWorkspaceHeader(authedClient, session.ActiveWorkspaceId!.Value);

        var startTime = new DateTime(2026, 7, 17, 15, 0, 0, DateTimeKind.Utc);
        var endTime = new DateTime(2026, 7, 17, 16, 0, 0, DateTimeKind.Utc);
        var request = BuildCreateRequest("Delete me", startTime, endTime, "This item will be deleted.");

        var createResponse = await authedClient.PostAsJsonAsync("/api/v1/calendar", request);
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<CalendarItemResponse>(
            IntegrationJsonOptions.SerializerOptions);
        created.Should().NotBeNull();

        var deleteResponse = await authedClient.DeleteAsync($"/api/v1/calendar/{created!.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detailResponse = await authedClient.GetAsync($"/api/v1/calendar/{created.Id}");
        detailResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static CreateCalendarItemRequest BuildCreateRequest(
        string title,
        DateTime startTime,
        DateTime endTime,
        string? description = null)
    {
        return new CreateCalendarItemRequest(
            title,
            description,
            CalendarItemType.Event,
            "#2563EB",
            startTime,
            endTime,
            false,
            null,
            null,
            null);
    }

    private static UpdateCalendarItemRequest BuildUpdateRequest(
        string title,
        DateTime startTime,
        DateTime endTime,
        string? description,
        CalendarItemType type,
        string? color)
    {
        return new UpdateCalendarItemRequest(
            title,
            description,
            type,
            color,
            startTime,
            endTime,
            false,
            null,
            null,
            null);
    }

    private static void AssertCalendarItem(
        CalendarItemResponse item,
        CreateCalendarItemRequest request,
        Guid creatorId,
        string creatorFullName)
    {
        item.Title.Should().Be(request.Title);
        item.Description.Should().Be(request.Description);
        item.Type.Should().Be(request.Type);
        item.Color.Should().Be(request.Color);
        item.StartTime.Should().Be(request.StartTime);
        item.EndTime.Should().Be(request.EndTime);
        item.IsAllDay.Should().Be(request.IsAllDay ?? false);
        item.RecurrenceRule.Should().Be(request.RecurrenceRule);
        item.LinkedTaskId.Should().Be(request.LinkedTaskId);
        item.LinkedProjectId.Should().Be(request.LinkedProjectId);
        item.Creator.Id.Should().Be(creatorId);
        item.Creator.FullName.Should().Be(creatorFullName);
    }

    private static void AssertCalendarItem(
        CalendarItemResponse item,
        UpdateCalendarItemRequest request,
        Guid creatorId,
        string creatorFullName)
    {
        item.Title.Should().Be(request.Title);
        item.Description.Should().Be(request.Description);
        item.Type.Should().Be(request.Type);
        item.Color.Should().Be(request.Color);
        item.StartTime.Should().Be(request.StartTime);
        item.EndTime.Should().Be(request.EndTime);
        item.IsAllDay.Should().Be(request.IsAllDay ?? false);
        item.RecurrenceRule.Should().Be(request.RecurrenceRule);
        item.LinkedTaskId.Should().Be(request.LinkedTaskId);
        item.LinkedProjectId.Should().Be(request.LinkedProjectId);
        item.Creator.Id.Should().Be(creatorId);
        item.Creator.FullName.Should().Be(creatorFullName);
    }

    private static string FormatQueryDate(DateTime value)
    {
        return Uri.EscapeDataString(value.ToString("O"));
    }

    private static void SetWorkspaceHeader(HttpClient client, Guid workspaceId)
    {
        client.DefaultRequestHeaders.Remove("X-Workspace-Id");
        client.DefaultRequestHeaders.Add("X-Workspace-Id", workspaceId.ToString());
    }
}
