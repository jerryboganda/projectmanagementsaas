using LinearPrecision.Api.Modules.Files.Endpoints;

namespace LinearPrecision.Api.Modules.Files;

public static class FilesModule
{
    public static IServiceCollection AddFilesModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapFilesEndpoints(this IEndpointRouteBuilder app)
    {
        FileEndpoints.MapEndpoints(app);
        return app;
    }
}
