using FluentAssertions;
using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Domain.Enums;
using LinearPrecision.Worker.Jobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;
using StackExchange.Redis;

namespace LinearPrecision.Worker.Tests.Jobs;

public class CleanupExpiredTokensJobTests
{
    [Fact]
    public async Task CleanupAsync_should_complete_without_error_with_empty_db()
    {
        using var db = TestDbContextFactory.Create();
        var logger = Substitute.For<ILogger<CleanupExpiredTokensJob>>();
        var redis = Substitute.For<IConnectionMultiplexer>();
        redis.GetDatabase(Arg.Any<int>(), Arg.Any<object?>()).Returns(Substitute.For<IDatabase>());

        var job = new CleanupExpiredTokensJob(logger, db, redis);

        var action = () => job.CleanupAsync();
        await action.Should().NotThrowAsync();
    }

    [Fact]
    public async Task CleanupAsync_should_mark_expired_invitations()
    {
        using var db = TestDbContextFactory.Create();
        var logger = Substitute.For<ILogger<CleanupExpiredTokensJob>>();
        var redis = Substitute.For<IConnectionMultiplexer>();
        redis.GetDatabase(Arg.Any<int>(), Arg.Any<object?>()).Returns(Substitute.For<IDatabase>());

        var invitationId = Guid.CreateVersion7();
        db.Invitations.Add(new Invitation
        {
            Id = invitationId,
            WorkspaceId = Guid.CreateVersion7(),
            Email = "test@example.com",
            Role = MembershipRole.Member,
            Status = InvitationStatus.Pending,
            InvitedBy = Guid.CreateVersion7(),
            Token = "test-token",
            ExpiresAt = DateTime.UtcNow.AddDays(-1), // Already expired
            CreatedAt = DateTime.UtcNow.AddDays(-8),
            UpdatedAt = DateTime.UtcNow.AddDays(-8),
        });

        await db.SaveChangesAsync();

        var job = new CleanupExpiredTokensJob(logger, db, redis);
        await job.CleanupAsync();

        var invitation = await db.Invitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Id == invitationId);
        invitation!.Status.Should().Be(InvitationStatus.Expired);
    }
}
