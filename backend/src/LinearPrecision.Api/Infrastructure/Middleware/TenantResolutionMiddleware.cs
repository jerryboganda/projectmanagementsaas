using LinearPrecision.Shared.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace LinearPrecision.Api.Infrastructure.Middleware;

public sealed class TenantResolutionMiddleware : IMiddleware
{
    private static readonly string[] GlobalPrefixes =
    [
        "/api/v1/auth",
        "/api/v1/invitations",
        "/api/v1/users",
        "/api/v1/plans",
        "/health",
        "/openapi",
        "/scalar",
        "/hangfire",
    ];

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        if (!path.StartsWith("/api/v1/", StringComparison.OrdinalIgnoreCase) || ShouldSkip(path))
        {
            await next(context);
            return;
        }

        if (TryResolveWorkspaceFromRoute(path, out var routeWorkspaceId))
        {
            var routeTenantContext = context.RequestServices.GetRequiredService<ITenantContext>();
            routeTenantContext.WorkspaceId = routeWorkspaceId;
            await next(context);
            return;
        }

        if (context.User?.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("X-Workspace-Id", out var headerValue)
            || string.IsNullOrWhiteSpace(headerValue))
        {
            await WriteProblemDetails(context, "X-Workspace-Id header is required.");
            return;
        }

        if (!Guid.TryParse(headerValue, out var workspaceId))
        {
            await WriteProblemDetails(context, "X-Workspace-Id header must be a valid GUID.");
            return;
        }

        var tenantContext = context.RequestServices.GetRequiredService<ITenantContext>();
        tenantContext.WorkspaceId = workspaceId;

        await next(context);
    }

    private static bool ShouldSkip(string path)
    {
        if (path.Equals("/api/v1/workspaces", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/api/v1/workspaces/", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (path.StartsWith("/api/v1/intake/", StringComparison.OrdinalIgnoreCase)
            && path.EndsWith("/submit", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        foreach (var prefix in GlobalPrefixes)
        {
            if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static bool TryResolveWorkspaceFromRoute(string path, out Guid workspaceId)
    {
        workspaceId = Guid.Empty;

        const string prefix = "/api/v1/workspaces/";
        if (!path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var remainder = path[prefix.Length..];
        if (string.IsNullOrWhiteSpace(remainder))
        {
            return false;
        }

        var candidate = remainder.Split('/', StringSplitOptions.RemoveEmptyEntries)[0];
        return Guid.TryParse(candidate, out workspaceId);
    }

    private static async Task WriteProblemDetails(HttpContext context, string detail)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Bad Request",
            Detail = detail,
            Instance = context.Request.Path,
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
