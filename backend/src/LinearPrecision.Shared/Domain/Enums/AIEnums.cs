namespace LinearPrecision.Shared.Domain.Enums;

public enum AIMessageRole
{
    System,
    User,
    Assistant,
    Tool
}

public enum AIToolInvocationStatus
{
    Pending,
    Running,
    Completed,
    Failed
}
