using LinearPrecision.Api.Modules.Sprints.Endpoints;

namespace LinearPrecision.Api.Modules.Sprints;

public static class SprintsModule
{
    public static IServiceCollection AddSprintsModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapSprintsEndpoints(this IEndpointRouteBuilder app)
    {
        SprintEndpoints.MapEndpoints(app);
        return app;
    }
}
