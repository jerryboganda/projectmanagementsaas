using System.Text.Json;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class RequestForm : TenantEntity, IAuditable
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsPublic { get; set; }
    public JsonDocument FormSchema { get; set; } = null!;
    public Guid? DefaultProjectId { get; set; }
    public Project? DefaultProject { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<RequestSubmission> Submissions { get; set; } = [];
}
