using LinearPrecision.Api.Modules.Identity.Models;

namespace LinearPrecision.Api.Modules.Identity.Endpoints;

internal static class AuthCookieHelper
{
    internal const string RefreshCookieName = "lp_refresh_token";
    internal const string NativeClientHeaderName = "X-LP-Client";

    private const string NativeClientHeaderValue = "mobile";

    // F-02: cookie scoped to /api/v1/auth so it is not sent on every API call.
    private const string RefreshCookiePath = "/api/v1/auth";

    internal static void SetRefreshTokenCookie(HttpContext httpContext, string refreshToken)
    {
        var env = httpContext.RequestServices.GetService<IWebHostEnvironment>();
        var isDevelopment = env?.IsDevelopment() ?? false;

        httpContext.Response.Cookies.Append(
            RefreshCookieName,
            refreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                // F-02: SameSite=Strict for the refresh cookie. The refresh endpoint is
                // only ever invoked from our first-party SPA, so cross-site sends provide
                // no benefit and only widen CSRF surface.
                SameSite = SameSiteMode.Strict,
                // F-02: enforce Secure outside Development. Forwarded headers are configured
                // at app startup so Request.IsHttps is correct behind a proxy, but we do
                // not depend on it here — production must always be HTTPS.
                Secure = !isDevelopment,
                Path = RefreshCookiePath,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });
    }

    internal static object SessionResponseBody(HttpContext httpContext, AuthSessionResponse session)
    {
        if (AllowsRefreshTokenInBody(httpContext))
        {
            return session;
        }

        return new AuthSessionBodyResponse(
            AccessToken: session.AccessToken,
            ExpiresIn: session.ExpiresIn,
            TokenType: session.TokenType,
            User: session.User,
            ActiveWorkspaceId: session.ActiveWorkspaceId,
            Workspaces: session.Workspaces);
    }

    internal static void DeleteRefreshTokenCookie(HttpContext httpContext)
    {
        var env = httpContext.RequestServices.GetService<IWebHostEnvironment>();
        var isDevelopment = env?.IsDevelopment() ?? false;

        httpContext.Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
            Secure = !isDevelopment,
            Path = RefreshCookiePath,
        });
    }

    private static bool AllowsRefreshTokenInBody(HttpContext httpContext)
        => httpContext.Request.Headers.TryGetValue(NativeClientHeaderName, out var values)
           && values.Any(value => string.Equals(value, NativeClientHeaderValue, StringComparison.OrdinalIgnoreCase));

}
