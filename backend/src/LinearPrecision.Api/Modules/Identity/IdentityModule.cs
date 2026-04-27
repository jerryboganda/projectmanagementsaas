using LinearPrecision.Api.Modules.Identity.Endpoints;
using LinearPrecision.Api.Modules.Identity.Services;

namespace LinearPrecision.Api.Modules.Identity;

public static class IdentityModule
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services)
    {
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<MfaChallengeService>();
        return services;
    }

    public static IEndpointRouteBuilder MapIdentityEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapAuthEndpoints();
        app.MapMfaEndpoints();
        app.MapUserEndpoints();
        return app;
    }
}
