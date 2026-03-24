namespace LinearPrecision.Shared.Domain;

/// <summary>
/// Soft-deletable marker — entities implementing this will have Delete redirected to soft-delete.
/// </summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
    Guid? DeletedBy { get; set; }
}
