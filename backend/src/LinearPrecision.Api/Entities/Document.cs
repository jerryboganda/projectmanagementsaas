using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class Document : TenantEntity, ISoftDeletable, IAuditable
{
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string ContentFormat { get; set; } = "tiptap-json";
    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid? ParentDocumentId { get; set; }
    public Document? ParentDocument { get; set; }
    public Guid CreatorId { get; set; }
    public User Creator { get; set; } = null!;
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int SortOrder { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<Document> ChildDocuments { get; set; } = [];
}
