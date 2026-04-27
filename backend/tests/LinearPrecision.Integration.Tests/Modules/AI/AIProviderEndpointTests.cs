using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LinearPrecision.Integration.Tests.Fixtures;
using LinearPrecision.Integration.Tests.Helpers;

namespace LinearPrecision.Integration.Tests.Modules.AI;

[Collection("Api")]
public class AIProviderEndpointTests
{
    private readonly ApiFixture _fixture;

    public AIProviderEndpointTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [DockerFact]
    public async Task Put_ai_provider_should_persist_masked_provider_settings()
    {
        var client = await CreateWorkspaceScopedClientAsync();

        var updateResponse = await client.PutAsJsonAsync(
            "/api/v1/ai/provider",
            new
            {
                providerName = "OpenRouter",
                baseUrl = "https://openrouter.ai/api/v1",
                model = "openai/gpt-4.1-mini",
                apiKey = "sk-or-v1-1234567890abcdef",
                isEnabled = true,
            });

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getResponse = await client.GetAsync("/api/v1/ai/provider");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await getResponse.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("isConfigured").GetBoolean().Should().BeTrue();
        payload.GetProperty("providerName").GetString().Should().Be("OpenRouter");
        payload.GetProperty("baseUrl").GetString().Should().Be("https://openrouter.ai/api/v1");
        payload.GetProperty("model").GetString().Should().Be("openai/gpt-4.1-mini");
        payload.GetProperty("maskedApiKey").GetString().Should().NotBeNullOrWhiteSpace();
        payload.GetProperty("maskedApiKey").GetString().Should().NotContain("1234567890abcdef");
    }

    [DockerFact]
    public async Task Send_message_should_return_assistant_reply_when_provider_is_configured()
    {
        var client = await CreateWorkspaceScopedClientAsync();

        var providerResponse = await client.PutAsJsonAsync(
            "/api/v1/ai/provider",
            new
            {
                providerName = "Test Provider",
                baseUrl = "https://provider.test/v1",
                model = "test-model",
                apiKey = "test-api-key",
                isEnabled = true,
            });

        providerResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var createConversationResponse = await client.PostAsJsonAsync(
            "/api/v1/ai/conversations",
            new
            {
                title = "Provider-backed chat",
            });

        createConversationResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var conversationPayload = await createConversationResponse.Content.ReadFromJsonAsync<JsonElement>();
        var conversationId = conversationPayload.GetProperty("id").GetGuid();

        var sendResponse = await client.PostAsJsonAsync(
            $"/api/v1/ai/conversations/{conversationId}/messages",
            new
            {
                content = "Summarize the board status.",
            });

        sendResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var assistantPayload = await sendResponse.Content.ReadFromJsonAsync<JsonElement>();
        assistantPayload.GetProperty("role").GetString().Should().Be("assistant");
        assistantPayload.GetProperty("content").GetString().Should().NotBeNullOrWhiteSpace();

        var conversationResponse = await client.GetAsync($"/api/v1/ai/conversations/{conversationId}");
        conversationResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var conversationDetailPayload = await conversationResponse.Content.ReadFromJsonAsync<JsonElement>();
        var messages = conversationDetailPayload.GetProperty("messages");
        messages.GetArrayLength().Should().Be(2);
        messages[0].GetProperty("role").GetString().Should().Be("user");
        messages[1].GetProperty("role").GetString().Should().Be("assistant");
    }

    private async Task<HttpClient> CreateWorkspaceScopedClientAsync()
    {
        var client = _fixture.CreateClient();
        var (authedClient, session) = await AuthHelper.CreateAuthenticatedClientAsync(
            _fixture,
            client,
            email: $"ai-provider-{Guid.NewGuid():N}@test.com");

        session.ActiveWorkspaceId.Should().NotBeNull();
        authedClient.DefaultRequestHeaders.Add("X-Workspace-Id", session.ActiveWorkspaceId!.Value.ToString());
        return authedClient;
    }
}
