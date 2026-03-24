using LinearPrecision.Api.Modules.Admin.Endpoints;

namespace LinearPrecision.Api.Modules.Admin;

public static class AdminModule
{
    public static IServiceCollection AddAdminModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        AuditEventEndpoints.MapEndpoints(app);
        FeatureFlagEndpoints.MapEndpoints(app);
        WorkspaceStatsEndpoints.MapEndpoints(app);
        return app;
    }
}
