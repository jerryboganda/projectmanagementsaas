using FluentValidation;
using LinearPrecision.Api.Modules.Identity.Models;

namespace LinearPrecision.Api.Modules.Identity.Validators;

public sealed class SetActiveWorkspaceRequestValidator : AbstractValidator<SetActiveWorkspaceRequest>
{
    public SetActiveWorkspaceRequestValidator()
    {
        RuleFor(x => x.WorkspaceId)
            .NotEmpty();
    }
}
