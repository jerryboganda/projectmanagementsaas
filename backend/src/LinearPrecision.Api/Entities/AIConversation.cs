using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class AIConversation : TenantEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string? Title { get; set; }
    public string Model { get; set; } = string.Empty;
    public int MessageCount { get; set; }
    public int TotalTokensUsed { get; set; }

    // Navigation properties
    public ICollection<AIMessage> Messages { get; set; } = [];
}
