using FluentAssertions;
using LinearPrecision.Api.Infrastructure.Persistence.Seeding;
using LinearPrecision.Api.Modules.Projects;
using LinearPrecision.Api.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Tests.Modules.Projects;

public class ProjectTemplateServiceTests
{
    [Fact]
    public async Task SeedWorkspace_should_create_system_templates_once()
    {
        var workspaceId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        await using var scope = await TestDbFactory.CreateAsync(workspaceId, userId);

        await ProjectTemplateSeeder.SeedWorkspaceAsync(scope.Context, workspaceId);
        var firstPass = await ProjectTemplateService.ListProjectTemplatesAsync(scope.Context, CancellationToken.None);

        firstPass.Should().HaveCount(4);
        firstPass.Select(template => template.Category)
            .Should()
            .ContainInOrder("Engineering", "Marketing", "Product", "Operations");
        firstPass.Should().OnlyContain(template => template.IsSystemTemplate);

        await ProjectTemplateSeeder.SeedWorkspaceAsync(scope.Context, workspaceId);
        var secondPass = await ProjectTemplateService.ListProjectTemplatesAsync(scope.Context, CancellationToken.None);

        secondPass.Should().HaveCount(4);
    }

    [Fact]
    public async Task CreateProjectFromTemplate_should_create_tasks_from_template_blueprint()
    {
        var workspaceId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        await using var scope = await TestDbFactory.CreateAsync(workspaceId, userId);
        await ProjectTemplateSeeder.SeedWorkspaceAsync(scope.Context, workspaceId);

        var template = await scope.Context.ProjectTemplates
            .AsNoTracking()
            .FirstAsync();

        var request = new LinearPrecision.Api.Modules.Projects.Models.CreateFromTemplateRequest(
            template.Id,
            "Launch Readiness",
            "LAUNCH1",
            null,
            null,
            null,
            null);

        var response = await ProjectTemplateService.CreateProjectFromTemplateAsync(
            scope.Context,
            scope.CurrentUser,
            template,
            request,
            CancellationToken.None);

        response.Name.Should().Be("Launch Readiness");
        response.Identifier.Should().Be("LAUNCH1");
        response.TaskCount.Should().BeGreaterThan(0);
        response.CompletedTaskCount.Should().Be(0);

        var createdTasks = await scope.Context.TaskItems
            .AsNoTracking()
            .Where(task => task.ProjectId == response.Id)
            .OrderBy(task => task.SortOrder)
            .ToListAsync();

        createdTasks.Should().HaveCount(template.TemplateData.RootElement.GetProperty("TaskTemplates").GetArrayLength());
        createdTasks.Should().OnlyContain(task => task.ProjectId == response.Id);
        createdTasks.Should().Contain(task => task.Identifier == "LAUNCH1-1");
    }
}
