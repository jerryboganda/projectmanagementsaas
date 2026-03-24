using FluentValidation;
using LinearPrecision.Shared.Domain;
using Microsoft.AspNetCore.Mvc;

namespace LinearPrecision.Api.Infrastructure.Middleware;

public sealed class GlobalExceptionMiddleware : IMiddleware
{
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public GlobalExceptionMiddleware(
        ILogger<GlobalExceptionMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation failure on {Path}", context.Request.Path);
            await WriteValidationProblemDetails(context, ex);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Not found on {Path}", context.Request.Path);
            await WriteProblemDetails(context, StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (ForbiddenException ex)
        {
            _logger.LogWarning(ex, "Forbidden on {Path}", context.Request.Path);
            await WriteProblemDetails(context, StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (ConflictException ex)
        {
            _logger.LogWarning(ex, "Conflict on {Path}", context.Request.Path);
            await WriteProblemDetails(context, StatusCodes.Status409Conflict, "Conflict", ex.Message);
        }
        catch (BadRequestException ex)
        {
            _logger.LogWarning(ex, "Bad request on {Path}", context.Request.Path);
            await WriteProblemDetails(context, StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Path}", context.Request.Path);

            var detail = _environment.IsDevelopment()
                ? ex.ToString()
                : "An unexpected error occurred. Please try again later.";

            await WriteProblemDetails(context, StatusCodes.Status500InternalServerError, "Internal Server Error", detail);
        }
    }

    private static async Task WriteProblemDetails(
        HttpContext context, int statusCode, string title, string detail)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path,
        };

        await context.Response.WriteAsJsonAsync(problem);
    }

    private static async Task WriteValidationProblemDetails(HttpContext context, ValidationException ex)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        context.Response.ContentType = "application/problem+json";

        var errors = ex.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());

        var problem = new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Validation Failed",
            Detail = "One or more validation errors occurred.",
            Instance = context.Request.Path,
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
