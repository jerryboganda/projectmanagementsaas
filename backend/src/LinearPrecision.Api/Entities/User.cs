using Microsoft.AspNetCore.Identity;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class User : IdentityUser<Guid>, IAuditable
{
    public string FullName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Timezone { get; set; }
    public string? Locale { get; set; }
    public string? JobTitle { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? LastActiveWorkspaceId { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<Membership> Memberships { get; set; } = [];
    public ICollection<TaskComment> Comments { get; set; } = [];
    public ICollection<TimeEntry> TimeEntries { get; set; } = [];
}
