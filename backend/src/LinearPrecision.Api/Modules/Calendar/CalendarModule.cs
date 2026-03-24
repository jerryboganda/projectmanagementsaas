using LinearPrecision.Api.Modules.Calendar.Endpoints;

namespace LinearPrecision.Api.Modules.Calendar;

public static class CalendarModule
{
    public static IServiceCollection AddCalendarModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapCalendarEndpoints(this IEndpointRouteBuilder app)
    {
        CalendarEndpoints.MapEndpoints(app);
        return app;
    }
}
