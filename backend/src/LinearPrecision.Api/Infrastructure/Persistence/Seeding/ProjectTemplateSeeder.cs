using System.Text.Json;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Modules.Projects.Models;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Infrastructure.Persistence.Seeding;

public static class ProjectTemplateSeeder
{
    public static async Task SeedAllAsync(AppDbContext context, CancellationToken ct = default)
    {
        var workspaceIds = await context.Workspaces
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(workspace => !workspace.IsDeleted)
            .Select(workspace => workspace.Id)
            .ToListAsync(ct);

        foreach (var workspaceId in workspaceIds)
        {
            await SeedWorkspaceAsync(context, workspaceId, ct);
        }
    }

    public static async Task SeedWorkspaceAsync(AppDbContext context, Guid workspaceId, CancellationToken ct = default)
    {
        var hasSystemTemplates = await context.ProjectTemplates
            .IgnoreQueryFilters()
            .AnyAsync(template => template.WorkspaceId == workspaceId && template.IsSystemTemplate, ct);

        if (hasSystemTemplates)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var seeds = GetDefaultTemplates();

        var templates = seeds.Select(seed => new ProjectTemplate
        {
            WorkspaceId = workspaceId,
            Name = seed.Name,
            Description = seed.Description,
            IconUrl = seed.IconUrl,
            TemplateData = JsonSerializer.SerializeToDocument(new ProjectTemplatePayload(
                seed.Category,
                seed.TaskTemplates)),
            IsSystemTemplate = true,
            CreatedAt = now,
            UpdatedAt = now
        });

        await context.ProjectTemplates.AddRangeAsync(templates, ct);
        await context.SaveChangesAsync(ct);
    }

    private static IReadOnlyList<ProjectTemplateSeed> GetDefaultTemplates() =>
    [
        new(
            "Software Development Sprint",
            "Standard 2-week sprint structure with planning, execution, and retro.",
            "Engineering",
            null,
            [
                new ProjectTemplateTaskResponse(
                    "Sprint Planning",
                    "Plan the sprint backlog and assign story points",
                    "To Do",
                    "High",
                    ["Review backlog", "Estimate stories", "Assign tasks"],
                    ["Planning"]),
                new ProjectTemplateTaskResponse(
                    "Daily Standup Notes",
                    "Document daily standup outcomes",
                    "To Do",
                    "Low",
                    [],
                    ["Meetings"]),
                new ProjectTemplateTaskResponse(
                    "Sprint Review / Demo",
                    "Demonstrate completed work to stakeholders",
                    "To Do",
                    "Medium",
                    ["Prepare demo", "Send invites", "Record demo"],
                    ["Review"]),
                new ProjectTemplateTaskResponse(
                    "Sprint Retrospective",
                    "Reflect on what went well and areas to improve",
                    "To Do",
                    "Medium",
                    ["Collect feedback", "Identify action items"],
                    ["Retro"])
            ]),
        new(
            "Marketing Campaign",
            "End-to-end marketing campaign from planning to launch and analysis.",
            "Marketing",
            null,
            [
                new ProjectTemplateTaskResponse(
                    "Campaign Strategy & Brief",
                    "Define campaign goals, target audience, and key messages",
                    "To Do",
                    "High",
                    ["Define goals", "Identify audience", "Create brief"],
                    ["Strategy"]),
                new ProjectTemplateTaskResponse(
                    "Content Creation",
                    "Create campaign assets: copy, visuals, videos",
                    "To Do",
                    "High",
                    ["Write copy", "Design visuals", "Produce video"],
                    ["Content"]),
                new ProjectTemplateTaskResponse(
                    "Channel Setup",
                    "Configure distribution channels",
                    "To Do",
                    "Medium",
                    ["Email setup", "Social media", "Paid ads"],
                    ["Distribution"]),
                new ProjectTemplateTaskResponse(
                    "Launch & Monitor",
                    "Execute the campaign and track performance",
                    "To Do",
                    "Urgent",
                    ["Launch campaign", "Monitor metrics", "A/B test"],
                    ["Launch"])
            ]),
        new(
            "Product Launch",
            "Cross-functional product launch checklist.",
            "Product",
            null,
            [
                new ProjectTemplateTaskResponse(
                    "Launch Readiness Review",
                    "Verify all teams are ready for launch",
                    "To Do",
                    "Urgent",
                    ["Engineering sign-off", "QA sign-off", "Marketing ready", "Support trained"],
                    ["Launch"]),
                new ProjectTemplateTaskResponse(
                    "Beta Testing",
                    "Run beta program with select customers",
                    "To Do",
                    "High",
                    ["Select beta users", "Collect feedback", "Fix critical bugs"],
                    ["Beta"]),
                new ProjectTemplateTaskResponse(
                    "Go-to-Market",
                    "Execute GTM plan",
                    "To Do",
                    "High",
                    ["Press release", "Blog post", "Social media", "Email campaign"],
                    ["GTM"])
            ]),
        new(
            "Client Onboarding",
            "Onboard new clients with a structured process.",
            "Operations",
            null,
            [
                new ProjectTemplateTaskResponse(
                    "Kickoff Meeting",
                    "Initial meeting to align on goals and timeline",
                    "To Do",
                    "High",
                    ["Schedule meeting", "Prepare agenda", "Send follow-up"],
                    ["Meetings"]),
                new ProjectTemplateTaskResponse(
                    "Account Setup",
                    "Configure client workspace and permissions",
                    "To Do",
                    "High",
                    ["Create workspace", "Set permissions", "Import data"],
                    ["Setup"]),
                new ProjectTemplateTaskResponse(
                    "Training Sessions",
                    "Train client team on the platform",
                    "To Do",
                    "Medium",
                    ["Schedule sessions", "Prepare materials", "Record sessions"],
                    ["Training"])
            ])
    ];

    private sealed record ProjectTemplateSeed(
        string Name,
        string Description,
        string Category,
        string? IconUrl,
        IReadOnlyList<ProjectTemplateTaskResponse> TaskTemplates);
}
