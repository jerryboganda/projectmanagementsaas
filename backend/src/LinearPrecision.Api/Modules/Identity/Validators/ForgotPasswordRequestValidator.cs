using FluentValidation;
using LinearPrecision.Api.Modules.Identity.Models;

namespace LinearPrecision.Api.Modules.Identity.Validators;

public sealed class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(254);
    }
}
