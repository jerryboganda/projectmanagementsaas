using LinearPrecision.Api.Modules.Workspace.Endpoints;

namespace LinearPrecision.Api.Modules.Workspace;

public static class WorkspaceModule
{
    public static IServiceCollection AddWorkspaceModule(this IServiceCollection services)
    {
        // No additional services needed for now
        return services;
    }

    public static IEndpointRouteBuilder MapWorkspaceEndpoints(this IEndpointRouteBuilder app)
    {
        WorkspaceEndpoints.MapEndpoints(app);
        InvitationEndpoints.MapEndpoints(app);
        return app;
    }
}
