using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Intake.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Intake.Endpoints;

public static class SubmissionEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        // Public submission endpoint (no auth)
        app.MapPost("/api/v1/intake/{formSlug}/submit", SubmitRequest)
            .WithTags("Intake")
            .WithName("SubmitIntakeRequest")
            .AllowAnonymous();

        var group = app.MapGroup("/api/v1/intake")
            .WithTags("Intake")
            .RequireAuthorization();

        group.MapGet("/submissions", ListSubmissions).WithName("ListSubmissions").RequireAuthorization("WorkspaceMember");
        group.MapPut("/submissions/{id:guid}/review", ReviewSubmission).WithName("ReviewSubmission").RequireAuthorization("WorkspaceMember");
        group.MapPost("/submissions/{id:guid}/convert-to-task", ConvertToTask).WithName("ConvertSubmissionToTask").RequireAuthorization("WorkspaceMember");
    }

    // ── POST /api/v1/intake/{formSlug}/submit (PUBLIC) ──
    private static async Task<IResult> SubmitRequest(
        string formSlug,
        SubmitRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        // Use IgnoreQueryFilters() because this is a public endpoint — no tenant context available
        var form = await db.RequestForms
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(f => f.Slug == formSlug && f.IsActive)
            .Select(f => new { f.Id, f.WorkspaceId })
            .FirstOrDefaultAsync(ct);

        if (form is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Request form with slug '{formSlug}' was not found or is not active.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (request.Data is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["data"] = ["Submission data is required."]
            });
        }

        var submission = new RequestSubmission
        {
            RequestFormId = form.Id,
            WorkspaceId = form.WorkspaceId,
            Data = request.Data,
            Status = SubmissionStatus.New,
            SubmitterEmail = request.SubmitterEmail ?? currentUser.Email,
            SubmitterUserId = currentUser.IsAuthenticated ? currentUser.UserId : null
        };

        db.RequestSubmissions.Add(submission);
        await db.SaveChangesAsync(ct);

        var response = ToSubmissionResponse(submission);

        return Results.Created($"/api/v1/intake/submissions/{submission.Id}", response);
    }

    // ── GET /api/v1/intake/submissions ──
    private static async Task<IResult> ListSubmissions(
        AppDbContext db,
        CancellationToken ct,
        Guid? requestFormId = null,
        string? status = null)
    {
        var query = db.RequestSubmissions.AsNoTracking().AsQueryable();

        if (requestFormId.HasValue)
            query = query.Where(s => s.RequestFormId == requestFormId.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<SubmissionStatus>(status, true, out var parsedStatus))
            query = query.Where(s => s.Status == parsedStatus);

        var submissions = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SubmissionResponse(
                s.Id,
                s.RequestFormId,
                s.Data,
                s.Status,
                s.SubmitterEmail,
                s.SubmitterUserId,
                s.ConvertedToTaskId,
                s.ReviewedAt,
                s.ReviewNotes,
                s.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(submissions);
    }

    // â”€â”€ PUT /api/v1/intake/submissions/{id}/review â”€â”€
    private static async Task<IResult> ReviewSubmission(
        Guid id,
        ReviewSubmissionRequest request,
        IValidator<ReviewSubmissionRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var submission = await db.RequestSubmissions
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (submission is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Submission with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (submission.Status == SubmissionStatus.ConvertedToTask)
        {
            return Results.Problem(
                title: "Conflict",
                detail: "Converted submissions cannot be reviewed again.",
                statusCode: StatusCodes.Status409Conflict);
        }

        submission.Status = request.Status;
        submission.ReviewNotes = request.ReviewNotes;
        submission.ReviewedBy = userId;
        submission.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return Results.Ok(ToSubmissionResponse(submission));
    }

    // ── POST /api/v1/intake/submissions/{id}/convert-to-task ──
    private static async Task<IResult> ConvertToTask(
        Guid id,
        ConvertToTaskRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var submission = await db.RequestSubmissions
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (submission is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Submission with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (submission.Status == SubmissionStatus.ConvertedToTask)
        {
            return Results.Problem(
                title: "Conflict",
                detail: "This submission has already been converted to a task.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // Validate the target project exists
        var project = await db.Projects.AsNoTracking()
            .Where(p => p.Id == request.ProjectId)
            .Select(p => new { p.Id, p.Identifier })
            .FirstOrDefaultAsync(ct);

        if (project is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: "Target project was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Generate task identifier: PROJECT-NNN
        var taskCount = await db.TaskItems.IgnoreQueryFilters()
            .CountAsync(t => t.ProjectId == request.ProjectId, ct);
        var identifier = $"{project.Identifier}-{taskCount + 1}";

        var taskTitle = request.Title ?? $"Intake submission #{submission.Id.ToString()[..8]}";

        var task = new TaskItem
        {
            Title = taskTitle,
            Identifier = identifier,
            ProjectId = request.ProjectId,
            Status = TaskItemStatus.Backlog,
            Priority = request.Priority ?? TaskPriority.None,
            AssigneeId = request.AssigneeId,
            CreatorId = userId,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.TaskItems.Add(task);

        // Update submission
        submission.Status = SubmissionStatus.ConvertedToTask;
        submission.ConvertedToTaskId = task.Id;
        submission.ReviewedBy = userId;
        submission.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        var response = new ConvertToTaskResponse(task.Id, task.Identifier, task.Title);
        return Results.Created($"/api/v1/tasks/{task.Id}", response);
    }

    private static SubmissionResponse ToSubmissionResponse(RequestSubmission submission)
    {
        return new SubmissionResponse(
            submission.Id,
            submission.RequestFormId,
            submission.Data,
            submission.Status,
            submission.SubmitterEmail,
            submission.SubmitterUserId,
            submission.ConvertedToTaskId,
            submission.ReviewedAt,
            submission.ReviewNotes,
            submission.CreatedAt);
    }
}
