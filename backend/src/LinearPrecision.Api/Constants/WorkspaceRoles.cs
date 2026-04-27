namespace LinearPrecision.Api.Constants;

/// <summary>
/// Authorization policy names for workspace role-based access.
/// These map to policies registered in <c>Program.cs</c>.
/// </summary>
public static class WorkspaceRoles
{
    public const string Owner = "WorkspaceOwner";
    public const string Admin = "WorkspaceAdmin";
    public const string Member = "WorkspaceMember";
    public const string Guest = "WorkspaceGuest";
}
