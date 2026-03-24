using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class AIMessage : TenantEntity
{
    public Guid ConversationId { get; set; }
    public AIConversation Conversation { get; set; } = null!;
    public AIMessageRole Role { get; set; }
    public string Content { get; set; } = string.Empty;
    public int? TokensUsed { get; set; }

    // Navigation properties
    public ICollection<AIToolInvocation> ToolInvocations { get; set; } = [];
}
