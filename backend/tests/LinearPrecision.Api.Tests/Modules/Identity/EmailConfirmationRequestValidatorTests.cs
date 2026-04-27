using FluentAssertions;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Api.Modules.Identity.Validators;

namespace LinearPrecision.Api.Tests.Modules.Identity;

public class EmailConfirmationRequestValidatorTests
{
    private readonly ConfirmEmailRequestValidator _confirmValidator = new();
    private readonly ResendConfirmationRequestValidator _resendValidator = new();

    [Fact]
    public void Confirm_email_request_with_valid_data_should_pass()
    {
        var request = new ConfirmEmailRequest("user@example.com", "confirmation-token");

        var result = _confirmValidator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("", "confirmation-token", "Email")]
    [InlineData("not-an-email", "confirmation-token", "Email")]
    [InlineData("user@example.com", "", "Token")]
    public void Confirm_email_request_with_invalid_data_should_fail(
        string email,
        string token,
        string failingProperty)
    {
        var request = new ConfirmEmailRequest(email, token);

        var result = _confirmValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == failingProperty);
    }

    [Fact]
    public void Resend_confirmation_request_with_valid_email_should_pass()
    {
        var request = new ResendConfirmationRequest("user@example.com");

        var result = _resendValidator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public void Resend_confirmation_request_with_invalid_email_should_fail(string email)
    {
        var request = new ResendConfirmationRequest(email);

        var result = _resendValidator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == "Email");
    }
}
