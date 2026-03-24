namespace LinearPrecision.Api.Modules.Identity.Models;

public sealed record UpdateProfileRequest(
    string? FullName,
    string? DisplayName,
    string? AvatarUrl,
    string? Timezone,
    string? Locale,
    string? JobTitle);
