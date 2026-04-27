using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinearPrecision.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQueryPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_task_watchers_task_id_created_at",
                table: "task_watchers",
                columns: new[] { "task_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_sprints_project_id_created_at",
                table: "sprints",
                columns: new[] { "project_id", "created_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_projects_workspace_id_name",
                table: "projects",
                columns: new[] { "workspace_id", "name" });

            migrationBuilder.CreateIndex(
                name: "ix_projects_workspace_id_sort_order",
                table: "projects",
                columns: new[] { "workspace_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_notifications_recipient_id_is_archived_created_at",
                table: "notifications",
                columns: new[] { "recipient_id", "is_archived", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "ix_goals_workspace_id_created_at",
                table: "goals",
                columns: new[] { "workspace_id", "created_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_goals_workspace_id_title",
                table: "goals",
                columns: new[] { "workspace_id", "title" });

            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            migrationBuilder.Sql(
                """
                CREATE INDEX IF NOT EXISTS ix_task_items_title_trgm
                ON task_items USING gin (title gin_trgm_ops);
                """);

            migrationBuilder.Sql(
                """
                CREATE INDEX IF NOT EXISTS ix_projects_name_trgm
                ON projects USING gin (name gin_trgm_ops);
                """);

            migrationBuilder.Sql(
                """
                CREATE INDEX IF NOT EXISTS ix_documents_title_trgm
                ON documents USING gin (title gin_trgm_ops);
                """);

            migrationBuilder.Sql(
                """
                CREATE INDEX IF NOT EXISTS ix_goals_title_trgm
                ON goals USING gin (title gin_trgm_ops);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_goals_title_trgm;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_documents_title_trgm;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_projects_name_trgm;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_task_items_title_trgm;");

            migrationBuilder.DropIndex(
                name: "ix_goals_workspace_id_title",
                table: "goals");

            migrationBuilder.DropIndex(
                name: "ix_goals_workspace_id_created_at",
                table: "goals");

            migrationBuilder.DropIndex(
                name: "ix_notifications_recipient_id_is_archived_created_at",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "ix_projects_workspace_id_sort_order",
                table: "projects");

            migrationBuilder.DropIndex(
                name: "ix_projects_workspace_id_name",
                table: "projects");

            migrationBuilder.DropIndex(
                name: "ix_sprints_project_id_created_at",
                table: "sprints");

            migrationBuilder.DropIndex(
                name: "ix_task_watchers_task_id_created_at",
                table: "task_watchers");
        }
    }
}
