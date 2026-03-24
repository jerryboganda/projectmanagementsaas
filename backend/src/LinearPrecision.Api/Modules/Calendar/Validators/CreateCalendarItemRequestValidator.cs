using FluentValidation;
using LinearPrecision.Api.Modules.Calendar.Models;

namespace LinearPrecision.Api.Modules.Calendar.Validators;

public sealed class CreateCalendarItemRequestValidator : AbstractValidator<CreateCalendarItemRequest>
{
    public CreateCalendarItemRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime).NotEmpty()
            .GreaterThan(x => x.StartTime)
            .WithMessage("EndTime must be after StartTime.");
    }
}

public sealed class UpdateCalendarItemRequestValidator : AbstractValidator<UpdateCalendarItemRequest>
{
    public UpdateCalendarItemRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime).NotEmpty()
            .GreaterThan(x => x.StartTime)
            .WithMessage("EndTime must be after StartTime.");
    }
}
