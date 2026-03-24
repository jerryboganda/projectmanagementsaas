using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class TaskDependency : TenantEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;
    public Guid DependsOnTaskId { get; set; }
    public TaskItem DependsOnTask { get; set; } = null!;
    public DependencyType Type { get; set; }
}
