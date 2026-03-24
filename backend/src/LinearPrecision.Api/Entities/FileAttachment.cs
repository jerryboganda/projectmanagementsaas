using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class FileAttachment : TenantEntity, IAuditable
{
    public string FileName { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string? ThumbnailKey { get; set; }
    public Guid UploadedBy { get; set; }
    public User Uploader { get; set; } = null!;

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
