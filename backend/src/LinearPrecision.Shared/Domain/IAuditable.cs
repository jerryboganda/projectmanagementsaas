namespace LinearPrecision.Shared.Domain;

/// <summary>
/// Audit trail marker — CreatedBy/UpdatedBy populated by SaveChanges interceptor.
/// </summary>
public interface IAuditable
{
    Guid? CreatedBy { get; set; }
    Guid? UpdatedBy { get; set; }
}
