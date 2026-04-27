using FluentAssertions;
using LinearPrecision.Api.Infrastructure.Persistence.Auditing;
using Xunit;

namespace LinearPrecision.Api.Tests.Infrastructure.Persistence.Auditing;

public class AuditRedactorTests
{
    [Fact]
    public void Redact_ReplacesSensitiveValues_LeavesOthersUntouched()
    {
        var input = new Dictionary<string, object?>
        {
            ["Email"] = "user@example.com",
            ["PasswordHash"] = "AQAAAAEAACcQAAAA...",
            ["AuthenticatorKey"] = "JBSWY3DPEHPK3PXP",
            ["FullName"] = "Jane Doe",
            ["Token"] = "abc123",
            ["LastLoginIp"] = "203.0.113.10",
        };

        var redacted = AuditRedactor.Redact(input);

        redacted["Email"].Should().Be("user@example.com");
        redacted["FullName"].Should().Be("Jane Doe");
        redacted["PasswordHash"].Should().Be(SensitiveFieldRegistry.RedactedPlaceholder);
        redacted["AuthenticatorKey"].Should().Be(SensitiveFieldRegistry.RedactedPlaceholder);
        redacted["Token"].Should().Be(SensitiveFieldRegistry.RedactedPlaceholder);
        redacted["LastLoginIp"].Should().Be(SensitiveFieldRegistry.RedactedPlaceholder);
    }

    [Fact]
    public void Redact_IsCaseInsensitiveOnPropertyNames()
    {
        var input = new Dictionary<string, object?>
        {
            ["passwordhash"] = "x",
            ["PROTECTEDAPIKEY"] = "y",
            ["RecoveryCodes"] = new[] { "code1", "code2" },
        };

        var redacted = AuditRedactor.Redact(input);

        redacted["passwordhash"].Should().Be(SensitiveFieldRegistry.RedactedPlaceholder);
        redacted["PROTECTEDAPIKEY"].Should().Be(SensitiveFieldRegistry.RedactedPlaceholder);
        redacted["RecoveryCodes"].Should().Be(SensitiveFieldRegistry.RedactedPlaceholder);
    }

    [Fact]
    public void RedactJson_RecursivelyRedactsNestedObjects()
    {
        var json = """
        {
          "user": {
            "email": "user@example.com",
            "PasswordHash": "secretHash",
            "profile": { "fullName": "Jane", "ApiKey": "sk_live_xxx" }
          },
          "AccessToken": "eyJsensitive",
          "tokens": [ { "Token": "t1" }, { "Token": "t2" } ]
        }
        """;

        var redacted = AuditRedactor.RedactJson(json);

        redacted.Should().Contain("user@example.com");
        redacted.Should().Contain("Jane");
        redacted.Should().Contain(SensitiveFieldRegistry.RedactedPlaceholder);
        redacted.Should().NotContain("secretHash");
        redacted.Should().NotContain("sk_live_xxx");
        redacted.Should().NotContain("eyJsensitive");
        redacted.Should().NotContain("\"t1\"");
    }

    [Fact]
    public void RedactJson_ReturnsInputUnchanged_WhenNullOrWhitespace()
    {
        AuditRedactor.RedactJson(string.Empty).Should().Be(string.Empty);
        AuditRedactor.RedactJson("   ").Should().Be("   ");
    }
}
