using System.Text.Json;
using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Infrastructure.Persistence.Seeding;

public static class PlanSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (await context.Plans.AnyAsync())
            return;

        var plans = new List<Plan>
        {
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "Free",
                Slug = "free",
                Description = "For individuals and small teams getting started.",
                MonthlyPricePerSeat = 0m,
                AnnualPricePerSeat = 0m,
                MaxMembers = 5,
                MaxProjects = 3,
                MaxStorageBytes = 500L * 1024 * 1024, // 500 MB
                MaxAutomations = 5,
                Features = JsonDocument.Parse("""
                {
                    "basic_task_management": true,
                    "board_list_calendar_views": true,
                    "ai_copilot": false,
                    "advanced_reports": false,
                    "custom_fields": false,
                    "timeline_gantt": false,
                    "saml_sso": false,
                    "audit_log": false,
                    "api_access": false,
                    "priority_support": false,
                    "dedicated_support": false,
                    "custom_sla": false,
                    "data_residency": false,
                    "sso_enforcement": false
                }
                """),
                IsActive = true,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Name = "Pro",
                Slug = "pro",
                Description = "For growing teams that need more power and flexibility.",
                MonthlyPricePerSeat = 12m,
                AnnualPricePerSeat = 10m,
                MaxMembers = 50,
                MaxProjects = -1, // Unlimited
                MaxStorageBytes = 10L * 1024 * 1024 * 1024, // 10 GB
                MaxAutomations = 50,
                Features = JsonDocument.Parse("""
                {
                    "basic_task_management": true,
                    "board_list_calendar_views": true,
                    "ai_copilot": true,
                    "advanced_reports": true,
                    "custom_fields": true,
                    "timeline_gantt": true,
                    "saml_sso": false,
                    "audit_log": false,
                    "api_access": true,
                    "priority_support": false,
                    "dedicated_support": false,
                    "custom_sla": false,
                    "data_residency": false,
                    "sso_enforcement": false
                }
                """),
                IsActive = true,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Name = "Business",
                Slug = "business",
                Description = "For organizations that need advanced security and compliance.",
                MonthlyPricePerSeat = 24m,
                AnnualPricePerSeat = 20m,
                MaxMembers = -1, // Unlimited
                MaxProjects = -1,
                MaxStorageBytes = 100L * 1024 * 1024 * 1024, // 100 GB
                MaxAutomations = -1, // Unlimited
                Features = JsonDocument.Parse("""
                {
                    "basic_task_management": true,
                    "board_list_calendar_views": true,
                    "ai_copilot": true,
                    "advanced_reports": true,
                    "custom_fields": true,
                    "timeline_gantt": true,
                    "saml_sso": true,
                    "audit_log": true,
                    "api_access": true,
                    "priority_support": true,
                    "dedicated_support": false,
                    "custom_sla": false,
                    "data_residency": false,
                    "sso_enforcement": false
                }
                """),
                IsActive = true,
                SortOrder = 3,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                Name = "Enterprise",
                Slug = "enterprise",
                Description = "For large organizations with custom needs. Contact sales for pricing.",
                MonthlyPricePerSeat = 0m, // Custom pricing
                AnnualPricePerSeat = 0m,
                MaxMembers = -1,
                MaxProjects = -1,
                MaxStorageBytes = -1, // Unlimited
                MaxAutomations = -1,
                Features = JsonDocument.Parse("""
                {
                    "basic_task_management": true,
                    "board_list_calendar_views": true,
                    "ai_copilot": true,
                    "advanced_reports": true,
                    "custom_fields": true,
                    "timeline_gantt": true,
                    "saml_sso": true,
                    "audit_log": true,
                    "api_access": true,
                    "priority_support": true,
                    "dedicated_support": true,
                    "custom_sla": true,
                    "data_residency": true,
                    "sso_enforcement": true
                }
                """),
                IsActive = true,
                SortOrder = 4,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        await context.Plans.AddRangeAsync(plans);
        await context.SaveChangesAsync();
    }
}
