using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Automations.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Automations.Endpoints;

public static class AutomationEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/automations")
            .WithTags("Automations")
            .RequireAuthorization();

        group.MapGet("/", ListAutomations)
            .WithName("ListAutomations")
            .Produces<List<AutomationRuleResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapPost("/", CreateAutomation)
            .WithName("CreateAutomation")
            .Produces<AutomationRuleResponse>(StatusCodes.Status201Created)
            .RequireAuthorization(WorkspaceRoles.Admin);

        group.MapPut("/{id:guid}", UpdateAutomation)
            .WithName("UpdateAutomation")
            .Produces<AutomationRuleResponse>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Admin);

        group.MapDelete("/{id:guid}", DeleteAutomation)
            .WithName("DeleteAutomation")
            .Produces(StatusCodes.Status204NoContent)
            .RequireAuthorization(WorkspaceRoles.Admin);
    }

    // ── GET /api/v1/automations ──
    private static async Task<IResult> ListAutomations(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        bool? isEnabled = null,
        Guid? projectId = null,
        int page = 1,
        int pageSize = 25)
    {
        var query = db.AutomationRules.AsNoTracking().AsQueryable();

        if (isEnabled.HasValue)
            query = query.Where(r => r.IsActive == isEnabled.Value);

        if (projectId.HasValue)
            query = query.Where(r => r.ProjectId == projectId.Value);

        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var rules = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(r => new AutomationRuleResponse(
                r.Id,
                r.Name,
                r.Description,
                r.IsActive,
                r.Trigger,
                r.Action,
                r.ProjectId,
                r.ExecutionCount,
                r.LastExecutedAt,
                r.CreatedAt,
                r.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(rules);
    }

    // ── POST /api/v1/automations ──
    private static async Task<IResult> CreateAutomation(
        CreateAutomationRuleRequest request,
        IValidator<CreateAutomationRuleRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var rule = new AutomationRule
        {
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive ?? true,
            Trigger = request.Trigger,
            Action = request.Action,
            ProjectId = request.ProjectId,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.AutomationRules.Add(rule);
        await db.SaveChangesAsync(ct);

        var response = new AutomationRuleResponse(
            rule.Id,
            rule.Name,
            rule.Description,
            rule.IsActive,
            rule.Trigger,
            rule.Action,
            rule.ProjectId,
            rule.ExecutionCount,
            rule.LastExecutedAt,
            rule.CreatedAt,
            rule.UpdatedAt);

        return Results.Created($"/api/v1/automations/{rule.Id}", response);
    }

    // ── PUT /api/v1/automations/{id} ──
    private static async Task<IResult> UpdateAutomation(
        Guid id,
        UpdateAutomationRuleRequest request,
        IValidator<UpdateAutomationRuleRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var rule = await db.AutomationRules
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (rule is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Automation rule with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        rule.Name = request.Name;
        rule.Description = request.Description;
        rule.IsActive = request.IsActive ?? rule.IsActive;
        rule.Trigger = request.Trigger;
        rule.Action = request.Action;
        rule.ProjectId = request.ProjectId;
        rule.UpdatedBy = userId;

        await db.SaveChangesAsync(ct);

        var response = new AutomationRuleResponse(
            rule.Id,
            rule.Name,
            rule.Description,
            rule.IsActive,
            rule.Trigger,
            rule.Action,
            rule.ProjectId,
            rule.ExecutionCount,
            rule.LastExecutedAt,
            rule.CreatedAt,
            rule.UpdatedAt);

        return Results.Ok(response);
    }

    // ── DELETE /api/v1/automations/{id} ──
    private static async Task<IResult> DeleteAutomation(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var rule = await db.AutomationRules
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (rule is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Automation rule with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Hard delete — cascade will remove associated logs
        db.AutomationRules.Remove(rule);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }
}
