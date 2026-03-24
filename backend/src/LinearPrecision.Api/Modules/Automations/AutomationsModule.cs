using LinearPrecision.Api.Modules.Automations.Endpoints;

namespace LinearPrecision.Api.Modules.Automations;

public static class AutomationsModule
{
    public static IServiceCollection AddAutomationsModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapAutomationsEndpoints(this IEndpointRouteBuilder app)
    {
        AutomationEndpoints.MapEndpoints(app);
        AutomationLogEndpoints.MapEndpoints(app);
        return app;
    }
}
