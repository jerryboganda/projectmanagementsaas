using System.Text.Json;
using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class Project : TenantEntity, ISoftDeletable, IAuditable
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Identifier { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? IconUrl { get; set; }
    public ProjectStatus Status { get; set; }
    public ProjectVisibility Visibility { get; set; }
    public Guid? LeadId { get; set; }
    public User? Lead { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? TargetDate { get; set; }
    public int SortOrder { get; set; }
    public JsonDocument? Metadata { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<TaskItem> Tasks { get; set; } = [];
    public ICollection<Sprint> Sprints { get; set; } = [];
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<ProjectFavorite> Favorites { get; set; } = [];
    public ICollection<GoalProjectLink> GoalLinks { get; set; } = [];
}
