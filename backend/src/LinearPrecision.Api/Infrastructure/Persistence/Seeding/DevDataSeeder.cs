using System.Text.Json;
using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Infrastructure.Persistence.Seeding;

/// <summary>
/// Seeds development data for local testing. Only runs in Development environment.
/// </summary>
public static class DevDataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (await context.Users.AnyAsync())
            return;

        var hasher = new PasswordHasher<User>();

        // --- Users ---
        var adminUser = new User
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Email = "admin@linearprecision.dev",
            NormalizedEmail = "ADMIN@LINEARPRECISION.DEV",
            UserName = "admin",
            NormalizedUserName = "ADMIN",
            FullName = "Admin User",
            DisplayName = "Admin",
            EmailConfirmed = true,
            IsActive = true,
            Timezone = "UTC",
            Locale = "en-US",
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin1234");

        var memberUser = new User
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
            Email = "member@linearprecision.dev",
            NormalizedEmail = "MEMBER@LINEARPRECISION.DEV",
            UserName = "member",
            NormalizedUserName = "MEMBER",
            FullName = "Member User",
            DisplayName = "Member",
            EmailConfirmed = true,
            IsActive = true,
            Timezone = "UTC",
            Locale = "en-US",
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        memberUser.PasswordHash = hasher.HashPassword(memberUser, "Member1234");

        context.Users.AddRange(adminUser, memberUser);
        await context.SaveChangesAsync();

        // --- Workspace ---
        var workspace = new Workspace
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000001"),
            Name = "Dev Workspace",
            Slug = "dev-workspace",
            Description = "Development testing workspace",
            Settings = JsonDocument.Parse("""{"theme":"default","defaultView":"board"}"""),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Workspaces.Add(workspace);
        await context.SaveChangesAsync();

        // --- Memberships ---
        var ownerMembership = new Membership
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspace.Id,
            UserId = adminUser.Id,
            Role = MembershipRole.Owner,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var memberMembership = new Membership
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspace.Id,
            UserId = memberUser.Id,
            Role = MembershipRole.Member,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Memberships.AddRange(ownerMembership, memberMembership);
        await context.SaveChangesAsync();

        // --- Subscription (link workspace to Free plan) ---
        var freePlan = await context.Plans.FirstOrDefaultAsync(p => p.Slug == "free");
        if (freePlan is not null)
        {
            var subscription = new Subscription
            {
                Id = Guid.NewGuid(),
                WorkspaceId = workspace.Id,
                PlanId = freePlan.Id,
                Status = SubscriptionStatus.Active,
                CurrentPeriodStart = DateTime.UtcNow,
                CurrentPeriodEnd = DateTime.UtcNow.AddYears(100),
                SeatCount = 2,
                SeatLimit = freePlan.MaxMembers,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Subscriptions.Add(subscription);
            await context.SaveChangesAsync();
        }

        // --- Projects ---
        var project = new Project
        {
            Id = Guid.Parse("30000000-0000-0000-0000-000000000001"),
            WorkspaceId = workspace.Id,
            Name = "Onboarding",
            Description = "Sample project for dev testing",
            Identifier = "ONB",
            Status = ProjectStatus.Active,
            Visibility = ProjectVisibility.Workspace,
            LeadId = adminUser.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Projects.Add(project);
        await context.SaveChangesAsync();

        // --- Sample Tasks ---
        var tasks = new List<TaskItem>
        {
            new()
            {
                Id = Guid.NewGuid(),
                WorkspaceId = workspace.Id,
                ProjectId = project.Id,
                Title = "Set up development environment",
                Description = "Install all required tools and dependencies",
                Identifier = "ONB-1",
                Status = TaskItemStatus.Done,
                Priority = TaskPriority.High,
                AssigneeId = adminUser.Id,
                CreatorId = adminUser.Id,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                WorkspaceId = workspace.Id,
                ProjectId = project.Id,
                Title = "Review project architecture",
                Description = "Go through the architecture docs and understand the system design",
                Identifier = "ONB-2",
                Status = TaskItemStatus.InProgress,
                Priority = TaskPriority.Medium,
                AssigneeId = memberUser.Id,
                CreatorId = adminUser.Id,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                WorkspaceId = workspace.Id,
                ProjectId = project.Id,
                Title = "Write first integration test",
                Identifier = "ONB-3",
                Status = TaskItemStatus.Backlog,
                Priority = TaskPriority.Low,
                CreatorId = adminUser.Id,
                SortOrder = 3,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.TaskItems.AddRange(tasks);
        await context.SaveChangesAsync();

        // --- Sample Goal ---
        var goal = new Goal
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspace.Id,
            Title = "Complete onboarding for all team members",
            Status = GoalStatus.OnTrack,
            Type = GoalType.Objective,
            ProgressPercent = 33,
            ProgressSource = GoalProgressSource.Manual,
            OwnerId = adminUser.Id,
            TargetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1)),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Goals.Add(goal);
        await context.SaveChangesAsync();
    }
}
