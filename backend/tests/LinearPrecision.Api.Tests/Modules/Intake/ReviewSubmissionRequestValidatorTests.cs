using FluentAssertions;
using LinearPrecision.Api.Modules.Intake.Models;
using LinearPrecision.Api.Modules.Intake.Validators;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Tests.Modules.Intake;

public class ReviewSubmissionRequestValidatorTests
{
    private readonly ReviewSubmissionRequestValidator _validator = new();

    [Theory]
    [InlineData(SubmissionStatus.InReview)]
    [InlineData(SubmissionStatus.Accepted)]
    [InlineData(SubmissionStatus.Rejected)]
    public void Supported_review_status_should_pass(SubmissionStatus status)
    {
        var request = new ReviewSubmissionRequest(status, "Looks good.");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(SubmissionStatus.New)]
    [InlineData(SubmissionStatus.ConvertedToTask)]
    public void Unsupported_review_status_should_fail(SubmissionStatus status)
    {
        var request = new ReviewSubmissionRequest(status, "Needs a manual check.");

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == "Status");
    }

    [Fact]
    public void Review_notes_exceeding_limit_should_fail()
    {
        var request = new ReviewSubmissionRequest(
            SubmissionStatus.Accepted,
            new string('A', 2001));

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == "ReviewNotes");
    }
}
