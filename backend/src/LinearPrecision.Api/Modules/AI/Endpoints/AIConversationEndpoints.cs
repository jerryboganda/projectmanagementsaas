using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.AI.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.AI.Endpoints;

public static class AIConversationEndpoints
{
    private const int ConversationDetailMessageLimit = 100;
    private const int ToolInvocationLimitPerMessage = 20;

    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/ai/conversations")
            .WithTags("AI Conversations")
            .RequireAuthorization();

        group.MapGet("/", ListConversations)
            .WithName("ListAIConversations")
            .Produces<List<ConversationResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapPost("/", CreateConversation)
            .WithName("CreateAIConversation")
            .Produces<ConversationResponse>(StatusCodes.Status201Created)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapGet("/{id:guid}", GetConversation)
            .WithName("GetAIConversation")
            .Produces<ConversationDetailResponse>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapDelete("/{id:guid}", DeleteConversation)
            .WithName("DeleteAIConversation")
            .Produces(StatusCodes.Status204NoContent)
            .RequireAuthorization(WorkspaceRoles.Member);
    }

    // ── GET /api/v1/ai/conversations ──
    private static async Task<IResult> ListConversations(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        int page = 1,
        int pageSize = 25)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var conversations = await db.AIConversations.AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(c => new ConversationResponse(
                c.Id,
                c.UserId,
                c.Title,
                c.Model,
                c.MessageCount,
                c.TotalTokensUsed,
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(conversations);
    }

    // ── POST /api/v1/ai/conversations ──
    private static async Task<IResult> CreateConversation(
        CreateConversationRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var providerModel = await db.AIProviderConnections.AsNoTracking()
            .Where(connection => connection.UserId == userId && connection.IsEnabled)
            .Select(connection => connection.Model)
            .FirstOrDefaultAsync(ct);

        var conversation = new AIConversation
        {
            UserId = userId,
            Title = request.Title,
            Model = request.Model ?? providerModel ?? "openai-compatible"
        };

        db.AIConversations.Add(conversation);
        await db.SaveChangesAsync(ct);

        var response = new ConversationResponse(
            conversation.Id,
            conversation.UserId,
            conversation.Title,
            conversation.Model,
            conversation.MessageCount,
            conversation.TotalTokensUsed,
            conversation.CreatedAt,
            conversation.UpdatedAt);

        return Results.Created($"/api/v1/ai/conversations/{conversation.Id}", response);
    }

    // ── GET /api/v1/ai/conversations/{id} ──
    private static async Task<IResult> GetConversation(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var conversation = await db.AIConversations.AsNoTracking()
            .Where(c => c.Id == id && c.UserId == userId)
            .Select(c => new
            {
                c.Id,
                c.UserId,
                c.Title,
                c.Model,
                c.MessageCount,
                c.TotalTokensUsed,
                c.CreatedAt,
                c.UpdatedAt
            })
            .FirstOrDefaultAsync(ct);

        if (conversation is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Conversation with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var messages = (await db.AIMessages.AsNoTracking()
            .Where(m => m.ConversationId == id)
            .OrderByDescending(m => m.CreatedAt)
            .Take(ConversationDetailMessageLimit)
            .Select(m => new
            {
                m.Id,
                m.ConversationId,
                m.Role,
                m.Content,
                m.TokensUsed,
                ToolInvocations = m.ToolInvocations
                    .OrderByDescending(t => t.CreatedAt)
                    .Take(ToolInvocationLimitPerMessage)
                    .Select(t => new ToolInvocationResponse(
                        t.Id,
                        t.ToolName,
                        t.Input,
                        t.Output,
                        t.Status,
                        t.Duration,
                        t.CreatedAt))
                    .ToList(),
                m.CreatedAt
            })
            .ToListAsync(ct))
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MessageResponse(
                m.Id,
                m.ConversationId,
                ToApiRole(m.Role),
                m.Content,
                m.TokensUsed,
                m.ToolInvocations,
                m.CreatedAt))
            .ToList();

        return Results.Ok(new ConversationDetailResponse(
            conversation.Id,
            conversation.UserId,
            conversation.Title,
            conversation.Model,
            conversation.MessageCount,
            conversation.TotalTokensUsed,
            messages,
            conversation.CreatedAt,
            conversation.UpdatedAt));
    }

    // ── DELETE /api/v1/ai/conversations/{id} ──
    private static async Task<IResult> DeleteConversation(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var conversation = await db.AIConversations
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, ct);

        if (conversation is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Conversation with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Hard delete — cascade will remove messages and tool invocations
        db.AIConversations.Remove(conversation);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    private static string ToApiRole(AIMessageRole role) => role.ToString().ToLowerInvariant();
}
