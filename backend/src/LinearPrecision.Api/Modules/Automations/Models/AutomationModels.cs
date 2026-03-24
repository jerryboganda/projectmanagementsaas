using System.Text.Json;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Automations.Models;

public sealed record CreateAutomationRuleRequest(
    string Name,
    string? Description,
    bool? IsActive,
    JsonDocument Trigger,
    JsonDocument Action,
    Guid? ProjectId);

public sealed record UpdateAutomationRuleRequest(
    string Name,
    string? Description,
    bool? IsActive,
    JsonDocument Trigger,
    JsonDocument Action,
    Guid? ProjectId);

public sealed record AutomationRuleResponse(
    Guid Id,
    string Name,
    string? Description,
    bool IsActive,
    JsonDocument Trigger,
    JsonDocument Action,
    Guid? ProjectId,
    int ExecutionCount,
    DateTime? LastExecutedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record AutomationLogResponse(
    Guid Id,
    Guid AutomationRuleId,
    AutomationLogStatus Status,
    string? TriggerData,
    string? ActionResult,
    string? ErrorMessage,
    TimeSpan ExecutionDuration,
    DateTime CreatedAt);
