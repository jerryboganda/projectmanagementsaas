namespace LinearPrecision.Shared.Domain.Enums;

public enum GoalStatus
{
    OnTrack,
    AtRisk,
    OffTrack,
    Completed,
    Cancelled
}

public enum GoalType
{
    Objective,
    KeyResult
}

public enum GoalProgressSource
{
    Manual,
    LinkedProjects,
    LinkedTasks
}

public enum InitiativeStatus
{
    Planned,
    InProgress,
    Completed,
    Cancelled
}
