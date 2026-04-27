using LinearPrecision.Shared.Contracts;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace LinearPrecision.Api.Infrastructure.Email;

/// <summary>
/// SMTP-based email implementation using MailKit.
/// Requires an "Email" config section with Smtp sub-section.
/// </summary>
public sealed class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    private static readonly System.Text.Json.JsonSerializerOptions IndentedJsonOptions = new()
    {
        WriteIndented = true,
    };

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var host = _configuration["Email:Smtp:Host"] ?? "localhost";
        var port = int.TryParse(_configuration["Email:Smtp:Port"], out var p) ? p : 587;
        var username = _configuration["Email:Smtp:Username"];
        var password = _configuration["Email:Smtp:Password"];
        var fromAddress = _configuration["Email:FromAddress"] ?? "noreply@linearprecision.com";
        var fromName = _configuration["Email:FromName"] ?? "Linear Precision";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromAddress));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTlsWhenAvailable, ct);

            if (!string.IsNullOrEmpty(username))
                await client.AuthenticateAsync(username, password ?? string.Empty, ct);

            await client.SendAsync(message, ct);
            await client.DisconnectAsync(quit: true, ct);

            _logger.LogDebug("Email sent to {To} with subject '{Subject}'", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To} with subject '{Subject}'", to, subject);
            throw;
        }
    }

    public async Task SendTemplatedAsync(string to, string templateName, object model, CancellationToken ct = default)
    {
        // Minimal template engine: map template name to a subject, render model as indented JSON.
        // Replace with Razor, Scriban, or Fluid for production-grade HTML templates.
        var subject = templateName switch
        {
            "notification-digest" => "Your Daily Notification Digest — Linear Precision",
            "email-confirmation" => "Confirm your Linear Precision email address",
            "workspace-invitation" => "You've been invited to a workspace on Linear Precision",
            "password-reset" => "Reset your Linear Precision password",
            "welcome" => "Welcome to Linear Precision",
            _ => templateName
        };

        var json = System.Text.Json.JsonSerializer.Serialize(model, IndentedJsonOptions);

        var htmlBody = $"""
            <html><body style="font-family:sans-serif;color:#111">
            <h2>{System.Net.WebUtility.HtmlEncode(subject)}</h2>
            <pre style="background:#f5f5f5;padding:12px;border-radius:4px">{System.Net.WebUtility.HtmlEncode(json)}</pre>
            <p style="font-size:12px;color:#888">Linear Precision &mdash; Project Management</p>
            </body></html>
            """;

        await SendAsync(to, subject, htmlBody, ct);
    }
}
