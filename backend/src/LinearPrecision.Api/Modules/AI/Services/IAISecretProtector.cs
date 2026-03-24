namespace LinearPrecision.Api.Modules.AI.Services;

public interface IAISecretProtector
{
    string Protect(string plaintext);
    string Unprotect(string protectedValue);
}
