using LinearPrecision.Api.Entities;

namespace LinearPrecision.Api.Modules.AI.Services;

public sealed record AIChatMessageInput(string Role, string Content);

public sealed record AIChatCompletionResult(string Content, int? TotalTokens);

public interface IAIChatCompletionService
{
    Task<AIChatCompletionResult> CompleteAsync(
        AIProviderConnection provider,
        IReadOnlyList<AIChatMessageInput> messages,
        string apiKey,
        CancellationToken ct);
}
