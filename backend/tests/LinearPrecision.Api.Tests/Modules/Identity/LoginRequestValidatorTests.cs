using FluentAssertions;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Api.Modules.Identity.Validators;

namespace LinearPrecision.Api.Tests.Modules.Identity;

public class LoginRequestValidatorTests
{
    private readonly LoginRequestValidator _validator = new();

    [Fact]
    public void Valid_request_should_pass()
    {
        var request = new LoginRequest("user@example.com", "anypassword");
        var result = _validator.Validate(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("", "password")]
    [InlineData("not-an-email", "password")]
    [InlineData("user@example.com", "")]
    public void Invalid_request_should_fail(string email, string password)
    {
        var request = new LoginRequest(email, password);
        var result = _validator.Validate(request);
        result.IsValid.Should().BeFalse();
    }
}
