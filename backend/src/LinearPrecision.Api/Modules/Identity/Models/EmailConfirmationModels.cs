namespace LinearPrecision.Api.Modules.Identity.Models;

public sealed record RegistrationPendingResponse(
    string Email,
    bool RequiresEmailConfirmation,
    string Message);

public sealed record ConfirmEmailRequest(
    string Email,
    string Token);

public sealed record ResendConfirmationRequest(
    string Email);
