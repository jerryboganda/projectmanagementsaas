using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.IdentityModel.Tokens;

namespace LinearPrecision.Api.Infrastructure.Auth;

public sealed class JwtTokenGenerator
{
    private readonly IConfiguration _configuration;
    private const int HubTokenExpirySeconds = 60;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user, MembershipRole? role, Guid? workspaceId)
    {
        var claims = BuildBaseClaims(user);

        if (role.HasValue)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.Value.ToString()));
        }

        if (workspaceId.HasValue)
        {
            claims.Add(new Claim("workspace_id", workspaceId.Value.ToString()));
        }

        return WriteToken(claims, DateTime.UtcNow.AddMinutes(15));
    }

    public string GenerateHubAccessToken(User user, MembershipRole role, Guid workspaceId, string hubPath)
    {
        var claims = BuildBaseClaims(user);
        claims.Add(new Claim(ClaimTypes.Role, role.ToString()));
        claims.Add(new Claim("workspace_id", workspaceId.ToString()));
        claims.Add(new Claim("token_use", "hub"));
        claims.Add(new Claim("hub_path", hubPath));

        return WriteToken(claims, DateTime.UtcNow.AddSeconds(HubTokenExpirySeconds));
    }

    public static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private static List<Claim> BuildBaseClaims(User user) =>
    [
        new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
        new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
        new Claim("name", user.FullName),
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    ];

    private string WriteToken(IEnumerable<Claim> claims, DateTime expires)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT signing key is not configured.");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
