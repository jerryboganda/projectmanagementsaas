using EFCore.NamingConventions;
using Hangfire;
using Hangfire.PostgreSql;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Api.Infrastructure.Email;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Worker.Jobs;
using Microsoft.EntityFrameworkCore;
using Serilog;
using StackExchange.Redis;
using System.Globalization;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture)
    .CreateLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    builder.Services.AddSerilog();

    // ── Connection strings ──
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Database=linearprecision;Username=postgres;Password=postgres";

    var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";

    // ── EF Core (AppDbContext) ──
    // Worker runs cross-tenant: ITenantContext.WorkspaceId = null.
    // All job queries use .IgnoreQueryFilters() to bypass tenant scoping.
    builder.Services.AddScoped<ITenantContext>(_ => new TenantContext());
    builder.Services.AddDbContext<AppDbContext>(options =>
    {
    options.UseNpgsql(
        connectionString,
        npgsqlOptions => npgsqlOptions.ConfigureDataSource(dataSourceBuilder => dataSourceBuilder.EnableDynamicJson()));
        options.UseSnakeCaseNamingConvention();
    });

    // ── Redis (IDistributedCache + raw ConnectionMultiplexer) ──
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
    });
    builder.Services.AddSingleton<IConnectionMultiplexer>(
        ConnectionMultiplexer.Connect(redisConnectionString));

    // ── Hangfire ──
    builder.Services.AddHangfire(config =>
    {
        config.UsePostgreSqlStorage(options =>
            options.UseNpgsqlConnection(connectionString));
        config.UseSimpleAssemblyNameTypeSerializer();
        config.UseRecommendedSerializerSettings();
    });

    builder.Services.AddHangfireServer(options =>
    {
        options.Queues = ["default", "notifications", "email", "cleanup", "ai"];
        options.WorkerCount = Environment.ProcessorCount * 2;
    });

    // ── Register job services ──
    builder.Services.AddTransient<NotificationDigestJob>();
    builder.Services.AddTransient<CleanupExpiredTokensJob>();
    builder.Services.AddTransient<UsageSnapshotJob>();
    builder.Services.AddTransient<StaleTimerCleanupJob>();

    // ── Email service (used by NotificationDigestJob) ──
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();

    // ── Background service to register recurring jobs ──
    builder.Services.AddHostedService<RecurringJobRegistrar>();

    var host = builder.Build();
    host.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Worker terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
