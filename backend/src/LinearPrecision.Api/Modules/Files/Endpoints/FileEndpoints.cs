using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Files.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Files.Endpoints;

public static class FileEndpoints
{
    // F-09: MIME allowlist for user uploads. Rejects executables, scripts, and unknown
    // types up-front so they never reach object storage.
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        // Images
        "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        // Text / data
        "text/plain", "text/csv", "text/markdown", "application/json",
        // Archives
        "application/zip",
    };

    // F-09: 25 MB hard cap per upload.
    private const long MaxUploadSizeBytes = 25L * 1024 * 1024;
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/files")
            .WithTags("Files")
            .RequireAuthorization();

        group.MapPost("/upload/presign", PresignUpload).WithName("PresignUpload").RequireAuthorization(WorkspaceRoles.Member);
        group.MapPost("/upload/{fileId:guid}/confirm", ConfirmUpload).WithName("ConfirmUpload").RequireAuthorization(WorkspaceRoles.Member);
        group.MapGet("/{id:guid}/url", GetDownloadUrl).WithName("GetFileDownloadUrl").RequireAuthorization(WorkspaceRoles.Guest);
        group.MapDelete("/{id:guid}", DeleteFile).WithName("DeleteFile").RequireAuthorization(WorkspaceRoles.Member);
    }

    // ── POST /api/v1/files/upload/presign ──
    private static async Task<IResult> PresignUpload(
        PresignUploadRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        IStorageService storage,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        if (string.IsNullOrWhiteSpace(request.FileName))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["fileName"] = ["File name is required."]
            });
        }

        if (string.IsNullOrWhiteSpace(request.ContentType))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["contentType"] = ["Content type is required."]
            });
        }

        if (request.SizeBytes <= 0)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["sizeBytes"] = ["File size must be greater than zero."]
            });
        }

        // F-09: enforce upload size cap.
        if (request.SizeBytes > MaxUploadSizeBytes)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["sizeBytes"] = [$"File size exceeds the {MaxUploadSizeBytes / (1024 * 1024)} MB limit."]
            });
        }

        // F-09: enforce MIME allowlist. The presigned URL still relies on the client
        // to send the matching Content-Type header; backend validation here is the
        // only line of defense before MinIO accepts the PUT.
        if (!AllowedContentTypes.Contains(request.ContentType))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["contentType"] = [$"Content type '{request.ContentType}' is not allowed."]
            });
        }

        // F-09: strip path separators from the user-supplied file name to keep the
        // storage key well-formed and avoid surprising bucket layouts.
        var safeFileName = Path.GetFileName(request.FileName)
            .Replace("\\", string.Empty, StringComparison.Ordinal)
            .Replace("/", string.Empty, StringComparison.Ordinal);
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["fileName"] = ["File name is invalid."]
            });
        }

        // Generate a unique storage key
        var storageKey = $"uploads/{Guid.NewGuid():N}/{safeFileName}";

        var file = new FileAttachment
        {
            FileName = safeFileName,
            StorageKey = storageKey,
            ContentType = request.ContentType,
            SizeBytes = request.SizeBytes,
            UploadedBy = userId,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.FileAttachments.Add(file);
        await db.SaveChangesAsync(ct);

        // Generate a pre-signed PUT URL valid for 15 minutes
        var uploadUrl = await storage.GetPresignedUploadUrlAsync(storageKey, TimeSpan.FromMinutes(15), ct);

        var response = new PresignUploadResponse(
            file.Id,
            uploadUrl,
            storageKey,
            "linear-precision");

        return Results.Ok(response);
    }

    // ── POST /api/v1/files/upload/{fileId}/confirm ──
    private static async Task<IResult> ConfirmUpload(
        Guid fileId,
        AppDbContext db,
        CancellationToken ct)
    {
        var file = await db.FileAttachments
            .FirstOrDefaultAsync(f => f.Id == fileId, ct);

        if (file is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"File with id '{fileId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var response = new FileConfirmResponse(
            file.Id,
            file.FileName,
            file.ContentType,
            file.SizeBytes,
            file.StorageKey,
            file.ThumbnailKey,
            file.UploadedBy,
            file.CreatedAt);

        return Results.Ok(response);
    }

    // ── GET /api/v1/files/{id}/url ──
    private static async Task<IResult> GetDownloadUrl(
        Guid id,
        AppDbContext db,
        IStorageService storage,
        CancellationToken ct)
    {
        var file = await db.FileAttachments.AsNoTracking()
            .Where(f => f.Id == id)
            .Select(f => new { f.StorageKey, f.FileName, f.ContentType, f.SizeBytes })
            .FirstOrDefaultAsync(ct);

        if (file is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"File with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Generate a pre-signed GET URL valid for 1 hour
        var downloadUrl = await storage.GetPresignedUrlAsync(file.StorageKey, TimeSpan.FromHours(1), ct);

        return Results.Ok(new FileDownloadUrlResponse(downloadUrl, file.FileName, file.ContentType, file.SizeBytes));
    }

    // ── DELETE /api/v1/files/{id} ──
    private static async Task<IResult> DeleteFile(
        Guid id,
        AppDbContext db,
        IStorageService storage,
        CancellationToken ct)
    {
        var file = await db.FileAttachments
            .FirstOrDefaultAsync(f => f.Id == id, ct);

        if (file is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"File with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Delete from object storage then from DB
        await storage.DeleteAsync(file.StorageKey, ct);

        db.FileAttachments.Remove(file);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }
}
