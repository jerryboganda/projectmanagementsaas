using FluentValidation;
using LinearPrecision.Api.Modules.Tasks.Models;

namespace LinearPrecision.Api.Modules.Tasks.Validators;

public sealed class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MinimumLength(1).MaximumLength(500);
        RuleFor(x => x.Description).MaximumLength(50000).When(x => x.Description is not null);
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue);
        RuleFor(x => x.Priority).IsInEnum().When(x => x.Priority.HasValue);
        RuleFor(x => x.TaskType).MaximumLength(50).When(x => x.TaskType is not null);
    }
}
