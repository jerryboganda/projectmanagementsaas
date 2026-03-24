namespace LinearPrecision.Shared.Domain;

/// <summary>
/// Pagination wrapper for cursor-based or offset-based paginated responses.
/// </summary>
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public bool HasNextPage => Page * PageSize < TotalCount;
    public bool HasPreviousPage => Page > 1;
    public string? NextCursor { get; init; }
}
