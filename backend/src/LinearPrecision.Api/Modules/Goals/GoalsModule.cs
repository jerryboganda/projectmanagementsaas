using LinearPrecision.Api.Modules.Goals.Endpoints;

namespace LinearPrecision.Api.Modules.Goals;

public static class GoalsModule
{
    public static IServiceCollection AddGoalsModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapGoalsEndpoints(this IEndpointRouteBuilder app)
    {
        GoalEndpoints.MapEndpoints(app);
        InitiativeEndpoints.MapEndpoints(app);
        return app;
    }
}
