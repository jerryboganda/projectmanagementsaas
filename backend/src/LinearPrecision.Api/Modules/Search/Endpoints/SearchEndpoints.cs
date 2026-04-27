using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Search.Models;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Search.Endpoints;

public static class SearchEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/search")
            .WithTags("Search")
            .RequireAuthorization();

        group.MapGet("/", Search).WithName("Search").RequireAuthorization(WorkspaceRoles.Guest);
    }

    // ── GET /api/v1/search ──
    private static async Task<IResult> Search(
        AppDbContext db,
        CancellationToken ct,
        string? q = null,
        string? type = null,
        Guid? projectId = null,
        int pageSize = 25)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["q"] = ["The 'q' query parameter is required."]
            });
        }

        var searchTerm = q.Trim();
        var likePattern = BuildContainsLikePattern(searchTerm);
        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var results = new List<SearchResultItem>();

        // Parse requested entity types (csv: task,project,document,goal)
        var requestedTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(type))
        {
            foreach (var t in type.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                requestedTypes.Add(t);
        }

        var searchAll = requestedTypes.Count == 0;

        // ── Search Tasks ──
        if (searchAll || requestedTypes.Contains("task"))
        {
            var taskQuery = db.TaskItems.AsNoTracking()
                .Where(t => EF.Functions.ILike(t.Title, likePattern, "\\"));

            if (projectId.HasValue)
                taskQuery = taskQuery.Where(t => t.ProjectId == projectId.Value);

            var raw = await taskQuery
                .OrderByDescending(t => t.UpdatedAt)
                .Take(effectivePageSize)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    Excerpt = t.Description != null
                        ? t.Description.Substring(0, Math.Min(t.Description.Length, 200))
                        : (string?)null
                })
                .ToListAsync(ct);

            results.AddRange(raw.Select(t =>
                new SearchResultItem("task", t.Id, t.Title, t.Excerpt, ComputeRank(t.Title, searchTerm))));
        }

        // ── Search Projects ──
        if (searchAll || requestedTypes.Contains("project"))
        {
            var raw = await db.Projects.AsNoTracking()
                .Where(p => EF.Functions.ILike(p.Name, likePattern, "\\"))
                .OrderByDescending(p => p.UpdatedAt)
                .Take(effectivePageSize)
                .Select(p => new
                {
                    p.Id,
                    Title = p.Name,
                    Excerpt = p.Description != null
                        ? p.Description.Substring(0, Math.Min(p.Description.Length, 200))
                        : (string?)null
                })
                .ToListAsync(ct);

            results.AddRange(raw.Select(p =>
                new SearchResultItem("project", p.Id, p.Title, p.Excerpt, ComputeRank(p.Title, searchTerm))));
        }

        // ── Search Documents ──
        if (searchAll || requestedTypes.Contains("document"))
        {
            var docQuery = db.Documents.AsNoTracking()
                .Where(d => EF.Functions.ILike(d.Title, likePattern, "\\"));

            if (projectId.HasValue)
                docQuery = docQuery.Where(d => d.ProjectId == projectId.Value);

            var raw = await docQuery
                .OrderByDescending(d => d.UpdatedAt)
                .Take(effectivePageSize)
                .Select(d => new { d.Id, d.Title })
                .ToListAsync(ct);

            results.AddRange(raw.Select(d =>
                new SearchResultItem("document", d.Id, d.Title, null, ComputeRank(d.Title, searchTerm))));
        }

        // ── Search Goals ──
        if (searchAll || requestedTypes.Contains("goal"))
        {
            var raw = await db.Goals.AsNoTracking()
                .Where(g => EF.Functions.ILike(g.Title, likePattern, "\\"))
                .OrderByDescending(g => g.UpdatedAt)
                .Take(effectivePageSize)
                .Select(g => new
                {
                    g.Id,
                    g.Title,
                    Excerpt = g.Description != null
                        ? g.Description.Substring(0, Math.Min(g.Description.Length, 200))
                        : (string?)null
                })
                .ToListAsync(ct);

            results.AddRange(raw.Select(g =>
                new SearchResultItem("goal", g.Id, g.Title, g.Excerpt, ComputeRank(g.Title, searchTerm))));
        }

        // Sort by relevance rank desc, then trim to pageSize
        var trimmedResults = results
            .OrderByDescending(r => r.Rank)
            .Take(effectivePageSize)
            .ToList();

        var response = new SearchResponse(trimmedResults, trimmedResults.Count);
        return Results.Ok(response);
    }

    private static string BuildContainsLikePattern(string searchTerm)
    {
        var escaped = searchTerm
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("%", "\\%", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal);

        return $"%{escaped}%";
    }

    /// <summary>
    /// Basic relevance scoring:
    ///   1.0 — exact case-insensitive match
    ///   0.85 — title starts with query
    ///   0.6  — title contains query (anywhere)
    /// </summary>
    private static double ComputeRank(string title, string searchTerm)
    {
        if (string.Equals(title, searchTerm, StringComparison.OrdinalIgnoreCase))
            return 1.0;
        if (title.StartsWith(searchTerm, StringComparison.OrdinalIgnoreCase))
            return 0.85;
        return 0.6;
    }
}
