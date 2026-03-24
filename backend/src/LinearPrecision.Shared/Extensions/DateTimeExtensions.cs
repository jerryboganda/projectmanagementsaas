namespace LinearPrecision.Shared.Extensions;

public static class DateTimeExtensions
{
    /// <summary>
    /// Returns the start of the day (00:00:00) for the given date.
    /// </summary>
    public static DateTime StartOfDay(this DateTime dt)
        => new(dt.Year, dt.Month, dt.Day, 0, 0, 0, dt.Kind);

    /// <summary>
    /// Returns the end of the day (23:59:59.999) for the given date.
    /// </summary>
    public static DateTime EndOfDay(this DateTime dt)
        => new(dt.Year, dt.Month, dt.Day, 23, 59, 59, 999, dt.Kind);

    /// <summary>
    /// Returns the first day of the month containing the given date.
    /// </summary>
    public static DateTime StartOfMonth(this DateTime dt)
        => new(dt.Year, dt.Month, 1, 0, 0, 0, dt.Kind);

    /// <summary>
    /// Returns the period string for monthly aggregation (e.g., "2025-01").
    /// </summary>
    public static string ToPeriodString(this DateTime dt)
        => dt.ToString("yyyy-MM");
}
