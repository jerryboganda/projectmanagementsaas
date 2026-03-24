using LinearPrecision.Api.Modules.Tasks.Endpoints;

namespace LinearPrecision.Api.Modules.Tasks;

public static class TasksModule
{
    public static IServiceCollection AddTasksModule(this IServiceCollection services)
    {
        return services;
    }

    public static IEndpointRouteBuilder MapTasksEndpoints(this IEndpointRouteBuilder app)
    {
        TaskEndpoints.MapEndpoints(app);
        TaskCommentEndpoints.MapEndpoints(app);
        TaskChecklistEndpoints.MapEndpoints(app);
        TaskDependencyEndpoints.MapEndpoints(app);
        TaskWatcherEndpoints.MapEndpoints(app);
        TaskAttachmentEndpoints.MapEndpoints(app);
        return app;
    }
}
