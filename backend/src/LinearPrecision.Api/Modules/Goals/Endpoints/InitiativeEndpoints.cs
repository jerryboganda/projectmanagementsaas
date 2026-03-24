using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Goals.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Goals.Endpoints;

public static class InitiativeEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/goals/{goalId:guid}/initiatives")
            .WithTags("Goals")
            .RequireAuthorization();

        group.MapPost("/", CreateInitiative).WithName("CreateInitiative").RequireAuthorization("WorkspaceMember");
        group.MapPut("/{initId:guid}", UpdateInitiative).WithName("UpdateInitiative").RequireAuthorization("WorkspaceMember");
    }

    // ── POST /api/v1/goals/{goalId}/initiatives ──
    private static async Task<IResult> CreateInitiative(
        Guid goalId,
        CreateInitiativeRequest request,
        IValidator<CreateInitiativeRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        if (!await db.Goals.AnyAsync(g => g.Id == goalId && !g.IsDeleted, ct))
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Goal with id '{goalId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var initiative = new Initiative
        {
            GoalId = goalId,
            Title = request.Title,
            Description = request.Description,
            Status = request.Status ?? InitiativeStatus.Planned,
            OwnerId = request.OwnerId,
            StartDate = request.StartDate,
            TargetDate = request.TargetDate,
            ProgressPercent = request.ProgressPercent ?? 0,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.Initiatives.Add(initiative);
        await db.SaveChangesAsync(ct);

        var response = new InitiativeResponse(
            initiative.Id,
            initiative.GoalId,
            initiative.Title,
            initiative.Description,
            initiative.Status,
            null,
            initiative.StartDate,
            initiative.TargetDate,
            initiative.ProgressPercent,
            initiative.CreatedAt,
            initiative.UpdatedAt);

        return Results.Created($"/api/v1/goals/{goalId}/initiatives/{initiative.Id}", response);
    }

    // ── PUT /api/v1/goals/{goalId}/initiatives/{initId} ──
    private static async Task<IResult> UpdateInitiative(
        Guid goalId,
        Guid initId,
        UpdateInitiativeRequest request,
        IValidator<UpdateInitiativeRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var initiative = await db.Initiatives
            .FirstOrDefaultAsync(i => i.Id == initId && i.GoalId == goalId && !i.IsDeleted, ct);

        if (initiative is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Initiative with id '{initId}' was not found for goal '{goalId}'.",
                statusCode: StatusCodes.Status404NotFound);
        }

        initiative.Title = request.Title;
        initiative.Description = request.Description;
        initiative.Status = request.Status;
        initiative.OwnerId = request.OwnerId;
        initiative.StartDate = request.StartDate;
        initiative.TargetDate = request.TargetDate;
        initiative.ProgressPercent = request.ProgressPercent ?? initiative.ProgressPercent;
        initiative.UpdatedBy = userId;

        await db.SaveChangesAsync(ct);
        return Results.Ok(new { initiative.Id });
    }
}
