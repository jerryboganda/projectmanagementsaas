using LinearPrecision.Api.Modules.Documents.Endpoints;

namespace LinearPrecision.Api.Modules.Documents;

public static class DocumentsModule
{
    public static IServiceCollection AddDocumentsModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapDocumentsEndpoints(this IEndpointRouteBuilder app)
    {
        DocumentEndpoints.MapEndpoints(app);
        return app;
    }
}
