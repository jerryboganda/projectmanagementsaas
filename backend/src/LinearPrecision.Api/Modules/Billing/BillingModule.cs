using LinearPrecision.Api.Modules.Billing.Endpoints;

namespace LinearPrecision.Api.Modules.Billing;

public static class BillingModule
{
    public static IServiceCollection AddBillingModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapBillingEndpoints(this IEndpointRouteBuilder app)
    {
        PlanEndpoints.MapEndpoints(app);
        SubscriptionEndpoints.MapEndpoints(app);
        UsageEndpoints.MapEndpoints(app);
        StripeEndpoints.MapEndpoints(app);
        return app;
    }
}
