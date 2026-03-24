using FluentValidation;
using LinearPrecision.Api.Modules.TimeTracking.Models;

namespace LinearPrecision.Api.Modules.TimeTracking.Validators;

public sealed class CreateTimeEntryRequestValidator : AbstractValidator<CreateTimeEntryRequest>
{
    public CreateTimeEntryRequestValidator()
    {
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .When(x => x.EndTime.HasValue)
            .WithMessage("EndTime must be after StartTime.");
        RuleFor(x => x.DurationMinutes)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DurationMinutes.HasValue);
        RuleFor(x => x.HourlyRate)
            .GreaterThanOrEqualTo(0)
            .When(x => x.HourlyRate.HasValue);
    }
}

public sealed class UpdateTimeEntryRequestValidator : AbstractValidator<UpdateTimeEntryRequest>
{
    public UpdateTimeEntryRequestValidator()
    {
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .When(x => x.EndTime.HasValue)
            .WithMessage("EndTime must be after StartTime.");
        RuleFor(x => x.DurationMinutes)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DurationMinutes.HasValue);
        RuleFor(x => x.HourlyRate)
            .GreaterThanOrEqualTo(0)
            .When(x => x.HourlyRate.HasValue);
    }
}

public sealed class StartTimerRequestValidator : AbstractValidator<StartTimerRequest>
{
    public StartTimerRequestValidator()
    {
        // All fields are optional for starting a timer
    }
}
