using Microsoft.AspNetCore.DataProtection;

namespace LinearPrecision.Api.Modules.AI.Services;

public sealed class DataProtectionAISecretProtector : IAISecretProtector
{
    private readonly IDataProtector _protector;

    public DataProtectionAISecretProtector(IDataProtectionProvider dataProtectionProvider)
    {
        _protector = dataProtectionProvider.CreateProtector("LinearPrecision.Api.AIProviderConnection.ApiKey.v1");
    }

    public string Protect(string plaintext) => _protector.Protect(plaintext);

    public string Unprotect(string protectedValue) => _protector.Unprotect(protectedValue);
}
