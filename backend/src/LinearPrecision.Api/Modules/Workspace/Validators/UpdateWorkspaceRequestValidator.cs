using FluentValidation;
using LinearPrecision.Api.Modules.Workspace.Models;

namespace LinearPrecision.Api.Modules.Workspace.Validators;

public sealed class UpdateWorkspaceRequestValidator : AbstractValidator<UpdateWorkspaceRequest>
{
    public UpdateWorkspaceRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100)
            .When(x => x.Name is not null);

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .When(x => x.Description is not null);

        RuleFor(x => x.LogoUrl)
            .MaximumLength(2048)
            .When(x => x.LogoUrl is not null);

        RuleFor(x => x.Domain)
            .MaximumLength(253)
            .When(x => x.Domain is not null);
    }
}
