using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Billing.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace LinearPrecision.Api.Modules.Billing.Endpoints;

public static class StripeEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/billing")
            .WithTags("Stripe Billing");

        group.MapPost("/checkout", CreateCheckoutSession)
            .WithName("CreateCheckoutSession")
            .RequireAuthorization("WorkspaceAdmin")
            .Produces<CheckoutSessionResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPost("/portal", CreatePortalSession)
            .WithName("CreateBillingPortalSession")
            .RequireAuthorization("WorkspaceAdmin")
            .Produces<PortalSessionResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPost("/webhook", HandleWebhook)
            .WithName("StripeWebhook")
            .AllowAnonymous();
    }

    // ── POST /api/v1/billing/checkout ──
    private static async Task<IResult> CreateCheckoutSession(
        CreateCheckoutSessionRequest request,
        AppDbContext db,
        ITenantContext tenantContext,
        IConfiguration config,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId
            ?? throw new UnauthorizedAccessException("No workspace context.");

        // Validate plan exists
        var plan = await db.Plans.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PlanId && p.IsActive, ct);

        if (plan is null)
        {
            return Results.Problem(
                title: "Bad Request",
                detail: $"Plan with id '{request.PlanId}' was not found or is inactive.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var stripeApiKey = config["Stripe:SecretKey"] ?? string.Empty;
        StripeConfiguration.ApiKey = stripeApiKey;

        // Resolve or create Stripe customer
        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.WorkspaceId == workspaceId, ct);

        var customerId = subscription?.StripeCustomerId;

        if (string.IsNullOrEmpty(customerId))
        {
            var workspace = await db.Workspaces.AsNoTracking()
                .FirstOrDefaultAsync(w => w.Id == workspaceId, ct);

            var customerService = new CustomerService();
            var customer = await customerService.CreateAsync(new CustomerCreateOptions
            {
                Name = workspace?.Name ?? "Workspace",
                Metadata = new Dictionary<string, string>
                {
                    ["workspace_id"] = workspaceId.ToString()
                }
            }, cancellationToken: ct);

            customerId = customer.Id;
        }

        var priceAmount = request.BillingCycle.Equals("annual", StringComparison.OrdinalIgnoreCase)
            ? plan.AnnualPricePerSeat
            : plan.MonthlyPricePerSeat;

        var sessionService = new SessionService();
        var session = await sessionService.CreateAsync(new SessionCreateOptions
        {
            Customer = customerId,
            Mode = "subscription",
            LineItems =
            [
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = (long)(priceAmount * 100), // Stripe uses cents
                        Recurring = new SessionLineItemPriceDataRecurringOptions
                        {
                            Interval = request.BillingCycle.Equals("annual", StringComparison.OrdinalIgnoreCase)
                                ? "year"
                                : "month"
                        },
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Linear Precision — {plan.Name}"
                        }
                    },
                    Quantity = request.SeatCount > 0 ? request.SeatCount : 1
                }
            ],
            SuccessUrl = request.SuccessUrl ?? config["Stripe:SuccessUrl"] ?? "http://localhost:3000/settings/billing?success=true",
            CancelUrl = request.CancelUrl ?? config["Stripe:CancelUrl"] ?? "http://localhost:3000/settings/billing?cancelled=true",
            Metadata = new Dictionary<string, string>
            {
                ["workspace_id"] = workspaceId.ToString(),
                ["plan_id"] = plan.Id.ToString()
            }
        }, cancellationToken: ct);

        return Results.Ok(new CheckoutSessionResponse(session.Id, session.Url));
    }

    // ── POST /api/v1/billing/portal ──
    private static async Task<IResult> CreatePortalSession(
        CreatePortalSessionRequest request,
        AppDbContext db,
        ITenantContext tenantContext,
        IConfiguration config,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId
            ?? throw new UnauthorizedAccessException("No workspace context.");

        var stripeApiKey = config["Stripe:SecretKey"] ?? string.Empty;
        StripeConfiguration.ApiKey = stripeApiKey;

        // Get existing subscription to find Stripe customer
        var subscription = await db.Subscriptions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.WorkspaceId == workspaceId, ct);

        if (subscription?.StripeCustomerId is null)
        {
            return Results.Problem(
                title: "Bad Request",
                detail: "No Stripe customer found for this workspace. Create a subscription first.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var portalService = new Stripe.BillingPortal.SessionService();
        var session = await portalService.CreateAsync(new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = subscription.StripeCustomerId,
            ReturnUrl = request.ReturnUrl ?? config["Stripe:ReturnUrl"] ?? "http://localhost:3000/settings/billing"
        }, cancellationToken: ct);

        return Results.Ok(new PortalSessionResponse(session.Id, session.Url));
    }

    // ── POST /api/v1/billing/webhook ──
    private static async Task<IResult> HandleWebhook(
        HttpRequest httpRequest,
        AppDbContext db,
        IConfiguration config,
        CancellationToken ct)
    {
        var webhookSecret = config["Stripe:WebhookSecret"] ?? string.Empty;
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"] ?? string.Empty;

        var json = await new StreamReader(httpRequest.Body).ReadToEndAsync(ct);

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                json,
                httpRequest.Headers["Stripe-Signature"],
                webhookSecret);
        }
        catch (StripeException)
        {
            return Results.Problem(
                title: "Bad Request",
                detail: "Invalid Stripe webhook signature.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        switch (stripeEvent.Type)
        {
            case Stripe.Events.CheckoutSessionCompleted:
                await HandleCheckoutCompleted(stripeEvent, db, ct);
                break;

            case Stripe.Events.InvoicePaid:
                await HandleInvoicePaid(stripeEvent, db, ct);
                break;

            case Stripe.Events.InvoicePaymentFailed:
                await HandleInvoicePaymentFailed(stripeEvent, db, ct);
                break;

            case Stripe.Events.CustomerSubscriptionUpdated:
                await HandleSubscriptionUpdated(stripeEvent, db, ct);
                break;

            case Stripe.Events.CustomerSubscriptionDeleted:
                await HandleSubscriptionDeleted(stripeEvent, db, ct);
                break;
        }

        return Results.Ok(new { received = true });
    }

    // ── Webhook event handlers ──

    private static async Task HandleCheckoutCompleted(Event stripeEvent, AppDbContext db, CancellationToken ct)
    {
        var session = stripeEvent.Data.Object as Session;
        if (session is null) return;

        var workspaceIdStr = session.Metadata.GetValueOrDefault("workspace_id");
        var planIdStr = session.Metadata.GetValueOrDefault("plan_id");

        if (!Guid.TryParse(workspaceIdStr, out var workspaceId) ||
            !Guid.TryParse(planIdStr, out var planId))
            return;

        var plan = await db.Plans.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == planId, ct);

        if (plan is null) return;

        var existing = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.WorkspaceId == workspaceId, ct);

        var now = DateTime.UtcNow;

        if (existing is not null)
        {
            existing.PlanId = planId;
            existing.StripeCustomerId = session.CustomerId;
            existing.StripeSubscriptionId = session.SubscriptionId;
            existing.Status = SubscriptionStatus.Active;
            existing.CurrentPeriodStart = now;
            existing.CurrentPeriodEnd = now.AddMonths(1); // will be corrected by subscription.updated event
            existing.SeatLimit = plan.MaxMembers;
            existing.UpdatedAt = now;
        }
        else
        {
            db.Subscriptions.Add(new Entities.Subscription
            {
                Id = Guid.CreateVersion7(),
                WorkspaceId = workspaceId,
                PlanId = planId,
                StripeCustomerId = session.CustomerId,
                StripeSubscriptionId = session.SubscriptionId,
                Status = SubscriptionStatus.Active,
                CurrentPeriodStart = now,
                CurrentPeriodEnd = now.AddMonths(1),
                SeatCount = 1,
                SeatLimit = plan.MaxMembers,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task HandleInvoicePaid(Event stripeEvent, AppDbContext db, CancellationToken ct)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice?.SubscriptionId is null) return;

        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == invoice.SubscriptionId, ct);

        if (subscription is null) return;

        subscription.Status = SubscriptionStatus.Active;
        subscription.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static async Task HandleInvoicePaymentFailed(Event stripeEvent, AppDbContext db, CancellationToken ct)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice?.SubscriptionId is null) return;

        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == invoice.SubscriptionId, ct);

        if (subscription is null) return;

        subscription.Status = SubscriptionStatus.PastDue;
        subscription.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static async Task HandleSubscriptionUpdated(Event stripeEvent, AppDbContext db, CancellationToken ct)
    {
        var stripeSub = stripeEvent.Data.Object as Stripe.Subscription;
        if (stripeSub is null) return;

        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSub.Id, ct);

        if (subscription is null) return;

        subscription.CurrentPeriodStart = stripeSub.CurrentPeriodStart;
        subscription.CurrentPeriodEnd = stripeSub.CurrentPeriodEnd;
        subscription.Status = MapStripeStatus(stripeSub.Status);
        subscription.CancelledAt = stripeSub.CanceledAt;
        subscription.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static async Task HandleSubscriptionDeleted(Event stripeEvent, AppDbContext db, CancellationToken ct)
    {
        var stripeSub = stripeEvent.Data.Object as Stripe.Subscription;
        if (stripeSub is null) return;

        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSub.Id, ct);

        if (subscription is null) return;

        subscription.Status = SubscriptionStatus.Cancelled;
        subscription.CancelledAt = DateTime.UtcNow;
        subscription.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static SubscriptionStatus MapStripeStatus(string status) => status switch
    {
        "active" => SubscriptionStatus.Active,
        "trialing" => SubscriptionStatus.Trialing,
        "past_due" => SubscriptionStatus.PastDue,
        "canceled" or "cancelled" => SubscriptionStatus.Cancelled,
        "unpaid" => SubscriptionStatus.PastDue,
        _ => SubscriptionStatus.Active
    };
}
