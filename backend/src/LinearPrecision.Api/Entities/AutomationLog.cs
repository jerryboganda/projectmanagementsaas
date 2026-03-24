using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class AutomationLog : TenantEntity
{
    public Guid AutomationRuleId { get; set; }
    public AutomationRule AutomationRule { get; set; } = null!;
    public AutomationLogStatus Status { get; set; }
    public string? TriggerData { get; set; }
    public string? ActionResult { get; set; }
    public string? ErrorMessage { get; set; }
    public TimeSpan ExecutionDuration { get; set; }
}
