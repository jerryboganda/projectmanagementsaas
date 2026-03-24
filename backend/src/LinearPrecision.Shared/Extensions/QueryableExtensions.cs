using System.Linq.Expressions;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Shared.Extensions;

public static class QueryableExtensions
{
    /// <summary>
    /// Applies offset-based pagination.
    /// </summary>
    public static IQueryable<T> Paginate<T>(this IQueryable<T> query, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;
        return query.Skip((page - 1) * pageSize).Take(pageSize);
    }

    /// <summary>
    /// Conditionally applies a Where filter.
    /// </summary>
    public static IQueryable<T> WhereIf<T>(this IQueryable<T> query, bool condition, Expression<Func<T, bool>> predicate)
        => condition ? query.Where(predicate) : query;

    /// <summary>
    /// Applies an OrderBy with direction.
    /// </summary>
    public static IOrderedQueryable<T> OrderByDirection<T, TKey>(
        this IQueryable<T> query,
        Expression<Func<T, TKey>> keySelector,
        bool descending = false)
        => descending ? query.OrderByDescending(keySelector) : query.OrderBy(keySelector);
}
