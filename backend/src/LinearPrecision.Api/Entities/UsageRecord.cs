using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class UsageRecord : TenantEntity
{
    public string MetricName { get; set; } = string.Empty;
    public long Value { get; set; }
    public DateTime RecordedAt { get; set; }
    public string Period { get; set; } = string.Empty;
}
