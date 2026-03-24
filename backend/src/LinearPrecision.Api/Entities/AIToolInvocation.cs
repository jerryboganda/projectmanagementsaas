using System.Text.Json;
using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class AIToolInvocation : TenantEntity
{
    public Guid MessageId { get; set; }
    public AIMessage Message { get; set; } = null!;
    public string ToolName { get; set; } = string.Empty;
    public JsonDocument Input { get; set; } = null!;
    public JsonDocument? Output { get; set; }
    public AIToolInvocationStatus Status { get; set; }
    public TimeSpan? Duration { get; set; }
}
