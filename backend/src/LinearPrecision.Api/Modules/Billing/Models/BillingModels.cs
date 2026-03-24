using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Billing.Models;

public sealed record PlanResponse(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    decimal MonthlyPricePerSeat,
    decimal AnnualPricePerSeat,
    int MaxMembers,
    int MaxProjects,
    long MaxStorageBytes,
    int MaxAutomations,
    bool IsActive,
    int SortOrder,
    DateTime CreatedAt);

public sealed record SubscriptionResponse(
    Guid Id,
    Guid WorkspaceId,
    PlanResponse Plan,
    SubscriptionStatus Status,
    DateTime CurrentPeriodStart,
    DateTime CurrentPeriodEnd,
    DateTime? CancelledAt,
    DateTime? TrialEnd,
    int SeatCount,
    int SeatLimit,
    DateTime CreatedAt);

public sealed record CreateSubscriptionRequest(Guid PlanId, string BillingCycle);

public sealed record UpdateSubscriptionRequest(Guid PlanId, string BillingCycle);

public sealed record UsageRecordResponse(
    Guid Id,
    string MetricName,
    long Value,
    DateTime RecordedAt,
    string Period);

public sealed record UsageSummaryResponse(
    int CurrentMembers,
    int MaxMembers,
    int CurrentProjects,
    int MaxProjects,
    long CurrentStorageBytes,
    long MaxStorageBytes,
    int CurrentAutomations,
    int MaxAutomations);

// ── Stripe Checkout / Portal DTOs ──

public sealed record CreateCheckoutSessionRequest(
    Guid PlanId,
    string BillingCycle,
    int SeatCount = 1,
    string? SuccessUrl = null,
    string? CancelUrl = null);

public sealed record CheckoutSessionResponse(
    string SessionId,
    string Url);

public sealed record CreatePortalSessionRequest(
    string? ReturnUrl = null);

public sealed record PortalSessionResponse(
    string SessionId,
    string Url);
