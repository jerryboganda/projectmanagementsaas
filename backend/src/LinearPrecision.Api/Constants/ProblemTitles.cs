namespace LinearPrecision.Api.Constants;

/// <summary>
/// Standard ProblemDetails titles used across endpoints to keep API error
/// responses consistent.
/// </summary>
public static class ProblemTitles
{
    public const string NotFound = "Not Found";
    public const string Conflict = "Conflict";
    public const string BadRequest = "Bad Request";
    public const string Forbidden = "Forbidden";
    public const string Unauthorized = "Unauthorized";
}
