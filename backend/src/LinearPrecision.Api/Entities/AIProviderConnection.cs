using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class AIProviderConnection : TenantEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string ProviderName { get; set; } = "OpenAI-Compatible";
    public string BaseUrl { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string ProtectedApiKey { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
}
