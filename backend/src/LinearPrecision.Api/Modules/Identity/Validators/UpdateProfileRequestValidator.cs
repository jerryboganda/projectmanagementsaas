using FluentValidation;
using LinearPrecision.Api.Modules.Identity.Models;

namespace LinearPrecision.Api.Modules.Identity.Validators;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .Length(1, 100)
            .When(x => x.FullName is not null);

        RuleFor(x => x.DisplayName)
            .MaximumLength(50)
            .When(x => x.DisplayName is not null);

        RuleFor(x => x.Timezone)
            .MaximumLength(50)
            .When(x => x.Timezone is not null);
    }
}
