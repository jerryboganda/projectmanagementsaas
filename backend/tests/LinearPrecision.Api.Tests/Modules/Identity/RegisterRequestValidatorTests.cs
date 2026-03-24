using FluentAssertions;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Api.Modules.Identity.Validators;

namespace LinearPrecision.Api.Tests.Modules.Identity;

public class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator _validator = new();

    [Fact]
    public void Valid_request_should_pass()
    {
        var request = new RegisterRequest("user@example.com", "Password1", "John Doe");
        var result = _validator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("", "Password1", "John Doe", "Email")]
    [InlineData("not-an-email", "Password1", "John Doe", "Email")]
    [InlineData("user@example.com", "", "John Doe", "Password")]
    [InlineData("user@example.com", "short", "John Doe", "Password")]
    [InlineData("user@example.com", "nouppercase1", "John Doe", "Password")]
    [InlineData("user@example.com", "NOLOWERCASE1", "John Doe", "Password")]
    [InlineData("user@example.com", "NoDigitsHere", "John Doe", "Password")]
    [InlineData("user@example.com", "Password1", "", "FullName")]
    public void Invalid_request_should_fail(string email, string password, string fullName, string failingProperty)
    {
        var request = new RegisterRequest(email, password, fullName);
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == failingProperty);
    }

    [Fact]
    public void Email_exceeding_254_chars_should_fail()
    {
        var longEmail = new string('a', 246) + "@test.com"; // 255 chars, exceeds 254 limit
        var request = new RegisterRequest(longEmail, "Password1", "John Doe");
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void FullName_exceeding_100_chars_should_fail()
    {
        var longName = new string('A', 101);
        var request = new RegisterRequest("user@example.com", "Password1", longName);
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }
}
