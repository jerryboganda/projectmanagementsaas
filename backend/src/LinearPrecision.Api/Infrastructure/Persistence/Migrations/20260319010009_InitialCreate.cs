using System;
using System.Collections.Generic;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LinearPrecision.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    concurrency_stamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    avatar_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    timezone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    locale = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    job_title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    last_login_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_login_ip = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    user_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_user_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: true),
                    security_stamp = table.Column<string>(type: "text", nullable: true),
                    concurrency_stamp = table.Column<string>(type: "text", nullable: true),
                    phone_number = table.Column<string>(type: "text", nullable: true),
                    phone_number_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    two_factor_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    lockout_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    lockout_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    access_failed_count = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    monthly_price_per_seat = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    annual_price_per_seat = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    stripe_price_id_monthly = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    stripe_price_id_annual = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    max_members = table.Column<int>(type: "integer", nullable: false, defaultValue: -1),
                    max_projects = table.Column<int>(type: "integer", nullable: false, defaultValue: -1),
                    max_storage_bytes = table.Column<long>(type: "bigint", nullable: false, defaultValue: -1L),
                    max_automations = table.Column<int>(type: "integer", nullable: false, defaultValue: -1),
                    features = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_plans", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_role_claims", x => x.id);
                    table.ForeignKey(
                        name: "fk_asp_net_role_claims_asp_net_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "AspNetRoles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_user_claims", x => x.id);
                    table.ForeignKey(
                        name: "fk_asp_net_user_claims_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    login_provider = table.Column<string>(type: "text", nullable: false),
                    provider_key = table.Column<string>(type: "text", nullable: false),
                    provider_display_name = table.Column<string>(type: "text", nullable: true),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_user_logins", x => new { x.login_provider, x.provider_key });
                    table.ForeignKey(
                        name: "fk_asp_net_user_logins_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_user_roles", x => new { x.user_id, x.role_id });
                    table.ForeignKey(
                        name: "fk_asp_net_user_roles_asp_net_roles_role_id",
                        column: x => x.role_id,
                        principalTable: "AspNetRoles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_asp_net_user_roles_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    login_provider = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_user_tokens", x => new { x.user_id, x.login_provider, x.name });
                    table.ForeignKey(
                        name: "fk_asp_net_user_tokens_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "project_templates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    icon_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    template_data = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    is_system_template = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_project_templates", x => x.id);
                    table.ForeignKey(
                        name: "fk_project_templates_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_project_templates_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "workspaces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    logo_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    domain = table.Column<string>(type: "character varying(253)", maxLength: 253, nullable: true),
                    settings = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    subscription_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_workspaces", x => x.id);
                    table.ForeignKey(
                        name: "fk_workspaces_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_workspaces_asp_net_users_deleted_by",
                        column: x => x.deleted_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_workspaces_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ai_conversations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    model = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    message_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    total_tokens_used = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ai_conversations", x => x.id);
                    table.ForeignKey(
                        name: "fk_ai_conversations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_ai_conversations_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    old_values = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    new_values = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_audit_events", x => x.id);
                    table.ForeignKey(
                        name: "fk_audit_events_users_actor_id",
                        column: x => x.actor_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_audit_events_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "feature_flags",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: true),
                    rollout_percentage = table.Column<int>(type: "integer", nullable: true),
                    conditions = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_feature_flags", x => x.id);
                    table.ForeignKey(
                        name: "fk_feature_flags_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "file_attachments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    storage_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    thumbnail_key = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    uploaded_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_file_attachments", x => x.id);
                    table.ForeignKey(
                        name: "fk_file_attachments_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_file_attachments_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_file_attachments_asp_net_users_uploaded_by",
                        column: x => x.uploaded_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_file_attachments_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "goals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    progress_percent = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    progress_source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    target_date = table.Column<DateOnly>(type: "date", nullable: true),
                    parent_goal_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_goals", x => x.id);
                    table.ForeignKey(
                        name: "fk_goals_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_goals_asp_net_users_deleted_by",
                        column: x => x.deleted_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_goals_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_goals_goals_parent_goal_id",
                        column: x => x.parent_goal_id,
                        principalTable: "goals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_goals_users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_goals_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invitations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Member"),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    invited_by = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    project_ids = table.Column<List<Guid>>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_invitations", x => x.id);
                    table.ForeignKey(
                        name: "fk_invitations_asp_net_users_invited_by",
                        column: x => x.invited_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_invitations_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "memberships",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Member"),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    left_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    workspace_display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    workspace_avatar_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_memberships", x => x.id);
                    table.ForeignKey(
                        name: "fk_memberships_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_memberships_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notification_preferences",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    in_app = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    email = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    push = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notification_preferences", x => x.id);
                    table.ForeignKey(
                        name: "fk_notification_preferences_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_notification_preferences_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    body = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    entity_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    actor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    is_archived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    email_sent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    email_sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notifications", x => x.id);
                    table.ForeignKey(
                        name: "fk_notifications_users_actor_id",
                        column: x => x.actor_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_notifications_users_recipient_id",
                        column: x => x.recipient_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_notifications_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "projects",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    identifier = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    icon_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    visibility = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    lead_id = table.Column<Guid>(type: "uuid", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    target_date = table.Column<DateOnly>(type: "date", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    metadata = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_projects", x => x.id);
                    table.ForeignKey(
                        name: "fk_projects_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_projects_asp_net_users_deleted_by",
                        column: x => x.deleted_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_projects_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_projects_users_lead_id",
                        column: x => x.lead_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_projects_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "subscriptions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    stripe_customer_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    stripe_subscription_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    current_period_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    current_period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    trial_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    seat_count = table.Column<int>(type: "integer", nullable: false),
                    seat_limit = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "fk_subscriptions_plans_plan_id",
                        column: x => x.plan_id,
                        principalTable: "plans",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_subscriptions_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "usage_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    metric_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    value = table.Column<long>(type: "bigint", nullable: false),
                    recorded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    period = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usage_records", x => x.id);
                    table.ForeignKey(
                        name: "fk_usage_records_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    tokens_used = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ai_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_ai_messages_ai_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "ai_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_ai_messages_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "initiatives",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    goal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    target_date = table.Column<DateOnly>(type: "date", nullable: true),
                    progress_percent = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_initiatives", x => x.id);
                    table.ForeignKey(
                        name: "fk_initiatives_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_initiatives_asp_net_users_deleted_by",
                        column: x => x.deleted_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_initiatives_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_initiatives_goals_goal_id",
                        column: x => x.goal_id,
                        principalTable: "goals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_initiatives_users_owner_id",
                        column: x => x.owner_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "automation_rules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    trigger = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    action = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: true),
                    execution_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_executed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_automation_rules", x => x.id);
                    table.ForeignKey(
                        name: "fk_automation_rules_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_automation_rules_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_automation_rules_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_automation_rules_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "text", nullable: true),
                    content_format = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "tiptap-json"),
                    project_id = table.Column<Guid>(type: "uuid", nullable: true),
                    parent_document_id = table.Column<Guid>(type: "uuid", nullable: true),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_published = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_documents", x => x.id);
                    table.ForeignKey(
                        name: "fk_documents_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_documents_asp_net_users_deleted_by",
                        column: x => x.deleted_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_documents_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_documents_documents_parent_document_id",
                        column: x => x.parent_document_id,
                        principalTable: "documents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_documents_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_documents_users_creator_id",
                        column: x => x.creator_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_documents_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "goal_project_links",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    goal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_goal_project_links", x => x.id);
                    table.ForeignKey(
                        name: "fk_goal_project_links_goals_goal_id",
                        column: x => x.goal_id,
                        principalTable: "goals",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_goal_project_links_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "project_favorites",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_project_favorites", x => x.id);
                    table.ForeignKey(
                        name: "fk_project_favorites_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_project_favorites_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "request_forms",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    form_schema = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    default_project_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_request_forms", x => x.id);
                    table.ForeignKey(
                        name: "fk_request_forms_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_request_forms_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_request_forms_projects_default_project_id",
                        column: x => x.default_project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_request_forms_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sprints",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    goal = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Planned"),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    planned_points = table.Column<int>(type: "integer", nullable: true),
                    completed_points = table.Column<int>(type: "integer", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sprints", x => x.id);
                    table.CheckConstraint("chk_sprint_dates", "end_date > start_date");
                    table.ForeignKey(
                        name: "fk_sprints_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_sprints_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_sprints_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_tool_invocations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    message_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tool_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    input = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    output = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    duration = table.Column<TimeSpan>(type: "interval", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ai_tool_invocations", x => x.id);
                    table.ForeignKey(
                        name: "fk_ai_tool_invocations_ai_messages_message_id",
                        column: x => x.message_id,
                        principalTable: "ai_messages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "initiative_milestones",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    initiative_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    target_date = table.Column<DateOnly>(type: "date", nullable: true),
                    is_completed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_initiative_milestones", x => x.id);
                    table.ForeignKey(
                        name: "fk_initiative_milestones_initiatives_initiative_id",
                        column: x => x.initiative_id,
                        principalTable: "initiatives",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_initiative_milestones_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "automation_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    automation_rule_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Success"),
                    trigger_data = table.Column<string>(type: "text", nullable: true),
                    action_result = table.Column<string>(type: "text", nullable: true),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    execution_duration = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_automation_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_automation_logs_automation_rules_automation_rule_id",
                        column: x => x.automation_rule_id,
                        principalTable: "automation_rules",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_automation_logs_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "task_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    identifier = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    task_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    labels = table.Column<List<string>>(type: "jsonb", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    parent_task_id = table.Column<Guid>(type: "uuid", nullable: true),
                    assignee_id = table.Column<Guid>(type: "uuid", nullable: true),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    due_date = table.Column<DateOnly>(type: "date", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    estimate_points = table.Column<int>(type: "integer", nullable: true),
                    estimate_hours = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: true),
                    sprint_id = table.Column<Guid>(type: "uuid", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    custom_fields = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_task_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_task_items_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_items_asp_net_users_deleted_by",
                        column: x => x.deleted_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_items_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_items_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_task_items_sprints_sprint_id",
                        column: x => x.sprint_id,
                        principalTable: "sprints",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_items_task_items_parent_task_id",
                        column: x => x.parent_task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_items_users_assignee_id",
                        column: x => x.assignee_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_items_users_creator_id",
                        column: x => x.creator_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "calendar_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    start_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_all_day = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    recurrence_rule = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    linked_task_id = table.Column<Guid>(type: "uuid", nullable: true),
                    linked_project_id = table.Column<Guid>(type: "uuid", nullable: true),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_calendar_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_calendar_items_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_calendar_items_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_calendar_items_projects_linked_project_id",
                        column: x => x.linked_project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_calendar_items_task_items_linked_task_id",
                        column: x => x.linked_task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_calendar_items_users_creator_id",
                        column: x => x.creator_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "request_submissions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    request_form_id = table.Column<Guid>(type: "uuid", nullable: false),
                    data = table.Column<JsonDocument>(type: "jsonb", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "New"),
                    submitter_email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: true),
                    submitter_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    converted_to_task_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reviewed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    review_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_request_submissions", x => x.id);
                    table.ForeignKey(
                        name: "fk_request_submissions_asp_net_users_reviewed_by",
                        column: x => x.reviewed_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_request_submissions_request_forms_request_form_id",
                        column: x => x.request_form_id,
                        principalTable: "request_forms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_request_submissions_task_items_converted_to_task_id",
                        column: x => x.converted_to_task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_request_submissions_users_submitter_user_id",
                        column: x => x.submitter_user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_request_submissions_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "task_attachments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_attachment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    uploaded_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_task_attachments", x => x.id);
                    table.ForeignKey(
                        name: "fk_task_attachments_asp_net_users_uploaded_by",
                        column: x => x.uploaded_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_task_attachments_file_attachments_file_attachment_id",
                        column: x => x.file_attachment_id,
                        principalTable: "file_attachments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_task_attachments_task_items_task_id",
                        column: x => x.task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "task_checklist_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    is_completed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_task_checklist_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_task_checklist_items_asp_net_users_completed_by",
                        column: x => x.completed_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_checklist_items_task_items_task_id",
                        column: x => x.task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "task_comments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_id = table.Column<Guid>(type: "uuid", nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    is_edited = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    parent_comment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reactions = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_task_comments", x => x.id);
                    table.ForeignKey(
                        name: "fk_task_comments_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_comments_asp_net_users_deleted_by",
                        column: x => x.deleted_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_comments_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_task_comments_task_comments_parent_comment_id",
                        column: x => x.parent_comment_id,
                        principalTable: "task_comments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_task_comments_task_items_task_id",
                        column: x => x.task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_task_comments_users_author_id",
                        column: x => x.author_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "task_dependencies",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    depends_on_task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_task_dependencies", x => x.id);
                    table.CheckConstraint("chk_no_self_dependency", "task_id <> depends_on_task_id");
                    table.ForeignKey(
                        name: "fk_task_dependencies_task_items_depends_on_task_id",
                        column: x => x.depends_on_task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_task_dependencies_task_items_task_id",
                        column: x => x.task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "task_watchers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_task_watchers", x => x.id);
                    table.ForeignKey(
                        name: "fk_task_watchers_task_items_task_id",
                        column: x => x.task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_task_watchers_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "time_entries",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    task_id = table.Column<Guid>(type: "uuid", nullable: true),
                    project_id = table.Column<Guid>(type: "uuid", nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    start_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_billable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    hourly_rate = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    task_item_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_time_entries", x => x.id);
                    table.ForeignKey(
                        name: "fk_time_entries_asp_net_users_created_by",
                        column: x => x.created_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_time_entries_asp_net_users_updated_by",
                        column: x => x.updated_by,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_time_entries_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_time_entries_task_items_task_id",
                        column: x => x.task_id,
                        principalTable: "task_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_time_entries_task_items_task_item_id",
                        column: x => x.task_item_id,
                        principalTable: "task_items",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_time_entries_users_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_time_entries_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_ai_conversations_user_id",
                table: "ai_conversations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_ai_conversations_workspace_id_user_id_created_at",
                table: "ai_conversations",
                columns: new[] { "workspace_id", "user_id", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "ix_ai_messages_conversation_id_created_at",
                table: "ai_messages",
                columns: new[] { "conversation_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_ai_messages_workspace_id",
                table: "ai_messages",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_ai_tool_invocations_message_id",
                table: "ai_tool_invocations",
                column: "message_id");

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_role_claims_role_id",
                table: "AspNetRoleClaims",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "normalized_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_user_claims_user_id",
                table: "AspNetUserClaims",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_user_logins_user_id",
                table: "AspNetUserLogins",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_user_roles_role_id",
                table: "AspNetUserRoles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "normalized_email");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "normalized_user_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_audit_events_actor_id",
                table: "audit_events",
                column: "actor_id");

            migrationBuilder.CreateIndex(
                name: "ix_audit_events_created_at",
                table: "audit_events",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ix_audit_events_workspace_id_actor_id_created_at",
                table: "audit_events",
                columns: new[] { "workspace_id", "actor_id", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "ix_audit_events_workspace_id_entity_type_entity_id",
                table: "audit_events",
                columns: new[] { "workspace_id", "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "ix_automation_logs_automation_rule_id_created_at",
                table: "automation_logs",
                columns: new[] { "automation_rule_id", "created_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_automation_logs_workspace_id",
                table: "automation_logs",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_automation_rules_created_by",
                table: "automation_rules",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_automation_rules_project_id",
                table: "automation_rules",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "ix_automation_rules_updated_by",
                table: "automation_rules",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_automation_rules_workspace_id_is_active",
                table: "automation_rules",
                columns: new[] { "workspace_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_automation_rules_workspace_id_project_id",
                table: "automation_rules",
                columns: new[] { "workspace_id", "project_id" });

            migrationBuilder.CreateIndex(
                name: "ix_calendar_items_created_by",
                table: "calendar_items",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_calendar_items_creator_id",
                table: "calendar_items",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "ix_calendar_items_linked_project_id",
                table: "calendar_items",
                column: "linked_project_id");

            migrationBuilder.CreateIndex(
                name: "ix_calendar_items_linked_task_id",
                table: "calendar_items",
                column: "linked_task_id");

            migrationBuilder.CreateIndex(
                name: "ix_calendar_items_updated_by",
                table: "calendar_items",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_calendar_items_workspace_id_creator_id",
                table: "calendar_items",
                columns: new[] { "workspace_id", "creator_id" });

            migrationBuilder.CreateIndex(
                name: "ix_calendar_items_workspace_id_start_time_end_time",
                table: "calendar_items",
                columns: new[] { "workspace_id", "start_time", "end_time" });

            migrationBuilder.CreateIndex(
                name: "ix_documents_created_by",
                table: "documents",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_documents_creator_id",
                table: "documents",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "ix_documents_deleted_by",
                table: "documents",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_documents_parent_document_id",
                table: "documents",
                column: "parent_document_id");

            migrationBuilder.CreateIndex(
                name: "ix_documents_project_id",
                table: "documents",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "ix_documents_updated_by",
                table: "documents",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_documents_workspace_id_is_deleted",
                table: "documents",
                columns: new[] { "workspace_id", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "ix_documents_workspace_id_project_id",
                table: "documents",
                columns: new[] { "workspace_id", "project_id" });

            migrationBuilder.CreateIndex(
                name: "ix_feature_flags_key",
                table: "feature_flags",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_feature_flags_workspace_id",
                table: "feature_flags",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_file_attachments_created_by",
                table: "file_attachments",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_file_attachments_storage_key",
                table: "file_attachments",
                column: "storage_key");

            migrationBuilder.CreateIndex(
                name: "ix_file_attachments_updated_by",
                table: "file_attachments",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_file_attachments_uploaded_by",
                table: "file_attachments",
                column: "uploaded_by");

            migrationBuilder.CreateIndex(
                name: "ix_file_attachments_workspace_id_uploaded_by",
                table: "file_attachments",
                columns: new[] { "workspace_id", "uploaded_by" });

            migrationBuilder.CreateIndex(
                name: "ix_goal_project_links_goal_id_project_id",
                table: "goal_project_links",
                columns: new[] { "goal_id", "project_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_goal_project_links_project_id",
                table: "goal_project_links",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "ix_goal_project_links_workspace_id",
                table: "goal_project_links",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_goals_created_by",
                table: "goals",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_goals_deleted_by",
                table: "goals",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_goals_owner_id",
                table: "goals",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_goals_parent_goal_id",
                table: "goals",
                column: "parent_goal_id");

            migrationBuilder.CreateIndex(
                name: "ix_goals_updated_by",
                table: "goals",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_goals_workspace_id_is_deleted",
                table: "goals",
                columns: new[] { "workspace_id", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "ix_goals_workspace_id_owner_id",
                table: "goals",
                columns: new[] { "workspace_id", "owner_id" });

            migrationBuilder.CreateIndex(
                name: "ix_goals_workspace_id_status",
                table: "goals",
                columns: new[] { "workspace_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_initiative_milestones_initiative_id_sort_order",
                table: "initiative_milestones",
                columns: new[] { "initiative_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_initiative_milestones_workspace_id",
                table: "initiative_milestones",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_initiatives_created_by",
                table: "initiatives",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_initiatives_deleted_by",
                table: "initiatives",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_initiatives_goal_id",
                table: "initiatives",
                column: "goal_id");

            migrationBuilder.CreateIndex(
                name: "ix_initiatives_owner_id",
                table: "initiatives",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_initiatives_updated_by",
                table: "initiatives",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_initiatives_workspace_id_goal_id",
                table: "initiatives",
                columns: new[] { "workspace_id", "goal_id" });

            migrationBuilder.CreateIndex(
                name: "ix_initiatives_workspace_id_status",
                table: "initiatives",
                columns: new[] { "workspace_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_invitations_expires_at",
                table: "invitations",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_invitations_invited_by",
                table: "invitations",
                column: "invited_by");

            migrationBuilder.CreateIndex(
                name: "ix_invitations_token",
                table: "invitations",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_invitations_workspace_id_email_status",
                table: "invitations",
                columns: new[] { "workspace_id", "email", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_memberships_user_id",
                table: "memberships",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_memberships_workspace_id_role",
                table: "memberships",
                columns: new[] { "workspace_id", "role" });

            migrationBuilder.CreateIndex(
                name: "ix_memberships_workspace_id_user_id",
                table: "memberships",
                columns: new[] { "workspace_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notification_preferences_user_id_workspace_id_event_type",
                table: "notification_preferences",
                columns: new[] { "user_id", "workspace_id", "event_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_notification_preferences_workspace_id",
                table: "notification_preferences",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_actor_id",
                table: "notifications",
                column: "actor_id");

            migrationBuilder.CreateIndex(
                name: "ix_notifications_recipient_id_is_read_created_at",
                table: "notifications",
                columns: new[] { "recipient_id", "is_read", "created_at" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "ix_notifications_workspace_id",
                table: "notifications",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_plans_is_active",
                table: "plans",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "ix_plans_name",
                table: "plans",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_project_favorites_project_id",
                table: "project_favorites",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "ix_project_favorites_user_id_sort_order",
                table: "project_favorites",
                columns: new[] { "user_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_project_favorites_workspace_id_project_id_user_id",
                table: "project_favorites",
                columns: new[] { "workspace_id", "project_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_project_templates_created_by",
                table: "project_templates",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_project_templates_updated_by",
                table: "project_templates",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_project_templates_workspace_id",
                table: "project_templates",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_projects_created_by",
                table: "projects",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_projects_deleted_by",
                table: "projects",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_projects_lead_id",
                table: "projects",
                column: "lead_id");

            migrationBuilder.CreateIndex(
                name: "ix_projects_updated_by",
                table: "projects",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_projects_workspace_id_identifier",
                table: "projects",
                columns: new[] { "workspace_id", "identifier" },
                unique: true,
                filter: "NOT is_deleted");

            migrationBuilder.CreateIndex(
                name: "ix_projects_workspace_id_is_deleted",
                table: "projects",
                columns: new[] { "workspace_id", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "ix_projects_workspace_id_status",
                table: "projects",
                columns: new[] { "workspace_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_request_forms_created_by",
                table: "request_forms",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_request_forms_default_project_id",
                table: "request_forms",
                column: "default_project_id");

            migrationBuilder.CreateIndex(
                name: "ix_request_forms_updated_by",
                table: "request_forms",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_request_forms_workspace_id_is_active",
                table: "request_forms",
                columns: new[] { "workspace_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "ix_request_forms_workspace_id_slug",
                table: "request_forms",
                columns: new[] { "workspace_id", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_request_submissions_converted_to_task_id",
                table: "request_submissions",
                column: "converted_to_task_id");

            migrationBuilder.CreateIndex(
                name: "ix_request_submissions_request_form_id_status",
                table: "request_submissions",
                columns: new[] { "request_form_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_request_submissions_reviewed_by",
                table: "request_submissions",
                column: "reviewed_by");

            migrationBuilder.CreateIndex(
                name: "ix_request_submissions_submitter_user_id",
                table: "request_submissions",
                column: "submitter_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_request_submissions_workspace_id",
                table: "request_submissions",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_sprints_created_by",
                table: "sprints",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_sprints_project_id_active",
                table: "sprints",
                column: "project_id",
                unique: true,
                filter: "status = 'Active'");

            migrationBuilder.CreateIndex(
                name: "ix_sprints_updated_by",
                table: "sprints",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_sprints_workspace_id_project_id_status",
                table: "sprints",
                columns: new[] { "workspace_id", "project_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_sprints_workspace_id_status",
                table: "sprints",
                columns: new[] { "workspace_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_subscriptions_plan_id",
                table: "subscriptions",
                column: "plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_subscriptions_stripe_customer_id",
                table: "subscriptions",
                column: "stripe_customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_subscriptions_stripe_subscription_id",
                table: "subscriptions",
                column: "stripe_subscription_id");

            migrationBuilder.CreateIndex(
                name: "ix_subscriptions_workspace_id",
                table: "subscriptions",
                column: "workspace_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_task_attachments_file_attachment_id",
                table: "task_attachments",
                column: "file_attachment_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_attachments_task_id",
                table: "task_attachments",
                column: "task_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_attachments_uploaded_by",
                table: "task_attachments",
                column: "uploaded_by");

            migrationBuilder.CreateIndex(
                name: "ix_task_attachments_workspace_id",
                table: "task_attachments",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_checklist_items_completed_by",
                table: "task_checklist_items",
                column: "completed_by");

            migrationBuilder.CreateIndex(
                name: "ix_task_checklist_items_task_id_sort_order",
                table: "task_checklist_items",
                columns: new[] { "task_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_task_checklist_items_workspace_id",
                table: "task_checklist_items",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_comments_author_id",
                table: "task_comments",
                column: "author_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_comments_created_by",
                table: "task_comments",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_task_comments_deleted_by",
                table: "task_comments",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_task_comments_parent_comment_id",
                table: "task_comments",
                column: "parent_comment_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_comments_task_id_created_at",
                table: "task_comments",
                columns: new[] { "task_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_task_comments_updated_by",
                table: "task_comments",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_task_comments_workspace_id",
                table: "task_comments",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_dependencies_depends_on_task_id",
                table: "task_dependencies",
                column: "depends_on_task_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_dependencies_task_id_depends_on_task_id",
                table: "task_dependencies",
                columns: new[] { "task_id", "depends_on_task_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_task_dependencies_workspace_id",
                table: "task_dependencies",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_assignee_id",
                table: "task_items",
                column: "assignee_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_created_by",
                table: "task_items",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_creator_id",
                table: "task_items",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_deleted_by",
                table: "task_items",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_parent_task_id",
                table: "task_items",
                column: "parent_task_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_project_id",
                table: "task_items",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_sprint_id",
                table: "task_items",
                column: "sprint_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_updated_by",
                table: "task_items",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_assignee_id",
                table: "task_items",
                columns: new[] { "workspace_id", "assignee_id" });

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_due_date",
                table: "task_items",
                columns: new[] { "workspace_id", "due_date" });

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_identifier",
                table: "task_items",
                columns: new[] { "workspace_id", "identifier" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_is_deleted",
                table: "task_items",
                columns: new[] { "workspace_id", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_project_id_sort_order",
                table: "task_items",
                columns: new[] { "workspace_id", "project_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_project_id_status",
                table: "task_items",
                columns: new[] { "workspace_id", "project_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_task_items_workspace_id_sprint_id",
                table: "task_items",
                columns: new[] { "workspace_id", "sprint_id" });

            migrationBuilder.CreateIndex(
                name: "ix_task_watchers_task_id_user_id",
                table: "task_watchers",
                columns: new[] { "task_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_task_watchers_user_id",
                table: "task_watchers",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_task_watchers_workspace_id",
                table: "task_watchers",
                column: "workspace_id");

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_created_by",
                table: "time_entries",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_project_id",
                table: "time_entries",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_task_id",
                table: "time_entries",
                column: "task_id");

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_task_item_id",
                table: "time_entries",
                column: "task_item_id");

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_updated_by",
                table: "time_entries",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_user_id",
                table: "time_entries",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_workspace_id_project_id",
                table: "time_entries",
                columns: new[] { "workspace_id", "project_id" });

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_workspace_id_task_id",
                table: "time_entries",
                columns: new[] { "workspace_id", "task_id" });

            migrationBuilder.CreateIndex(
                name: "ix_time_entries_workspace_id_user_id_start_time",
                table: "time_entries",
                columns: new[] { "workspace_id", "user_id", "start_time" });

            migrationBuilder.CreateIndex(
                name: "ix_usage_records_workspace_id_metric_name_period",
                table: "usage_records",
                columns: new[] { "workspace_id", "metric_name", "period" });

            migrationBuilder.CreateIndex(
                name: "ix_workspaces_created_at",
                table: "workspaces",
                column: "created_at",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "ix_workspaces_created_by",
                table: "workspaces",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_workspaces_deleted_by",
                table: "workspaces",
                column: "deleted_by");

            migrationBuilder.CreateIndex(
                name: "ix_workspaces_is_deleted",
                table: "workspaces",
                column: "is_deleted");

            migrationBuilder.CreateIndex(
                name: "ix_workspaces_slug",
                table: "workspaces",
                column: "slug",
                unique: true,
                filter: "NOT is_deleted");

            migrationBuilder.CreateIndex(
                name: "ix_workspaces_updated_by",
                table: "workspaces",
                column: "updated_by");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_tool_invocations");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "audit_events");

            migrationBuilder.DropTable(
                name: "automation_logs");

            migrationBuilder.DropTable(
                name: "calendar_items");

            migrationBuilder.DropTable(
                name: "documents");

            migrationBuilder.DropTable(
                name: "feature_flags");

            migrationBuilder.DropTable(
                name: "goal_project_links");

            migrationBuilder.DropTable(
                name: "initiative_milestones");

            migrationBuilder.DropTable(
                name: "invitations");

            migrationBuilder.DropTable(
                name: "memberships");

            migrationBuilder.DropTable(
                name: "notification_preferences");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "project_favorites");

            migrationBuilder.DropTable(
                name: "project_templates");

            migrationBuilder.DropTable(
                name: "request_submissions");

            migrationBuilder.DropTable(
                name: "subscriptions");

            migrationBuilder.DropTable(
                name: "task_attachments");

            migrationBuilder.DropTable(
                name: "task_checklist_items");

            migrationBuilder.DropTable(
                name: "task_comments");

            migrationBuilder.DropTable(
                name: "task_dependencies");

            migrationBuilder.DropTable(
                name: "task_watchers");

            migrationBuilder.DropTable(
                name: "time_entries");

            migrationBuilder.DropTable(
                name: "usage_records");

            migrationBuilder.DropTable(
                name: "ai_messages");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "automation_rules");

            migrationBuilder.DropTable(
                name: "initiatives");

            migrationBuilder.DropTable(
                name: "request_forms");

            migrationBuilder.DropTable(
                name: "plans");

            migrationBuilder.DropTable(
                name: "file_attachments");

            migrationBuilder.DropTable(
                name: "task_items");

            migrationBuilder.DropTable(
                name: "ai_conversations");

            migrationBuilder.DropTable(
                name: "goals");

            migrationBuilder.DropTable(
                name: "sprints");

            migrationBuilder.DropTable(
                name: "projects");

            migrationBuilder.DropTable(
                name: "workspaces");

            migrationBuilder.DropTable(
                name: "AspNetUsers");
        }
    }
}
