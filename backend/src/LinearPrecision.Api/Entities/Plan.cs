using System.Text.Json;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class Plan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal MonthlyPricePerSeat { get; set; }
    public decimal AnnualPricePerSeat { get; set; }
    public string? StripePriceIdMonthly { get; set; }
    public string? StripePriceIdAnnual { get; set; }
    public int MaxMembers { get; set; }
    public int MaxProjects { get; set; }
    public long MaxStorageBytes { get; set; }
    public int MaxAutomations { get; set; }
    public JsonDocument Features { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
