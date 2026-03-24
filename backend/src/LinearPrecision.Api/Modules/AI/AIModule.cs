using LinearPrecision.Api.Modules.AI.Endpoints;
using LinearPrecision.Api.Modules.AI.Services;

namespace LinearPrecision.Api.Modules.AI;

public static class AIModule
{
    public static IServiceCollection AddAIModule(this IServiceCollection services)
    {
        services.AddDataProtection();
        services.AddScoped<IAISecretProtector, DataProtectionAISecretProtector>();
        services.AddHttpClient<IAIChatCompletionService, OpenAICompatibleChatCompletionService>();
        return services;
    }

    public static IEndpointRouteBuilder MapAIEndpoints(this IEndpointRouteBuilder app)
    {
        AIProviderEndpoints.MapEndpoints(app);
        AIConversationEndpoints.MapEndpoints(app);
        AIMessageEndpoints.MapEndpoints(app);
        return app;
    }
}
