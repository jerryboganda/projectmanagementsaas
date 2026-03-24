using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class TaskAttachment : TenantEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;
    public Guid FileAttachmentId { get; set; }
    public FileAttachment FileAttachment { get; set; } = null!;
    public Guid UploadedBy { get; set; }
    public User Uploader { get; set; } = null!;
}
