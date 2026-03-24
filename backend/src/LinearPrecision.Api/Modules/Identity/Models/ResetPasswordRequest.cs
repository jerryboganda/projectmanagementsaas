namespace LinearPrecision.Api.Modules.Identity.Models;

public sealed record ResetPasswordRequest(
    string Email,
    string Token,
    string NewPassword);
