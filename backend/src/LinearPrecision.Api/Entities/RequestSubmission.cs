using System.Text.Json;
using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class RequestSubmission : TenantEntity
{
    public Guid RequestFormId { get; set; }
    public RequestForm RequestForm { get; set; } = null!;
    public JsonDocument Data { get; set; } = null!;
    public SubmissionStatus Status { get; set; }
    public string? SubmitterEmail { get; set; }
    public Guid? SubmitterUserId { get; set; }
    public User? SubmitterUser { get; set; }
    public Guid? ConvertedToTaskId { get; set; }
    public TaskItem? ConvertedToTask { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
}
