using LinearPrecision.Api.Modules.TimeTracking.Endpoints;

namespace LinearPrecision.Api.Modules.TimeTracking;

public static class TimeTrackingModule
{
    public static IServiceCollection AddTimeTrackingModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapTimeTrackingEndpoints(this IEndpointRouteBuilder app)
    {
        TimeEntryEndpoints.MapEndpoints(app);
        return app;
    }
}
