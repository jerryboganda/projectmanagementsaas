using System.Text.RegularExpressions;

namespace LinearPrecision.Shared.Extensions;

public static partial class StringExtensions
{
    /// <summary>
    /// Converts a string to a URL-safe slug (lowercase, alphanumeric + hyphens).
    /// </summary>
    public static string ToSlug(this string text)
    {
        var slug = text.ToLowerInvariant().Trim();
        slug = SlugInvalidChars().Replace(slug, "");
        slug = SlugWhitespace().Replace(slug, "-");
        slug = SlugMultipleHyphens().Replace(slug, "-");
        return slug.Trim('-');
    }

    /// <summary>
    /// Truncates a string to the specified max length, appending "..." if truncated.
    /// </summary>
    public static string Truncate(this string text, int maxLength)
        => text.Length <= maxLength ? text : string.Concat(text.AsSpan(0, maxLength - 3), "...");

    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex SlugInvalidChars();

    [GeneratedRegex(@"\s+")]
    private static partial Regex SlugWhitespace();

    [GeneratedRegex(@"-{2,}")]
    private static partial Regex SlugMultipleHyphens();
}
