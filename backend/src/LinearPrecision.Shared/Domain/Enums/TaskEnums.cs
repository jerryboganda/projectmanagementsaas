namespace LinearPrecision.Shared.Domain.Enums;

public enum TaskItemStatus
{
    Backlog,
    Todo,
    InProgress,
    InReview,
    Done,
    Cancelled
}

public enum TaskPriority
{
    None,
    Low,
    Medium,
    High,
    Urgent
}

public enum DependencyType
{
    FinishToStart,
    StartToStart,
    FinishToFinish,
    StartToFinish
}
