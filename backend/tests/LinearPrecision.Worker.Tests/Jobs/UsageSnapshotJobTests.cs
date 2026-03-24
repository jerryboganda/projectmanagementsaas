using FluentAssertions;
using LinearPrecision.Api.Entities;
using LinearPrecision.Worker.Jobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace LinearPrecision.Worker.Tests.Jobs;

public class UsageSnapshotJobTests
{
    [Fact]
    public async Task AggregateUsageAsync_should_complete_without_error_with_no_workspaces()
    {
        using var db = TestDbContextFactory.Create();
        var logger = Substitute.For<ILogger<UsageSnapshotJob>>();
        var job = new UsageSnapshotJob(logger, db);

        var action = () => job.AggregateUsageAsync();
        await action.Should().NotThrowAsync();
    }

    [Fact]
    public async Task AggregateUsageAsync_should_create_usage_records_for_workspace()
    {
        using var db = TestDbContextFactory.Create();
        var logger = Substitute.For<ILogger<UsageSnapshotJob>>();

        var wsId = Guid.CreateVersion7();
        db.Workspaces.Add(new Workspace
        {
            Id = wsId,
            Name = "Test Workspace",
            Slug = "test-ws",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();

        var job = new UsageSnapshotJob(logger, db);
        await job.AggregateUsageAsync();

        var records = await db.UsageRecords
            .IgnoreQueryFilters()
            .Where(r => r.WorkspaceId == wsId)
            .ToListAsync();

        // Should have 5 metric records: members, projects, tasks, storage_bytes, automations
        records.Should().HaveCount(5);
        records.Select(r => r.MetricName).Should().Contain(new[]
        {
            "members", "projects", "tasks", "storage_bytes", "automations"
        });
    }
}
