using LinearPrecision.Api.Modules.Notifications.Endpoints;

namespace LinearPrecision.Api.Modules.Notifications;

public static class NotificationsModule
{
    public static IServiceCollection AddNotificationsModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapNotificationsEndpoints(this IEndpointRouteBuilder app)
    {
        NotificationEndpoints.MapEndpoints(app);
        NotificationPreferenceEndpoints.MapEndpoints(app);
        return app;
    }
}
