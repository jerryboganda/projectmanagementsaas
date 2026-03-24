using System.Text.Json;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class ProjectTemplate : TenantEntity, IAuditable
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public JsonDocument TemplateData { get; set; } = null!;
    public bool IsSystemTemplate { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
