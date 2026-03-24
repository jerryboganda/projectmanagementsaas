using FluentValidation;
using LinearPrecision.Api.Modules.Goals.Models;

namespace LinearPrecision.Api.Modules.Goals.Validators;

public sealed class CreateGoalRequestValidator : AbstractValidator<CreateGoalRequest>
{
    public CreateGoalRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(5000).When(x => x.Description is not null);
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue);
        RuleFor(x => x.Type).IsInEnum().When(x => x.Type.HasValue);
        RuleFor(x => x.ProgressPercent).InclusiveBetween(0, 100).When(x => x.ProgressPercent.HasValue);
        RuleFor(x => x.ProgressSource).IsInEnum().When(x => x.ProgressSource.HasValue);
    }
}

public sealed class UpdateGoalRequestValidator : AbstractValidator<UpdateGoalRequest>
{
    public UpdateGoalRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(5000).When(x => x.Description is not null);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.ProgressPercent).InclusiveBetween(0, 100).When(x => x.ProgressPercent.HasValue);
        RuleFor(x => x.ProgressSource).IsInEnum().When(x => x.ProgressSource.HasValue);
    }
}

public sealed class LinkProjectRequestValidator : AbstractValidator<LinkProjectRequest>
{
    public LinkProjectRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
    }
}

public sealed class CreateInitiativeRequestValidator : AbstractValidator<CreateInitiativeRequest>
{
    public CreateInitiativeRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(5000).When(x => x.Description is not null);
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue);
        RuleFor(x => x.ProgressPercent).InclusiveBetween(0, 100).When(x => x.ProgressPercent.HasValue);
    }
}

public sealed class UpdateInitiativeRequestValidator : AbstractValidator<UpdateInitiativeRequest>
{
    public UpdateInitiativeRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Description).MaximumLength(5000).When(x => x.Description is not null);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.ProgressPercent).InclusiveBetween(0, 100).When(x => x.ProgressPercent.HasValue);
    }
}
