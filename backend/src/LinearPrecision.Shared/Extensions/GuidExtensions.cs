namespace LinearPrecision.Shared.Extensions;

/// <summary>
/// UUID v7 generation — time-ordered UUIDs for better database index performance.
/// </summary>
public static class GuidExtensions
{
    /// <summary>
    /// Creates a new UUID v7 (time-ordered) using the current UTC timestamp.
    /// </summary>
    public static Guid NewSequentialGuid()
    {
        // .NET 9 has Guid.CreateVersion7() built-in
        return Guid.CreateVersion7();
    }
}
