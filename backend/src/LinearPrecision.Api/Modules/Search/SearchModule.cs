using LinearPrecision.Api.Modules.Search.Endpoints;

namespace LinearPrecision.Api.Modules.Search;

public static class SearchModule
{
    public static IServiceCollection AddSearchModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapSearchEndpoints(this IEndpointRouteBuilder app)
    {
        SearchEndpoints.MapEndpoints(app);
        return app;
    }
}
