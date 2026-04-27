using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Tasks.Models;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Tasks.Endpoints;

public static class TaskDependencyEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/tasks/{taskId:guid}/dependencies")
            .WithTags("Tasks")
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapPost("/", AddDependency).WithName("AddTaskDependency");
        group.MapDelete("/{depId:guid}", RemoveDependency).WithName("RemoveTaskDependency");
    }

    // ── POST /api/v1/tasks/{taskId}/dependencies ──
    private static async Task<IResult> AddDependency(
        Guid taskId,
        AddDependencyRequest request,
        IValidator<AddDependencyRequest> validator,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        // Prevent self-dependency
        if (taskId == request.DependsOnTaskId)
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: "A task cannot depend on itself.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (!await db.TaskItems.AnyAsync(t => t.Id == taskId, ct))
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Task with id '{taskId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (!await db.TaskItems.AnyAsync(t => t.Id == request.DependsOnTaskId, ct))
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: "Dependency task was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Prevent duplicate
        if (await db.TaskDependencies.AnyAsync(
                d => d.TaskId == taskId && d.DependsOnTaskId == request.DependsOnTaskId, ct))
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: "This dependency already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var dep = new TaskDependency
        {
            TaskId = taskId,
            DependsOnTaskId = request.DependsOnTaskId,
            Type = request.Type ?? DependencyType.FinishToStart
        };

        db.TaskDependencies.Add(dep);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/v1/tasks/{taskId}/dependencies/{dep.Id}",
            new DependencyResponse(dep.Id, dep.TaskId, dep.DependsOnTaskId, dep.Type, dep.CreatedAt));
    }

    // ── DELETE /api/v1/tasks/{taskId}/dependencies/{depId} ──
    private static async Task<IResult> RemoveDependency(
        Guid taskId,
        Guid depId,
        AppDbContext db,
        CancellationToken ct)
    {
        var dep = await db.TaskDependencies
            .FirstOrDefaultAsync(d => d.Id == depId && d.TaskId == taskId, ct);

        if (dep is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: "Dependency was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        db.TaskDependencies.Remove(dep);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }
}
