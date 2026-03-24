using FluentValidation;
using LinearPrecision.Api.Modules.Intake.Endpoints;
using LinearPrecision.Api.Modules.Intake.Models;
using LinearPrecision.Api.Modules.Intake.Validators;

namespace LinearPrecision.Api.Modules.Intake;

public static class IntakeModule
{
    public static IServiceCollection AddIntakeModule(this IServiceCollection services)
    {
        services.AddScoped<IValidator<CreateRequestFormRequest>, CreateRequestFormValidator>();
        services.AddScoped<IValidator<ReviewSubmissionRequest>, ReviewSubmissionRequestValidator>();
        return services;
    }

    public static IEndpointRouteBuilder MapIntakeEndpoints(this IEndpointRouteBuilder app)
    {
        RequestFormEndpoints.MapEndpoints(app);
        SubmissionEndpoints.MapEndpoints(app);
        return app;
    }
}
