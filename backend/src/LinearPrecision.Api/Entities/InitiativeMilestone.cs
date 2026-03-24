using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class InitiativeMilestone : TenantEntity
{
    public Guid InitiativeId { get; set; }
    public Initiative Initiative { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public DateOnly? TargetDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int SortOrder { get; set; }
}
