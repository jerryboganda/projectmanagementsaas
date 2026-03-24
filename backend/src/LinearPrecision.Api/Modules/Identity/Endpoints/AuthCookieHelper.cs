namespace LinearPrecision.Api.Modules.Identity.Endpoints;

internal static class AuthCookieHelper
{
    internal const string RefreshCookieName = "lp_refresh_token";

    internal static void SetRefreshTokenCookie(HttpContext httpContext, string refreshToken)
    {
        httpContext.Response.Cookies.Append(
            RefreshCookieName,
            refreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                SameSite = SameSiteMode.Lax,
                Secure = httpContext.Request.IsHttps,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });
    }
}
