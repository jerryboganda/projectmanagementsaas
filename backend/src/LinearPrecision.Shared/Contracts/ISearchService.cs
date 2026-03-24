namespace LinearPrecision.Shared.Contracts;

/// <summary>
/// Abstraction for full-text search indexing and querying.
/// </summary>
public interface ISearchService
{
    Task IndexAsync<T>(string indexName, string id, T document, CancellationToken ct = default) where T : class;
    Task RemoveAsync(string indexName, string id, CancellationToken ct = default);
    Task<SearchResults<T>> SearchAsync<T>(string indexName, string query, int skip = 0, int take = 20, CancellationToken ct = default) where T : class;
}

public class SearchResults<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
}
