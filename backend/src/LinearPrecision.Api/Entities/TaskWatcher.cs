using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class TaskWatcher : TenantEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
