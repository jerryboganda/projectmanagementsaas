using System.Text.Json;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class FeatureFlag : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsEnabled { get; set; }
    public Guid? WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }
    public int? RolloutPercentage { get; set; }
    public JsonDocument? Conditions { get; set; }
}
