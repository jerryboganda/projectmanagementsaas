using System.Text.Json;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Projects.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Projects;

public static class ProjectTemplateService
{
    public static async Task<IReadOnlyList<ProjectTemplateResponse>> ListProjectTemplatesAsync(
        AppDbContext db,
        CancellationToken ct)
    {
        var templates = await db.ProjectTemplates
            .AsNoTracking()
            .ToListAsync(ct);

        return templates
            .Select(MapTemplate)
            .OrderBy(template => GetCategoryRank(template.Category))
            .ThenBy(template => template.Name)
            .ToList();
    }

    public static async Task<ProjectResponse> CreateProjectFromTemplateAsync(
        AppDbContext db,
        ICurrentUser currentUser,
        ProjectTemplate template,
        CreateFromTemplateRequest request,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var payload = DeserializePayload(template.TemplateData);
        var templateTasks = payload.TaskTemplates ?? [];
        Project project;

        var transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(ct)
            : null;

        try
        {
            project = new Project
            {
                Name = request.Name,
                Identifier = request.Identifier,
                Description = request.Description ?? template.Description,
                Color = null,
                IconUrl = template.IconUrl,
                Status = ProjectStatus.Active,
                Visibility = ProjectVisibility.Workspace,
                LeadId = request.LeadId,
                StartDate = request.StartDate,
                TargetDate = request.TargetDate,
                Metadata = JsonSerializer.SerializeToDocument(new
                {
                    templateId = template.Id,
                    templateName = template.Name,
                    templateCategory = payload.Category,
                    templateTaskCount = templateTasks.Count
                }),
                CreatedBy = userId,
                UpdatedBy = userId
            };

            db.Projects.Add(project);
            await db.SaveChangesAsync(ct);

            var nextTaskNumber = await db.TaskItems
                .IgnoreQueryFilters()
                .CountAsync(task => task.ProjectId == project.Id, ct) + 1;

            var templateTaskEntities = templateTasks
                .Select((taskTemplate, index) => new TaskItem
                {
                    Title = taskTemplate.Title,
                    Description = taskTemplate.Description,
                    Identifier = $"{project.Identifier}-{nextTaskNumber + index}",
                    Status = MapTaskStatus(taskTemplate.Status),
                    Priority = MapTaskPriority(taskTemplate.Priority),
                    TaskType = "task",
                    Labels = taskTemplate.Tags.ToList(),
                    ProjectId = project.Id,
                    SortOrder = index + 1,
                    CreatorId = userId,
                    CreatedBy = userId,
                    UpdatedBy = userId
                })
                .ToList();

            db.TaskItems.AddRange(templateTaskEntities);
            await db.SaveChangesAsync(ct);

            if (transaction is not null)
            {
                await transaction.CommitAsync(ct);
            }
        }
        finally
        {
            if (transaction is not null)
            {
                await transaction.DisposeAsync();
            }
        }

        var taskCount = await db.TaskItems
            .AsNoTracking()
            .CountAsync(task => task.ProjectId == project.Id && !task.IsDeleted, ct);

        var completedTaskCount = await db.TaskItems
            .AsNoTracking()
            .CountAsync(task => task.ProjectId == project.Id && !task.IsDeleted && task.Status == TaskItemStatus.Done, ct);

        return new ProjectResponse(
            project.Id,
            project.WorkspaceId,
            project.Name,
            project.Identifier,
            project.Description,
            project.Color,
            project.IconUrl,
            project.Status,
            project.Visibility,
            null,
            project.StartDate,
            project.TargetDate,
            project.SortOrder,
            taskCount,
            completedTaskCount,
            false,
            project.CreatedAt,
            project.UpdatedAt);
    }

    private static ProjectTemplateResponse MapTemplate(ProjectTemplate template)
    {
        var payload = DeserializePayload(template.TemplateData);

        return new ProjectTemplateResponse(
            template.Id,
            template.Name,
            template.Description,
            payload.Category,
            template.IconUrl,
            template.IsSystemTemplate,
            payload.TaskTemplates ?? [],
            template.CreatedAt,
            template.UpdatedAt);
    }

    private static ProjectTemplatePayload DeserializePayload(JsonDocument templateData)
    {
        return templateData.Deserialize<ProjectTemplatePayload>()
            ?? throw new InvalidOperationException("Project template payload could not be deserialized.");
    }

    private static TaskItemStatus MapTaskStatus(string status) =>
        status switch
        {
            "In Progress" => TaskItemStatus.InProgress,
            "In Review" => TaskItemStatus.InReview,
            "Done" => TaskItemStatus.Done,
            "Cancelled" => TaskItemStatus.Cancelled,
            _ => TaskItemStatus.Backlog
        };

    private static TaskPriority MapTaskPriority(string priority) =>
        priority switch
        {
            "Low" => TaskPriority.Low,
            "High" => TaskPriority.High,
            "Urgent" => TaskPriority.Urgent,
            _ => TaskPriority.Medium
        };

    private static int GetCategoryRank(string category) =>
        category switch
        {
            "Engineering" => 0,
            "Marketing" => 1,
            "Product" => 2,
            "Operations" => 3,
            _ => 99
        };
}
