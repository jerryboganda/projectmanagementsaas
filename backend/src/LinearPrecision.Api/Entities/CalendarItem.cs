using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class CalendarItem : TenantEntity, IAuditable
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CalendarItemType Type { get; set; }
    public string? Color { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsAllDay { get; set; }
    public string? RecurrenceRule { get; set; }
    public Guid? LinkedTaskId { get; set; }
    public Guid? LinkedProjectId { get; set; }
    public Guid CreatorId { get; set; }
    public User Creator { get; set; } = null!;

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
