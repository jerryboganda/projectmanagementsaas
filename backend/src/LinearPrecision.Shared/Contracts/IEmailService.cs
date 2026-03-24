namespace LinearPrecision.Shared.Contracts;

/// <summary>
/// Abstraction for sending transactional emails.
/// </summary>
public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
    Task SendTemplatedAsync(string to, string templateName, object model, CancellationToken ct = default);
}
