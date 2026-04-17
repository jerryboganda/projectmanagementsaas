using LinearPrecision.Api.Modules.Teams.Endpoints;

namespace LinearPrecision.Api.Modules.Teams;

public static class TeamsModule
{
    public static IServiceCollection AddTeamsModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapTeamsEndpoints(this IEndpointRouteBuilder app)
    {
        TeamEndpoints.MapEndpoints(app);
        return app;
    }
}
