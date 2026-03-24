using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinearPrecision.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixMembershipRoleDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "role",
                table: "memberships",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Member");

            migrationBuilder.Sql(
                """
                UPDATE memberships AS membership
                SET role = 'Owner'
                FROM workspaces AS workspace
                WHERE membership.workspace_id = workspace.id
                  AND membership.user_id = workspace.created_by
                  AND membership.is_active = TRUE
                  AND membership.role = 'Member'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM memberships AS owner_membership
                      WHERE owner_membership.workspace_id = membership.workspace_id
                        AND owner_membership.is_active = TRUE
                        AND owner_membership.role = 'Owner'
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "role",
                table: "memberships",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Member",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);
        }
    }
}
