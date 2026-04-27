using System.Security.Cryptography;
using System.Text;

namespace LinearPrecision.Api.Modules.Workspace.Endpoints;

/// <summary>
/// F-04: invitation tokens are stored as SHA-256 hashes of the random token bytes.
/// The plaintext token only exists in the email link sent to the invitee and in
/// transit on the accept request. A read-only DB leak no longer exposes usable
/// invitation links.
/// </summary>
internal static class InvitationTokenHasher
{
    /// <summary>Hashes the token in the same way the lookup path does so issuance
    /// and verification produce the same column value.</summary>
    internal static string Hash(string token)
    {
        ArgumentException.ThrowIfNullOrEmpty(token);
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
