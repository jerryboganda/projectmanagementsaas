using LinearPrecision.Api.Modules.Projects.Endpoints;

namespace LinearPrecision.Api.Modules.Projects;

public static class ProjectsModule
{
    public static IServiceCollection AddProjectsModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapProjectsEndpoints(this IEndpointRouteBuilder app)
    {
        ProjectEndpoints.MapEndpoints(app);
        return app;
    }
}
