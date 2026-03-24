using FluentValidation;
using LinearPrecision.Api.Modules.Intake.Models;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Intake.Validators;

public sealed class ReviewSubmissionRequestValidator : AbstractValidator<ReviewSubmissionRequest>
{
    public ReviewSubmissionRequestValidator()
    {
        RuleFor(x => x.Status)
            .Must(status =>
                status is SubmissionStatus.InReview
                    or SubmissionStatus.Accepted
                    or SubmissionStatus.Rejected)
            .WithMessage("Status must be InReview, Accepted, or Rejected.");

        RuleFor(x => x.ReviewNotes)
            .MaximumLength(2000)
            .When(x => x.ReviewNotes is not null);
    }
}
