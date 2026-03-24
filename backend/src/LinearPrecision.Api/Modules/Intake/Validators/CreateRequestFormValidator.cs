using FluentValidation;
using LinearPrecision.Api.Modules.Intake.Models;

namespace LinearPrecision.Api.Modules.Intake.Validators;

public sealed class CreateRequestFormValidator : AbstractValidator<CreateRequestFormRequest>
{
    public CreateRequestFormValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(50)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug must be lowercase alphanumeric with hyphens only.");
        RuleFor(x => x.FormSchema).NotNull();
        RuleFor(x => x.Description).MaximumLength(2000).When(x => x.Description is not null);
    }
}
