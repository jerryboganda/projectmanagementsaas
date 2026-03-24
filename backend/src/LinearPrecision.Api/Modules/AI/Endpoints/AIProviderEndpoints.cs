using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.AI.Models;
using LinearPrecision.Api.Modules.AI.Services;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.AI.Endpoints;

public static class AIProviderEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/ai/provider")
            .WithTags("AI Provider")
            .RequireAuthorization();

        group.MapGet("/", GetProvider)
            .WithName("GetAIProvider")
            .Produces<AIProviderSettingsResponse>(StatusCodes.Status200OK)
            .RequireAuthorization("WorkspaceMember");

        group.MapPut("/", UpsertProvider)
            .WithName("UpsertAIProvider")
            .Produces<AIProviderSettingsResponse>(StatusCodes.Status200OK)
            .RequireAuthorization("WorkspaceMember");

        group.MapDelete("/", DeleteProvider)
            .WithName("DeleteAIProvider")
            .Produces(StatusCodes.Status204NoContent)
            .RequireAuthorization("WorkspaceMember");
    }

    private static async Task<IResult> GetProvider(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var provider = await db.AIProviderConnections.AsNoTracking()
            .FirstOrDefaultAsync(connection => connection.UserId == userId, ct);

        return Results.Ok(ToResponse(provider));
    }

    private static async Task<IResult> UpsertProvider(
        UpdateAIProviderSettingsRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        IAISecretProtector secretProtector,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var validationErrors = ValidateRequest(request);
        if (validationErrors.Count > 0)
        {
            return Results.ValidationProblem(validationErrors);
        }

        var provider = await db.AIProviderConnections
            .FirstOrDefaultAsync(connection => connection.UserId == userId, ct);

        if (provider is null)
        {
            if (string.IsNullOrWhiteSpace(request.ApiKey))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["ApiKey"] = ["API key is required when connecting a provider for the first time."],
                });
            }

            provider = new AIProviderConnection
            {
                UserId = userId,
            };
            db.AIProviderConnections.Add(provider);
        }
        else if (string.IsNullOrWhiteSpace(request.ApiKey) && string.IsNullOrWhiteSpace(provider.ProtectedApiKey))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["ApiKey"] = ["API key is required when no stored provider key exists."],
            });
        }

        provider.ProviderName = request.ProviderName.Trim();
        provider.BaseUrl = request.BaseUrl.Trim().TrimEnd('/');
        provider.Model = request.Model.Trim();
        provider.IsEnabled = request.IsEnabled;

        if (!string.IsNullOrWhiteSpace(request.ApiKey))
        {
            provider.ProtectedApiKey = secretProtector.Protect(request.ApiKey.Trim());
        }

        await db.SaveChangesAsync(ct);

        return Results.Ok(ToResponse(provider));
    }

    private static async Task<IResult> DeleteProvider(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var provider = await db.AIProviderConnections
            .FirstOrDefaultAsync(connection => connection.UserId == userId, ct);

        if (provider is not null)
        {
            db.AIProviderConnections.Remove(provider);
            await db.SaveChangesAsync(ct);
        }

        return Results.NoContent();
    }

    private static Dictionary<string, string[]> ValidateRequest(UpdateAIProviderSettingsRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.ProviderName))
        {
            errors["ProviderName"] = ["Provider name is required."];
        }

        if (string.IsNullOrWhiteSpace(request.BaseUrl) ||
            !Uri.TryCreate(request.BaseUrl, UriKind.Absolute, out var uri) ||
            uri.Scheme is not ("http" or "https"))
        {
            errors["BaseUrl"] = ["Base URL must be a valid HTTP or HTTPS URL."];
        }

        if (string.IsNullOrWhiteSpace(request.Model))
        {
            errors["Model"] = ["Model is required."];
        }

        return errors;
    }

    private static AIProviderSettingsResponse ToResponse(AIProviderConnection? provider)
    {
        if (provider is null)
        {
            return new AIProviderSettingsResponse(
                null,
                "OpenAI-Compatible",
                string.Empty,
                string.Empty,
                false,
                false,
                null,
                null);
        }

        return new AIProviderSettingsResponse(
            provider.Id,
            provider.ProviderName,
            provider.BaseUrl,
            provider.Model,
            provider.IsEnabled,
            !string.IsNullOrWhiteSpace(provider.ProtectedApiKey),
            MaskApiKey(provider.ProtectedApiKey),
            provider.UpdatedAt);
    }

    private static string? MaskApiKey(string protectedApiKey)
    {
        if (string.IsNullOrWhiteSpace(protectedApiKey))
        {
            return null;
        }

        var visibleSuffix = protectedApiKey.Length >= 4
            ? protectedApiKey[^4..]
            : protectedApiKey;

        return $"Stored ending in {visibleSuffix}";
    }
}
