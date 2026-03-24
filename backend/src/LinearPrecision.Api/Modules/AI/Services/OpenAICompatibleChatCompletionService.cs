using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LinearPrecision.Api.Entities;

namespace LinearPrecision.Api.Modules.AI.Services;

public sealed class OpenAICompatibleChatCompletionService : IAIChatCompletionService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient;

    public OpenAICompatibleChatCompletionService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<AIChatCompletionResult> CompleteAsync(
        AIProviderConnection provider,
        IReadOnlyList<AIChatMessageInput> messages,
        string apiKey,
        CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, BuildChatCompletionsUrl(provider.BaseUrl));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = JsonContent.Create(
            new
            {
                model = provider.Model,
                messages = messages.Select(message => new
                {
                    role = message.Role,
                    content = message.Content,
                }),
            },
            options: SerializerOptions);

        using var response = await _httpClient.SendAsync(request, ct);
        var payload = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                string.IsNullOrWhiteSpace(payload)
                    ? $"The AI provider returned HTTP {(int)response.StatusCode}."
                    : payload);
        }

        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;
        var content = ExtractAssistantContent(root);

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("The AI provider returned an empty assistant response.");
        }

        var totalTokens =
            root.TryGetProperty("usage", out var usageElement) &&
            usageElement.ValueKind == JsonValueKind.Object &&
            usageElement.TryGetProperty("total_tokens", out var totalTokensElement) &&
            totalTokensElement.TryGetInt32(out var usageTotalTokens)
                ? (int?)usageTotalTokens
                : null;

        return new AIChatCompletionResult(content, totalTokens);
    }

    private static string BuildChatCompletionsUrl(string baseUrl)
    {
        var trimmed = baseUrl.Trim().TrimEnd('/');

        if (trimmed.EndsWith("/chat/completions", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        if (trimmed.EndsWith("/v1", StringComparison.OrdinalIgnoreCase))
        {
            return $"{trimmed}/chat/completions";
        }

        return $"{trimmed}/v1/chat/completions";
    }

    private static string? ExtractAssistantContent(JsonElement root)
    {
        if (!root.TryGetProperty("choices", out var choicesElement) ||
            choicesElement.ValueKind != JsonValueKind.Array ||
            choicesElement.GetArrayLength() == 0)
        {
            return null;
        }

        var firstChoice = choicesElement[0];
        if (!firstChoice.TryGetProperty("message", out var messageElement) ||
            messageElement.ValueKind != JsonValueKind.Object ||
            !messageElement.TryGetProperty("content", out var contentElement))
        {
            return null;
        }

        if (contentElement.ValueKind == JsonValueKind.String)
        {
            return contentElement.GetString();
        }

        if (contentElement.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var parts = new List<string>();
        foreach (var contentPart in contentElement.EnumerateArray())
        {
            if (contentPart.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            if (contentPart.TryGetProperty("text", out var textElement) &&
                textElement.ValueKind == JsonValueKind.String &&
                !string.IsNullOrWhiteSpace(textElement.GetString()))
            {
                parts.Add(textElement.GetString()!);
            }
        }

        return parts.Count == 0 ? null : string.Join("\n", parts);
    }
}
