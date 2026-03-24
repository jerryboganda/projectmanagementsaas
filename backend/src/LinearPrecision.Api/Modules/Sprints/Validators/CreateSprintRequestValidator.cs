using FluentValidation;
using LinearPrecision.Api.Modules.Sprints.Models;

namespace LinearPrecision.Api.Modules.Sprints.Validators;

public sealed class CreateSprintRequestValidator : AbstractValidator<CreateSprintRequest>
{
    public CreateSprintRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.EndDate).NotEmpty()
            .GreaterThan(x => x.StartDate)
            .WithMessage("EndDate must be after StartDate.");
    }
}

public sealed class UpdateSprintRequestValidator : AbstractValidator<UpdateSprintRequest>
{
    public UpdateSprintRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.StartDate).NotEmpty();
        RuleFor(x => x.EndDate).NotEmpty()
            .GreaterThan(x => x.StartDate)
            .WithMessage("EndDate must be after StartDate.");
    }
}
