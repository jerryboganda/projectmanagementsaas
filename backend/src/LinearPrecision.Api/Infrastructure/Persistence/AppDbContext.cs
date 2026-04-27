using System.Text.Json;
using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LinearPrecision.Api.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    // ── Workspace & Membership ──
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Invitation> Invitations => Set<Invitation>();

    // ── Teams ──
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMembership> TeamMemberships => Set<TeamMembership>();

    // ── Projects ──
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectFavorite> ProjectFavorites => Set<ProjectFavorite>();
    public DbSet<ProjectTemplate> ProjectTemplates => Set<ProjectTemplate>();

    // ── Tasks ──
    public DbSet<TaskItem> TaskItems => Set<TaskItem>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<TaskWatcher> TaskWatchers => Set<TaskWatcher>();
    public DbSet<TaskDependency> TaskDependencies => Set<TaskDependency>();
    public DbSet<TaskChecklistItem> TaskChecklistItems => Set<TaskChecklistItem>();
    public DbSet<TaskAttachment> TaskAttachments => Set<TaskAttachment>();

    // ── Goals & Initiatives ──
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<GoalProjectLink> GoalProjectLinks => Set<GoalProjectLink>();
    public DbSet<Initiative> Initiatives => Set<Initiative>();
    public DbSet<InitiativeMilestone> InitiativeMilestones => Set<InitiativeMilestone>();

    // ── Sprints ──
    public DbSet<Sprint> Sprints => Set<Sprint>();

    // ── Calendar & Documents ──
    public DbSet<CalendarItem> CalendarItems => Set<CalendarItem>();
    public DbSet<Document> Documents => Set<Document>();

    // ── Time Tracking ──
    public DbSet<TimeEntry> TimeEntries => Set<TimeEntry>();

    // ── Automation ──
    public DbSet<AutomationRule> AutomationRules => Set<AutomationRule>();
    public DbSet<AutomationLog> AutomationLogs => Set<AutomationLog>();

    // ── Requests ──
    public DbSet<RequestForm> RequestForms => Set<RequestForm>();
    public DbSet<RequestSubmission> RequestSubmissions => Set<RequestSubmission>();

    // ── Notifications ──
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();

    // ── Billing ──
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<UsageRecord> UsageRecords => Set<UsageRecord>();

    // ── AI ──
    public DbSet<AIConversation> AIConversations => Set<AIConversation>();
    public DbSet<AIMessage> AIMessages => Set<AIMessage>();
    public DbSet<AIProviderConnection> AIProviderConnections => Set<AIProviderConnection>();
    public DbSet<AIToolInvocation> AIToolInvocations => Set<AIToolInvocation>();

    // ── Audit & Files ──
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();

    // ── Feature Flags ──
    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        var isLightweightProvider =
            Database.ProviderName is not null &&
            (Database.ProviderName.Contains("InMemory", StringComparison.Ordinal) ||
             Database.ProviderName.Contains("Sqlite", StringComparison.Ordinal));

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        if (isLightweightProvider)
        {
            ConfigureJsonDocumentProperties(builder);
            builder.Ignore<AIToolInvocation>();
        }

        ApplyGlobalQueryFilters(builder, isLightweightProvider);

        // Note: UseSnakeCaseNamingConvention() is configured on DbContextOptionsBuilder
        // in the DI registration (Program.cs), not here on ModelBuilder.
    }

    private void ApplyGlobalQueryFilters(ModelBuilder builder, bool isLightweightProvider)
    {
        // ── Tenant-only entities (TenantEntity but NOT ISoftDeletable) ──
        ApplyTenantFilter<Membership>(builder);
        ApplyTenantFilter<Invitation>(builder);
        ApplyTenantFilter<ProjectFavorite>(builder);
        ApplyTenantFilter<TaskWatcher>(builder);
        ApplyTenantFilter<TaskDependency>(builder);
        ApplyTenantFilter<TaskChecklistItem>(builder);
        ApplyTenantFilter<TaskAttachment>(builder);
        ApplyTenantFilter<GoalProjectLink>(builder);
        ApplyTenantFilter<InitiativeMilestone>(builder);
        ApplyTenantFilter<Sprint>(builder);
        ApplyTenantFilter<CalendarItem>(builder);
        ApplyTenantFilter<TimeEntry>(builder);
        ApplyTenantFilter<AutomationRule>(builder);
        ApplyTenantFilter<AutomationLog>(builder);
        ApplyTenantFilter<RequestForm>(builder);
        ApplyTenantFilter<RequestSubmission>(builder);
        ApplyTenantFilter<ProjectTemplate>(builder);
        ApplyTenantFilter<Notification>(builder);
        ApplyTenantFilter<NotificationPreference>(builder);
        ApplyTenantFilter<UsageRecord>(builder);
        ApplyTenantFilter<AIConversation>(builder);
        ApplyTenantFilter<AIMessage>(builder);
        ApplyTenantFilter<AIProviderConnection>(builder);
        if (!isLightweightProvider)
        {
            ApplyTenantFilter<AIToolInvocation>(builder);
        }
        ApplyTenantFilter<AuditEvent>(builder);
        ApplyTenantFilter<FileAttachment>(builder);

        // ── Tenant + Soft-deletable entities (both TenantEntity AND ISoftDeletable) ──
        ApplyTenantAndSoftDeleteFilter<Project>(builder);
        ApplyTenantAndSoftDeleteFilter<TaskItem>(builder);
        ApplyTenantAndSoftDeleteFilter<TaskComment>(builder);
        ApplyTenantAndSoftDeleteFilter<Goal>(builder);
        ApplyTenantAndSoftDeleteFilter<Initiative>(builder);
        ApplyTenantAndSoftDeleteFilter<Document>(builder);
        ApplyTenantAndSoftDeleteFilter<Team>(builder);
        ApplyTenantFilter<TeamMembership>(builder);

        // ── Global soft-deletable entities (ISoftDeletable but NOT TenantEntity) ──
        ApplySoftDeleteFilter<Workspace>(builder);
    }

    /// <summary>
    /// Applies a tenant-scoping query filter for entities that are TenantEntity only.
    /// </summary>
    private void ApplyTenantFilter<TEntity>(ModelBuilder builder)
        where TEntity : TenantEntity
    {
        builder.Entity<TEntity>()
            .HasQueryFilter(e => e.WorkspaceId == _tenantContext.WorkspaceId);
    }

    /// <summary>
    /// Applies combined tenant-scoping + soft-delete query filter.
    /// EF Core allows only one HasQueryFilter per entity, so both predicates are combined.
    /// </summary>
    private void ApplyTenantAndSoftDeleteFilter<TEntity>(ModelBuilder builder)
        where TEntity : TenantEntity, ISoftDeletable
    {
        builder.Entity<TEntity>()
            .HasQueryFilter(e => e.WorkspaceId == _tenantContext.WorkspaceId && !e.IsDeleted);
    }

    /// <summary>
    /// Applies a soft-delete query filter for global (non-tenant) entities.
    /// </summary>
    private static void ApplySoftDeleteFilter<TEntity>(ModelBuilder builder)
        where TEntity : BaseEntity, ISoftDeletable
    {
        builder.Entity<TEntity>()
            .HasQueryFilter(e => !e.IsDeleted);
    }

    private static void ConfigureJsonDocumentProperties(ModelBuilder builder)
    {
        var converter = new ValueConverter<JsonDocument, string>(
            value => value.RootElement.GetRawText(),
            value => JsonDocument.Parse(value, new JsonDocumentOptions()));

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties().Where(property => property.ClrType == typeof(JsonDocument)))
            {
                property.SetValueConverter(converter);
                property.SetColumnType("TEXT");
            }
        }
    }
}
