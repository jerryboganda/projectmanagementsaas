namespace LinearPrecision.Api.Modules.Search.Models;

public sealed record SearchResultItem(string EntityType, Guid EntityId, string Title, string? Snippet, double Rank);
public sealed record SearchResponse(List<SearchResultItem> Data, int TotalCount);
