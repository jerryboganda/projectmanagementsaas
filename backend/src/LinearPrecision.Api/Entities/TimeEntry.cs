using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class TimeEntry : TenantEntity, IAuditable
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? TaskId { get; set; }
    public TaskItem? Task { get; set; }
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsBillable { get; set; }
    public decimal? HourlyRate { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
