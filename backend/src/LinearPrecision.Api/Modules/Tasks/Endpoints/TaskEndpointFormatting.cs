namespace LinearPrecision.Api.Modules.Tasks.Endpoints;

internal static class TaskEndpointFormatting
{
    public static string DisplayName(string? displayName, string fullName)
    {
        return string.IsNullOrWhiteSpace(displayName) ? fullName : displayName;
    }

    public static string Initials(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return "??";
        }

        var parts = fullName
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(part => part.Length > 0)
            .ToArray();

        if (parts.Length == 0)
        {
            return "??";
        }

        if (parts.Length == 1)
        {
            return parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant();
        }

        return string.Concat(parts[0][0], parts[^1][0]).ToUpperInvariant();
    }
}
