using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinearPrecision.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM usage_records
                WHERE id IN (
                    SELECT id
                    FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY workspace_id, metric_name, period
                                   ORDER BY updated_at DESC, created_at DESC, id DESC
                               ) AS duplicate_rank
                        FROM usage_records
                    ) ranked_usage_records
                    WHERE duplicate_rank > 1
                );
                """);

            migrationBuilder.DropIndex(
                name: "ix_usage_records_workspace_id_metric_name_period",
                table: "usage_records");

            migrationBuilder.CreateIndex(
                name: "ix_workspaces_deleted_at",
                table: "workspaces",
                column: "deleted_at",
                filter: "is_deleted = true");

            migrationBuilder.CreateIndex(
                name: "ix_usage_records_workspace_id_metric_name_period",
                table: "usage_records",
                columns: new[] { "workspace_id", "metric_name", "period" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_start_time_running",
                table: "time_entries",
                column: "start_time",
                filter: "end_time IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_deleted_at",
                table: "task_items",
                column: "deleted_at",
                filter: "is_deleted = true");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_assignee_id_created_at",
                table: "task_items",
                columns: new[] { "workspace_id", "assignee_id", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_project_id_created_at",
                table: "task_items",
                columns: new[] { "workspace_id", "project_id", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "ix_task_comments_deleted_at",
                table: "task_comments",
                column: "deleted_at",
                filter: "is_deleted = true");

            migrationBuilder.CreateIndex(
                name: "ix_task_checklist_items_task_id_is_completed",
                table: "task_checklist_items",
                columns: new[] { "task_id", "is_completed" });

            migrationBuilder.CreateIndex(
                name: "ix_request_forms_slug_is_active",
                table: "request_forms",
                columns: new[] { "slug", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_projects_deleted_at",
                table: "projects",
                column: "deleted_at",
                filter: "is_deleted = true");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_recipient_unread_email_unsent_created_at",
                table: "notifications",
                columns: new[] { "recipient_id", "created_at" },
                descending: new[] { false, true },
                filter: "is_read = false AND email_sent = false");

            migrationBuilder.CreateIndex(
                name: "ix_notification_preferences_user_id_email_enabled",
                table: "notification_preferences",
                column: "user_id",
                filter: "email = true");

            migrationBuilder.CreateIndex(
                name: "ix_invitations_status_expires_at",
                table: "invitations",
                columns: new[] { "status", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "ix_initiatives_deleted_at",
                table: "initiatives",
                column: "deleted_at",
                filter: "is_deleted = true");

            migrationBuilder.CreateIndex(
                name: "ix_goals_deleted_at",
                table: "goals",
                column: "deleted_at",
                filter: "is_deleted = true");

            migrationBuilder.CreateIndex(
                name: "ix_documents_deleted_at",
                table: "documents",
                column: "deleted_at",
                filter: "is_deleted = true");

            migrationBuilder.CreateIndex(
                name: "ix_documents_parent_document_id_is_deleted_sort_order",
                table: "documents",
                columns: new[] { "parent_document_id", "is_deleted", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_documents_workspace_id_project_id_created_at",
                table: "documents",
                columns: new[] { "workspace_id", "project_id", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "ix_audit_events_workspace_id_action_created_at",
                table: "audit_events",
                columns: new[] { "workspace_id", "action", "created_at" },
                descending: new[] { false, false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "ix_workspaces_deleted_at", table: "workspaces");
            migrationBuilder.DropIndex(name: "ix_usage_records_workspace_id_metric_name_period", table: "usage_records");
            migrationBuilder.DropIndex(name: "ix_time_entries_start_time_running", table: "time_entries");
            migrationBuilder.DropIndex(name: "ix_task_items_deleted_at", table: "task_items");
            migrationBuilder.DropIndex(name: "ix_task_items_workspace_id_assignee_id_created_at", table: "task_items");
            migrationBuilder.DropIndex(name: "ix_task_items_workspace_id_project_id_created_at", table: "task_items");
            migrationBuilder.DropIndex(name: "ix_task_comments_deleted_at", table: "task_comments");
            migrationBuilder.DropIndex(name: "ix_task_checklist_items_task_id_is_completed", table: "task_checklist_items");
            migrationBuilder.DropIndex(name: "ix_request_forms_slug_is_active", table: "request_forms");
            migrationBuilder.DropIndex(name: "ix_projects_deleted_at", table: "projects");
            migrationBuilder.DropIndex(name: "ix_notifications_recipient_unread_email_unsent_created_at", table: "notifications");
            migrationBuilder.DropIndex(name: "ix_notification_preferences_user_id_email_enabled", table: "notification_preferences");
            migrationBuilder.DropIndex(name: "ix_invitations_status_expires_at", table: "invitations");
            migrationBuilder.DropIndex(name: "ix_initiatives_deleted_at", table: "initiatives");
            migrationBuilder.DropIndex(name: "ix_goals_deleted_at", table: "goals");
            migrationBuilder.DropIndex(name: "ix_documents_deleted_at", table: "documents");
            migrationBuilder.DropIndex(name: "ix_documents_parent_document_id_is_deleted_sort_order", table: "documents");
            migrationBuilder.DropIndex(name: "ix_documents_workspace_id_project_id_created_at", table: "documents");
            migrationBuilder.DropIndex(name: "ix_audit_events_workspace_id_action_created_at", table: "audit_events");

            migrationBuilder.CreateIndex(
                name: "ix_usage_records_workspace_id_metric_name_period",
                table: "usage_records",
                columns: new[] { "workspace_id", "metric_name", "period" });
        }
    }
}
