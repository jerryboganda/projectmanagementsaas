namespace LinearPrecision.Api.Modules.Identity.Models;

public sealed record LoginRequest(
    string Email,
    string Password);
