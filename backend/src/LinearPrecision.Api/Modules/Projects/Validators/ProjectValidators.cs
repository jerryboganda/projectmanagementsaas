using FluentValidation;
using LinearPrecision.Api.Modules.Projects.Models;

namespace LinearPrecision.Api.Modules.Projects.Validators;

public sealed class CreateProjectRequestValidator : AbstractValidator<CreateProjectRequest>
{
    public CreateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(200);

        RuleFor(x => x.Identifier)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(10)
            .Matches("^[A-Z][A-Z0-9]*$")
            .WithMessage("Identifier must be 2-10 uppercase alphanumeric characters starting with a letter.");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => x.Description is not null);

        RuleFor(x => x.Color)
            .MaximumLength(7)
            .When(x => x.Color is not null);

        RuleFor(x => x.IconUrl)
            .MaximumLength(2048)
            .When(x => x.IconUrl is not null);

        RuleFor(x => x.Status)
            .IsInEnum()
            .When(x => x.Status.HasValue);

        RuleFor(x => x.Visibility)
            .IsInEnum()
            .When(x => x.Visibility.HasValue);
    }
}

public sealed class UpdateProjectRequestValidator : AbstractValidator<UpdateProjectRequest>
{
    public UpdateProjectRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(200);

        RuleFor(x => x.Identifier)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(10)
            .Matches("^[A-Z][A-Z0-9]*$")
            .WithMessage("Identifier must be 2-10 uppercase alphanumeric characters starting with a letter.");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => x.Description is not null);

        RuleFor(x => x.Color)
            .MaximumLength(7)
            .When(x => x.Color is not null);

        RuleFor(x => x.IconUrl)
            .MaximumLength(2048)
            .When(x => x.IconUrl is not null);

        RuleFor(x => x.Status)
            .IsInEnum();

        RuleFor(x => x.Visibility)
            .IsInEnum();
    }
}

public sealed class CreateFromTemplateRequestValidator : AbstractValidator<CreateFromTemplateRequest>
{
    public CreateFromTemplateRequestValidator()
    {
        RuleFor(x => x.TemplateId)
            .NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(200);

        RuleFor(x => x.Identifier)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(10)
            .Matches("^[A-Z][A-Z0-9]*$")
            .WithMessage("Identifier must be 2-10 uppercase alphanumeric characters starting with a letter.");

        RuleFor(x => x.Description)
            .MaximumLength(2000)
            .When(x => x.Description is not null);
    }
}
