using LinearPrecision.Api.Modules.Analytics.Endpoints;

namespace LinearPrecision.Api.Modules.Analytics;

public static class AnalyticsModule
{
    public static IServiceCollection AddAnalyticsModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapAnalyticsEndpoints(this IEndpointRouteBuilder app)
    {
        AnalyticsEndpoints.MapEndpoints(app);
        return app;
    }
}
