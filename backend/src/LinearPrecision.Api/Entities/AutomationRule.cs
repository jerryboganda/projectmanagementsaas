using System.Text.Json;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class AutomationRule : TenantEntity, IAuditable
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public JsonDocument Trigger { get; set; } = null!;
    public JsonDocument Action { get; set; } = null!;
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
    public int ExecutionCount { get; set; }
    public DateTime? LastExecutedAt { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
