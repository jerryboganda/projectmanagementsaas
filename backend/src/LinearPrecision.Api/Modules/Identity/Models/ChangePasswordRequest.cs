namespace LinearPrecision.Api.Modules.Identity.Models;

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword);
