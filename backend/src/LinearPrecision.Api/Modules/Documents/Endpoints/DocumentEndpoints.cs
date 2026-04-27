using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Documents.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Documents.Endpoints;

public static class DocumentEndpoints
{
    private const int MaxPageSize = 100;

    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/documents")
            .WithTags("Documents")
            .RequireAuthorization();

        group.MapGet("/", ListDocuments)
            .WithName("ListDocuments")
            .Produces<List<DocumentResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Guest);

        group.MapPost("/", CreateDocument)
            .WithName("CreateDocument")
            .Produces<DocumentResponse>(StatusCodes.Status201Created)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapGet("/{id:guid}", GetDocument)
            .WithName("GetDocument")
            .Produces<DocumentResponse>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Guest);

        group.MapPut("/{id:guid}", UpdateDocument)
            .WithName("UpdateDocument")
            .Produces<DocumentResponse>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapDelete("/{id:guid}", DeleteDocument)
            .WithName("DeleteDocument")
            .Produces(StatusCodes.Status204NoContent)
            .RequireAuthorization(WorkspaceRoles.Member);

        // Separate group for project-scoped documents
        var projectGroup = app.MapGroup("/api/v1/projects/{projectId:guid}/documents")
            .WithTags("Documents")
            .RequireAuthorization();

        projectGroup.MapGet("/", ListProjectDocuments)
            .WithName("ListProjectDocuments")
            .Produces<List<DocumentResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Guest);
    }

    // ── GET /api/v1/documents ──
    private static async Task<IResult> ListDocuments(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        Guid? projectId = null,
        bool? isPublished = null,
        Guid? parentDocumentId = null,
        int page = 1,
        int pageSize = 25)
    {
        var query = db.Documents.AsNoTracking()
            .Where(d => !d.IsDeleted);

        if (projectId.HasValue)
            query = query.Where(d => d.ProjectId == projectId.Value);

        if (isPublished.HasValue)
            query = query.Where(d => d.IsPublished == isPublished.Value);

        if (parentDocumentId.HasValue)
            query = query.Where(d => d.ParentDocumentId == parentDocumentId.Value);

        var effectivePageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var documents = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(d => new DocumentResponse(
                d.Id,
                d.WorkspaceId,
                d.Title,
                null,
                d.ContentFormat,
                d.ProjectId,
                d.ParentDocumentId,
                new UserBriefResponse(d.Creator.Id, d.Creator.FullName, d.Creator.AvatarUrl),
                d.IsPublished,
                d.PublishedAt,
                d.SortOrder,
                null,
                d.CreatedAt,
                d.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(documents);
    }

    // ── POST /api/v1/documents ──
    private static async Task<IResult> CreateDocument(
        CreateDocumentRequest request,
        IValidator<CreateDocumentRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var document = new Document
        {
            Title = request.Title,
            Content = request.Content,
            ContentFormat = request.ContentFormat ?? "tiptap-json",
            ProjectId = request.ProjectId,
            ParentDocumentId = request.ParentDocumentId,
            CreatorId = userId,
            IsPublished = request.IsPublished ?? false,
            PublishedAt = (request.IsPublished ?? false) ? DateTime.UtcNow : null,
            SortOrder = request.SortOrder ?? 0,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.Documents.Add(document);
        await db.SaveChangesAsync(ct);

        // Load creator for response
        var creator = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
            .FirstAsync(ct);

        var response = new DocumentResponse(
            document.Id,
            document.WorkspaceId,
            document.Title,
            document.Content,
            document.ContentFormat,
            document.ProjectId,
            document.ParentDocumentId,
            creator,
            document.IsPublished,
            document.PublishedAt,
            document.SortOrder,
            null,
            document.CreatedAt,
            document.UpdatedAt);

        return Results.Created($"/api/v1/documents/{document.Id}", response);
    }

    // ── GET /api/v1/documents/{id} ──
    private static async Task<IResult> GetDocument(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var document = await db.Documents.AsNoTracking()
            .Where(d => d.Id == id && !d.IsDeleted)
            .Select(d => new DocumentResponse(
                d.Id,
                d.WorkspaceId,
                d.Title,
                d.Content,
                d.ContentFormat,
                d.ProjectId,
                d.ParentDocumentId,
                new UserBriefResponse(d.Creator.Id, d.Creator.FullName, d.Creator.AvatarUrl),
                d.IsPublished,
                d.PublishedAt,
                d.SortOrder,
                d.ChildDocuments
                    .Where(c => !c.IsDeleted)
                    .OrderBy(c => c.SortOrder)
                    .Select(c => new DocumentResponse(
                        c.Id,
                        c.WorkspaceId,
                        c.Title,
                        c.Content,
                        c.ContentFormat,
                        c.ProjectId,
                        c.ParentDocumentId,
                        new UserBriefResponse(c.Creator.Id, c.Creator.FullName, c.Creator.AvatarUrl),
                        c.IsPublished,
                        c.PublishedAt,
                        c.SortOrder,
                        null,
                        c.CreatedAt,
                        c.UpdatedAt))
                    .ToList(),
                d.CreatedAt,
                d.UpdatedAt))
            .FirstOrDefaultAsync(ct);

        if (document is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Document with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(document);
    }

    // ── PUT /api/v1/documents/{id} ──
    private static async Task<IResult> UpdateDocument(
        Guid id,
        UpdateDocumentRequest request,
        IValidator<UpdateDocumentRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var document = await db.Documents
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, ct);

        if (document is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Document with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        document.Title = request.Title;
        document.Content = request.Content;
        document.ContentFormat = request.ContentFormat ?? document.ContentFormat;
        document.ProjectId = request.ProjectId;
        document.ParentDocumentId = request.ParentDocumentId;
        document.UpdatedBy = userId;

        if (request.SortOrder.HasValue)
            document.SortOrder = request.SortOrder.Value;

        if (request.IsPublished.HasValue)
        {
            var wasPublished = document.IsPublished;
            document.IsPublished = request.IsPublished.Value;
            if (!wasPublished && request.IsPublished.Value)
                document.PublishedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        // Load creator for response
        var creator = await db.Users.AsNoTracking()
            .Where(u => u.Id == document.CreatorId)
            .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
            .FirstAsync(ct);

        var response = new DocumentResponse(
            document.Id,
            document.WorkspaceId,
            document.Title,
            document.Content,
            document.ContentFormat,
            document.ProjectId,
            document.ParentDocumentId,
            creator,
            document.IsPublished,
            document.PublishedAt,
            document.SortOrder,
            null,
            document.CreatedAt,
            document.UpdatedAt);

        return Results.Ok(response);
    }

    // ── DELETE /api/v1/documents/{id} ──
    private static async Task<IResult> DeleteDocument(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var document = await db.Documents
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, ct);

        if (document is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Document with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        document.IsDeleted = true;
        document.DeletedAt = DateTime.UtcNow;
        document.DeletedBy = currentUser.UserId;

        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    // ── GET /api/v1/projects/{projectId}/documents ──
    private static async Task<IResult> ListProjectDocuments(
        Guid projectId,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        bool? isPublished = null,
        Guid? parentDocumentId = null,
        int page = 1,
        int pageSize = 25)
    {
        var effectivePageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var query = db.Documents.AsNoTracking()
            .Where(d => d.ProjectId == projectId && !d.IsDeleted);

        if (isPublished.HasValue)
            query = query.Where(d => d.IsPublished == isPublished.Value);

        if (parentDocumentId.HasValue)
            query = query.Where(d => d.ParentDocumentId == parentDocumentId.Value);

        var documents = await query
            .OrderBy(d => d.SortOrder)
            .ThenByDescending(d => d.CreatedAt)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(d => new DocumentResponse(
                d.Id,
                d.WorkspaceId,
                d.Title,
                null,
                d.ContentFormat,
                d.ProjectId,
                d.ParentDocumentId,
                new UserBriefResponse(d.Creator.Id, d.Creator.FullName, d.Creator.AvatarUrl),
                d.IsPublished,
                d.PublishedAt,
                d.SortOrder,
                null,
                d.CreatedAt,
                d.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(documents);
    }
}
