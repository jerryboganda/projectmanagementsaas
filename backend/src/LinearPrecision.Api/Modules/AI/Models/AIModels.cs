using System.Text.Json;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.AI.Models;

public sealed record CreateConversationRequest(string? Title, string? Model);

public sealed record ConversationResponse(
    Guid Id,
    Guid UserId,
    string? Title,
    string Model,
    int MessageCount,
    int TotalTokensUsed,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record ConversationDetailResponse(
    Guid Id,
    Guid UserId,
    string? Title,
    string Model,
    int MessageCount,
    int TotalTokensUsed,
    List<MessageResponse> Messages,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record SendMessageRequest(string Content);

public sealed record MessageResponse(
    Guid Id,
    Guid ConversationId,
    string Role,
    string Content,
    int? TokensUsed,
    List<ToolInvocationResponse>? ToolInvocations,
    DateTime CreatedAt);

public sealed record AIProviderSettingsResponse(
    Guid? Id,
    string ProviderName,
    string BaseUrl,
    string Model,
    bool IsEnabled,
    bool IsConfigured,
    string? MaskedApiKey,
    DateTime? UpdatedAt);

public sealed record UpdateAIProviderSettingsRequest(
    string ProviderName,
    string BaseUrl,
    string Model,
    string? ApiKey,
    bool IsEnabled);

public sealed record ToolInvocationResponse(
    Guid Id,
    string ToolName,
    JsonDocument Input,
    JsonDocument? Output,
    AIToolInvocationStatus Status,
    TimeSpan? Duration,
    DateTime CreatedAt);
