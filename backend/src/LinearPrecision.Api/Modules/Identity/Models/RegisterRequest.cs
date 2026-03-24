namespace LinearPrecision.Api.Modules.Identity.Models;

public sealed record RegisterRequest(
    string Email,
    string Password,
    string FullName);
