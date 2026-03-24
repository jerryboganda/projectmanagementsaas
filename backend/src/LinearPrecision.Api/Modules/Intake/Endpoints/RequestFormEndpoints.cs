using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Intake.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Intake.Endpoints;

public static class RequestFormEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/request-forms")
            .WithTags("Intake")
            .RequireAuthorization();

        group.MapGet("/", ListForms).WithName("ListRequestForms").RequireAuthorization("WorkspaceMember");
        group.MapPost("/", CreateForm).WithName("CreateRequestForm").RequireAuthorization("WorkspaceAdmin");
        group.MapPut("/{id:guid}", UpdateForm).WithName("UpdateRequestForm").RequireAuthorization("WorkspaceAdmin");
        group.MapDelete("/{id:guid}", DeleteForm).WithName("DeleteRequestForm").RequireAuthorization("WorkspaceAdmin");
    }

    // ── GET /api/v1/request-forms ──
    private static async Task<IResult> ListForms(
        AppDbContext db,
        CancellationToken ct,
        bool? isActive = null)
    {
        var query = db.RequestForms.AsNoTracking().AsQueryable();

        if (isActive.HasValue)
            query = query.Where(f => f.IsActive == isActive.Value);

        var forms = await query
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new RequestFormResponse(
                f.Id,
                f.Title,
                f.Description,
                f.Slug,
                f.IsActive,
                f.IsPublic,
                f.FormSchema,
                f.DefaultProjectId,
                f.CreatedAt,
                f.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(forms);
    }

    // ── POST /api/v1/request-forms ──
    private static async Task<IResult> CreateForm(
        CreateRequestFormRequest request,
        IValidator<CreateRequestFormRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        // Check slug uniqueness within workspace
        var slugExists = await db.RequestForms.AnyAsync(f => f.Slug == request.Slug, ct);
        if (slugExists)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["slug"] = ["A form with this slug already exists in this workspace."]
            });
        }

        var form = new RequestForm
        {
            Title = request.Title,
            Description = request.Description,
            Slug = request.Slug,
            IsActive = request.IsActive ?? true,
            IsPublic = request.IsPublic ?? false,
            FormSchema = request.FormSchema,
            DefaultProjectId = request.DefaultProjectId,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.RequestForms.Add(form);
        await db.SaveChangesAsync(ct);

        var response = new RequestFormResponse(
            form.Id,
            form.Title,
            form.Description,
            form.Slug,
            form.IsActive,
            form.IsPublic,
            form.FormSchema,
            form.DefaultProjectId,
            form.CreatedAt,
            form.UpdatedAt);

        return Results.Created($"/api/v1/request-forms/{form.Id}", response);
    }

    // ── PUT /api/v1/request-forms/{id} ──
    private static async Task<IResult> UpdateForm(
        Guid id,
        UpdateRequestFormRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length > 200)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["title"] = ["Title is required and must be at most 200 characters."]
            });
        }

        if (string.IsNullOrWhiteSpace(request.Slug) || request.Slug.Length > 50)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["slug"] = ["Slug is required and must be at most 50 characters."]
            });
        }

        var form = await db.RequestForms.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (form is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Request form with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Check slug uniqueness (excluding current form)
        var slugExists = await db.RequestForms.AnyAsync(f => f.Slug == request.Slug && f.Id != id, ct);
        if (slugExists)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["slug"] = ["A form with this slug already exists in this workspace."]
            });
        }

        form.Title = request.Title;
        form.Description = request.Description;
        form.Slug = request.Slug;
        form.IsActive = request.IsActive ?? form.IsActive;
        form.IsPublic = request.IsPublic ?? form.IsPublic;
        form.FormSchema = request.FormSchema;
        form.DefaultProjectId = request.DefaultProjectId;
        form.UpdatedBy = userId;

        await db.SaveChangesAsync(ct);

        var response = new RequestFormResponse(
            form.Id,
            form.Title,
            form.Description,
            form.Slug,
            form.IsActive,
            form.IsPublic,
            form.FormSchema,
            form.DefaultProjectId,
            form.CreatedAt,
            form.UpdatedAt);

        return Results.Ok(response);
    }

    // ── DELETE /api/v1/request-forms/{id} ──
    private static async Task<IResult> DeleteForm(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var form = await db.RequestForms.FirstOrDefaultAsync(f => f.Id == id, ct);
        if (form is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Request form with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        db.RequestForms.Remove(form);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }
}
