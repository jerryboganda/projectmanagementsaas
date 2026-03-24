using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.AI.Models;
using LinearPrecision.Api.Modules.AI.Services;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.AI.Endpoints;

public static class AIMessageEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/ai/conversations/{conversationId:guid}/messages")
            .WithTags("AI Messages")
            .RequireAuthorization();

        group.MapPost("/", SendMessage)
            .WithName("SendAIMessage")
            .Produces<MessageResponse>(StatusCodes.Status201Created)
            .RequireAuthorization("WorkspaceMember");
    }

    // ── POST /api/v1/ai/conversations/{conversationId}/messages ──
    private static async Task<IResult> SendMessage(
        Guid conversationId,
        SendMessageRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        IAIChatCompletionService chatCompletionService,
        IAISecretProtector secretProtector,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        if (string.IsNullOrWhiteSpace(request.Content) || request.Content.Length > 10_000)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["Content"] = request.Content is null || string.IsNullOrWhiteSpace(request.Content)
                    ? ["Content is required."]
                    : ["Content must not exceed 10000 characters."]
            });
        }

        var conversation = await db.AIConversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.UserId == userId, ct);

        if (conversation is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Conversation with id '{conversationId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var provider = await db.AIProviderConnections
            .FirstOrDefaultAsync(connection => connection.UserId == userId && connection.IsEnabled, ct);

        if (provider is null || string.IsNullOrWhiteSpace(provider.ProtectedApiKey))
        {
            return Results.Problem(
                title: "AI Provider Not Configured",
                detail: "Attach an OpenAI-compatible provider in Settings > Integrations before sending AI messages.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var userMessage = new AIMessage
        {
            ConversationId = conversationId,
            Role = AIMessageRole.User,
            Content = request.Content.Trim()
        };

        db.AIMessages.Add(userMessage);
        conversation.MessageCount++;
        await db.SaveChangesAsync(ct);

        var history = await db.AIMessages.AsNoTracking()
            .Where(message => message.ConversationId == conversationId)
            .OrderBy(message => message.CreatedAt)
            .Select(message => new AIChatMessageInput(
                ToProviderRole(message.Role),
                message.Content))
            .ToListAsync(ct);

        AIChatCompletionResult completion;
        try
        {
            var apiKey = secretProtector.Unprotect(provider.ProtectedApiKey);
            completion = await chatCompletionService.CompleteAsync(provider, history, apiKey, ct);
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "AI Provider Error",
                detail: ex.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }

        var assistantMessage = new AIMessage
        {
            ConversationId = conversationId,
            Role = AIMessageRole.Assistant,
            Content = completion.Content,
            TokensUsed = completion.TotalTokens,
        };

        db.AIMessages.Add(assistantMessage);
        conversation.MessageCount++;
        if (completion.TotalTokens.HasValue)
        {
            conversation.TotalTokensUsed += completion.TotalTokens.Value;
        }

        await db.SaveChangesAsync(ct);

        var response = new MessageResponse(
            assistantMessage.Id,
            assistantMessage.ConversationId,
            ToApiRole(assistantMessage.Role),
            assistantMessage.Content,
            assistantMessage.TokensUsed,
            null,
            assistantMessage.CreatedAt);

        return Results.Created(
            $"/api/v1/ai/conversations/{conversationId}/messages/{assistantMessage.Id}",
            response);
    }

    private static string ToApiRole(AIMessageRole role) => role.ToString().ToLowerInvariant();

    private static string ToProviderRole(AIMessageRole role) => role.ToString().ToLowerInvariant();
}
