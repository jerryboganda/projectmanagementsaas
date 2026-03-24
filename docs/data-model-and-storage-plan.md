# Data Model and Storage Plan

> **Status:** Draft v1.0
> **Last updated:** 2026-03-18
> **Owner:** Backend Architecture Team

---

## 1. Primary Database: PostgreSQL 16+

### Design Principles

- **Multi-tenant via global query filters** — every tenant-scoped table has a `workspace_id` column.
- **UUID v7 primary keys** — time-ordered, globally unique, no sequence contention.
- **Soft delete** for core entities (`is_deleted`, `deleted_at`, `deleted_by_id`).
- **UTC timestamps** — all `timestamp` columns use `timestamptz` (UTC).
- **String-stored enums** — stored as `varchar` to avoid integer-enum drift across migrations.
- **JSONB** for flexible fields (labels, form schemas, automation configs, settings).
- **Snake_case naming** — PostgreSQL convention via EF Core Npgsql naming convention plugin.

### Naming Conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Table | snake_case plural | `tasks`, `task_comments` |
| Column | snake_case | `workspace_id`, `created_at` |
| Primary Key | `id` | `id uuid` |
| Foreign Key | `{entity}_id` | `project_id`, `assignee_id` |
| Index | `ix_{table}_{columns}` | `ix_tasks_workspace_id_status` |
| Unique | `uq_{table}_{columns}` | `uq_projects_workspace_id_identifier` |

---

## 2. Complete Table Schemas

### 2.1 workspaces

```sql
CREATE TABLE workspaces (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            varchar(100) NOT NULL,
    slug            varchar(50) NOT NULL,
    description     varchar(500),
    logo_url        varchar(2048),
    domain          varchar(253),
    timezone        varchar(50) NOT NULL DEFAULT 'UTC',
    settings        jsonb,
    is_deleted      boolean NOT NULL DEFAULT false,
    deleted_at      timestamptz,
    deleted_by_id   uuid REFERENCES users(id),
    created_by_id   uuid REFERENCES users(id),
    updated_by_id   uuid REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_workspaces_slug ON workspaces (slug) WHERE NOT is_deleted;
CREATE INDEX ix_workspaces_is_deleted ON workspaces (is_deleted);
CREATE INDEX ix_workspaces_created_at ON workspaces (created_at DESC);
```

### 2.2 users

```sql
CREATE TABLE users (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email               varchar(254) NOT NULL,
    full_name           varchar(100) NOT NULL,
    display_name        varchar(50),
    avatar_url          varchar(2048),
    password_hash       text,
    phone_number        varchar(20),
    timezone            varchar(50) NOT NULL DEFAULT 'UTC',
    locale              varchar(10) NOT NULL DEFAULT 'en',
    email_confirmed     boolean NOT NULL DEFAULT false,
    two_factor_enabled  boolean NOT NULL DEFAULT false,
    two_factor_secret   text,
    last_login_at       timestamptz,
    failed_login_count  integer NOT NULL DEFAULT 0,
    lockout_end_at      timestamptz,
    google_id           varchar(100),
    github_id           varchar(100),
    microsoft_id        varchar(100),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_users_email ON users (lower(email));
CREATE UNIQUE INDEX uq_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX uq_users_github_id ON users (github_id) WHERE github_id IS NOT NULL;
CREATE UNIQUE INDEX uq_users_microsoft_id ON users (microsoft_id) WHERE microsoft_id IS NOT NULL;
```

### 2.3 memberships

```sql
CREATE TABLE memberships (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            varchar(20) NOT NULL DEFAULT 'Member',
    job_title       varchar(100),
    department      varchar(100),
    joined_at       timestamptz NOT NULL DEFAULT now(),
    deactivated_at  timestamptz,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_memberships_workspace_user ON memberships (workspace_id, user_id);
CREATE INDEX ix_memberships_workspace_role ON memberships (workspace_id, role);
CREATE INDEX ix_memberships_user_id ON memberships (user_id);
```

### 2.4 invitations

```sql
CREATE TABLE invitations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email           varchar(254) NOT NULL,
    role            varchar(20) NOT NULL DEFAULT 'Member',
    invited_by_id   uuid NOT NULL REFERENCES users(id),
    token           varchar(64) NOT NULL,
    expires_at      timestamptz NOT NULL,
    status          varchar(20) NOT NULL DEFAULT 'Pending',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_invitations_token ON invitations (token);
CREATE INDEX ix_invitations_workspace_email_status ON invitations (workspace_id, email, status);
CREATE INDEX ix_invitations_expires_at ON invitations (expires_at);
```

### 2.5 projects

```sql
CREATE TABLE projects (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name                varchar(100) NOT NULL,
    identifier          varchar(6) NOT NULL,
    description         varchar(2000),
    icon_url            varchar(2048),
    color               varchar(7),
    status              varchar(20) NOT NULL DEFAULT 'Active',
    lead_id             uuid REFERENCES users(id),
    start_date          date,
    target_date         date,
    sort_order          integer NOT NULL DEFAULT 0,
    status_workflow     jsonb,
    task_count          integer NOT NULL DEFAULT 0,
    completed_task_count integer NOT NULL DEFAULT 0,
    is_deleted          boolean NOT NULL DEFAULT false,
    deleted_at          timestamptz,
    deleted_by_id       uuid REFERENCES users(id),
    created_by_id       uuid REFERENCES users(id),
    updated_by_id       uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_projects_workspace_identifier ON projects (workspace_id, identifier) WHERE NOT is_deleted;
CREATE INDEX ix_projects_workspace_status ON projects (workspace_id, status);
CREATE INDEX ix_projects_workspace_is_deleted ON projects (workspace_id, is_deleted);
CREATE INDEX ix_projects_lead_id ON projects (lead_id);
```

### 2.6 project_favorites

```sql
CREATE TABLE project_favorites (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sort_order      integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_project_favorites_workspace_project_user ON project_favorites (workspace_id, project_id, user_id);
CREATE INDEX ix_project_favorites_user_sort ON project_favorites (user_id, sort_order);
```

### 2.7 tasks

```sql
CREATE TABLE tasks (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title               varchar(500) NOT NULL,
    identifier          varchar(20) NOT NULL,
    description         text,
    status              varchar(30) NOT NULL DEFAULT 'Backlog',
    priority            varchar(20) NOT NULL DEFAULT 'None',
    assignee_id         uuid REFERENCES users(id),
    reporter_id         uuid REFERENCES users(id),
    sprint_id           uuid REFERENCES sprints(id) ON DELETE SET NULL,
    parent_task_id      uuid REFERENCES tasks(id) ON DELETE SET NULL,
    due_date            date,
    start_date          date,
    estimate_points     integer,
    sort_order          integer NOT NULL DEFAULT 0,
    labels              jsonb,
    completed_at        timestamptz,
    is_deleted          boolean NOT NULL DEFAULT false,
    deleted_at          timestamptz,
    deleted_by_id       uuid REFERENCES users(id),
    created_by_id       uuid REFERENCES users(id),
    updated_by_id       uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_tasks_workspace_identifier ON tasks (workspace_id, identifier);
CREATE INDEX ix_tasks_workspace_project_status ON tasks (workspace_id, project_id, status);
CREATE INDEX ix_tasks_workspace_assignee ON tasks (workspace_id, assignee_id);
CREATE INDEX ix_tasks_workspace_sprint ON tasks (workspace_id, sprint_id);
CREATE INDEX ix_tasks_workspace_due_date ON tasks (workspace_id, due_date);
CREATE INDEX ix_tasks_workspace_is_deleted ON tasks (workspace_id, is_deleted);
CREATE INDEX ix_tasks_parent_task ON tasks (parent_task_id);
CREATE INDEX ix_tasks_workspace_project_sort ON tasks (workspace_id, project_id, sort_order);
-- Full-text search index
CREATE INDEX ix_tasks_search ON tasks USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);
```

### 2.8 task_comments

```sql
CREATE TABLE task_comments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    task_id             uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id           uuid NOT NULL REFERENCES users(id),
    body                text NOT NULL,
    parent_comment_id   uuid REFERENCES task_comments(id) ON DELETE CASCADE,
    edited_at           timestamptz,
    is_deleted          boolean NOT NULL DEFAULT false,
    deleted_at          timestamptz,
    deleted_by_id       uuid REFERENCES users(id),
    created_by_id       uuid REFERENCES users(id),
    updated_by_id       uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_task_comments_task_created ON task_comments (task_id, created_at);
CREATE INDEX ix_task_comments_parent ON task_comments (parent_comment_id);
CREATE INDEX ix_task_comments_workspace ON task_comments (workspace_id);
```

### 2.9 task_watchers

```sql
CREATE TABLE task_watchers (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    task_id         uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_task_watchers_task_user ON task_watchers (task_id, user_id);
CREATE INDEX ix_task_watchers_workspace ON task_watchers (workspace_id);
```

### 2.10 task_dependencies

```sql
CREATE TABLE task_dependencies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    from_task_id    uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    to_task_id      uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type            varchar(20) NOT NULL DEFAULT 'BlockedBy',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_no_self_dependency CHECK (from_task_id != to_task_id)
);

CREATE UNIQUE INDEX uq_task_dependencies_from_to ON task_dependencies (from_task_id, to_task_id);
CREATE INDEX ix_task_dependencies_to ON task_dependencies (to_task_id);
CREATE INDEX ix_task_dependencies_workspace ON task_dependencies (workspace_id);
```

### 2.11 task_checklist_items

```sql
CREATE TABLE task_checklist_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    task_id         uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title           varchar(500) NOT NULL,
    is_completed    boolean NOT NULL DEFAULT false,
    sort_order      integer NOT NULL DEFAULT 0,
    assignee_id     uuid REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_task_checklist_items_task_sort ON task_checklist_items (task_id, sort_order);
CREATE INDEX ix_task_checklist_items_workspace ON task_checklist_items (workspace_id);
```

### 2.12 task_attachments

```sql
CREATE TABLE task_attachments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    task_id         uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_id         uuid NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    uploaded_by_id  uuid NOT NULL REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_task_attachments_task ON task_attachments (task_id);
CREATE INDEX ix_task_attachments_file ON task_attachments (file_id);
CREATE INDEX ix_task_attachments_workspace ON task_attachments (workspace_id);
```

### 2.13 goals

```sql
CREATE TABLE goals (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title               varchar(200) NOT NULL,
    description         varchar(2000),
    status              varchar(20) NOT NULL DEFAULT 'OnTrack',
    type                varchar(20),
    owner_id            uuid REFERENCES users(id),
    start_date          date,
    target_date         date,
    progress_percent    integer NOT NULL DEFAULT 0,
    parent_goal_id      uuid REFERENCES goals(id) ON DELETE SET NULL,
    is_deleted          boolean NOT NULL DEFAULT false,
    deleted_at          timestamptz,
    deleted_by_id       uuid REFERENCES users(id),
    created_by_id       uuid REFERENCES users(id),
    updated_by_id       uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_goals_workspace_status ON goals (workspace_id, status);
CREATE INDEX ix_goals_workspace_owner ON goals (workspace_id, owner_id);
CREATE INDEX ix_goals_parent ON goals (parent_goal_id);
CREATE INDEX ix_goals_workspace_is_deleted ON goals (workspace_id, is_deleted);
```

### 2.14 goal_project_links

```sql
CREATE TABLE goal_project_links (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    goal_id         uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_goal_project_links_goal_project ON goal_project_links (goal_id, project_id);
CREATE INDEX ix_goal_project_links_workspace ON goal_project_links (workspace_id);
```

### 2.15 initiatives

```sql
CREATE TABLE initiatives (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    goal_id             uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title               varchar(200) NOT NULL,
    description         varchar(2000),
    status              varchar(20) NOT NULL DEFAULT 'Planned',
    owner_id            uuid REFERENCES users(id),
    start_date          date,
    target_date         date,
    progress_percent    integer NOT NULL DEFAULT 0,
    created_by_id       uuid REFERENCES users(id),
    updated_by_id       uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_initiatives_workspace_goal ON initiatives (workspace_id, goal_id);
CREATE INDEX ix_initiatives_workspace_status ON initiatives (workspace_id, status);
```

### 2.16 initiative_milestones

```sql
CREATE TABLE initiative_milestones (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    initiative_id   uuid NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    title           varchar(200) NOT NULL,
    target_date     date,
    is_completed    boolean NOT NULL DEFAULT false,
    completed_at    timestamptz,
    sort_order      integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_initiative_milestones_initiative_sort ON initiative_milestones (initiative_id, sort_order);
CREATE INDEX ix_initiative_milestones_workspace ON initiative_milestones (workspace_id);
```

### 2.17 sprints

```sql
CREATE TABLE sprints (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name                varchar(100) NOT NULL,
    goal                varchar(500),
    status              varchar(20) NOT NULL DEFAULT 'Planned',
    start_date          date NOT NULL,
    end_date            date NOT NULL,
    started_at          timestamptz,
    completed_at        timestamptz,
    planned_points      integer,
    completed_points    integer,
    planned_tasks       integer,
    completed_tasks     integer,
    created_by_id       uuid REFERENCES users(id),
    updated_by_id       uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_sprint_dates CHECK (end_date > start_date)
);

CREATE INDEX ix_sprints_workspace_project_status ON sprints (workspace_id, project_id, status);
CREATE INDEX ix_sprints_workspace_status ON sprints (workspace_id, status);
-- Partial unique: only one active sprint per project
CREATE UNIQUE INDEX uq_sprints_project_active ON sprints (project_id) WHERE status = 'Active';
```

### 2.18 calendar_items

```sql
CREATE TABLE calendar_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title           varchar(200) NOT NULL,
    description     varchar(2000),
    start_time      timestamptz NOT NULL,
    end_time        timestamptz NOT NULL,
    is_all_day      boolean NOT NULL DEFAULT false,
    location        varchar(500),
    color           varchar(7),
    recurrence_rule varchar(500),
    project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
    task_id         uuid REFERENCES tasks(id) ON DELETE SET NULL,
    owner_id        uuid NOT NULL REFERENCES users(id),
    created_by_id   uuid REFERENCES users(id),
    updated_by_id   uuid REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_calendar_items_workspace_time ON calendar_items (workspace_id, start_time, end_time);
CREATE INDEX ix_calendar_items_workspace_owner ON calendar_items (workspace_id, owner_id);
CREATE INDEX ix_calendar_items_task ON calendar_items (task_id);
```

### 2.19 documents

```sql
CREATE TABLE documents (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title                   varchar(200) NOT NULL,
    content                 text,
    plain_text_content      text,
    project_id              uuid REFERENCES projects(id) ON DELETE SET NULL,
    parent_document_id      uuid REFERENCES documents(id) ON DELETE SET NULL,
    icon                    varchar(50),
    sort_order              integer NOT NULL DEFAULT 0,
    is_published            boolean NOT NULL DEFAULT false,
    last_viewed_at          timestamptz,
    is_deleted              boolean NOT NULL DEFAULT false,
    deleted_at              timestamptz,
    deleted_by_id           uuid REFERENCES users(id),
    created_by_id           uuid REFERENCES users(id),
    updated_by_id           uuid REFERENCES users(id),
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_documents_workspace_project ON documents (workspace_id, project_id);
CREATE INDEX ix_documents_parent ON documents (parent_document_id);
CREATE INDEX ix_documents_workspace_is_deleted ON documents (workspace_id, is_deleted);
-- Full-text search
CREATE INDEX ix_documents_search ON documents USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(plain_text_content, ''))
);
```

### 2.20 time_entries

```sql
CREATE TABLE time_entries (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id             uuid NOT NULL REFERENCES users(id),
    task_id             uuid REFERENCES tasks(id) ON DELETE SET NULL,
    project_id          uuid REFERENCES projects(id) ON DELETE SET NULL,
    description         varchar(500),
    started_at          timestamptz NOT NULL,
    stopped_at          timestamptz,
    duration_minutes    integer NOT NULL DEFAULT 0,
    is_billable         boolean NOT NULL DEFAULT false,
    created_by_id       uuid REFERENCES users(id),
    updated_by_id       uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_time_entries_workspace_user_started ON time_entries (workspace_id, user_id, started_at);
CREATE INDEX ix_time_entries_workspace_task ON time_entries (workspace_id, task_id);
CREATE INDEX ix_time_entries_workspace_project ON time_entries (workspace_id, project_id);
```

### 2.21 automation_rules

```sql
CREATE TABLE automation_rules (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name                varchar(100) NOT NULL,
    description         varchar(500),
    is_enabled          boolean NOT NULL DEFAULT true,
    project_id          uuid REFERENCES projects(id) ON DELETE CASCADE,
    trigger_type        varchar(50) NOT NULL,
    trigger_condition   jsonb,
    action_type         varchar(50) NOT NULL,
    action_config       jsonb,
    execution_count     integer NOT NULL DEFAULT 0,
    last_executed_at    timestamptz,
    created_by_id       uuid REFERENCES users(id),
    updated_by_id       uuid REFERENCES users(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_automation_rules_workspace_enabled ON automation_rules (workspace_id, is_enabled);
CREATE INDEX ix_automation_rules_workspace_project ON automation_rules (workspace_id, project_id);
CREATE INDEX ix_automation_rules_trigger_type ON automation_rules (trigger_type);
```

### 2.22 automation_logs

```sql
CREATE TABLE automation_logs (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    automation_rule_id  uuid NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    triggered_by_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
    status              varchar(20) NOT NULL DEFAULT 'Success',
    error_message       text,
    input_snapshot      jsonb,
    output_snapshot     jsonb,
    duration_ms         integer NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_automation_logs_rule_created ON automation_logs (automation_rule_id, created_at DESC);
CREATE INDEX ix_automation_logs_workspace ON automation_logs (workspace_id);
```

### 2.23 request_forms

```sql
CREATE TABLE request_forms (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            varchar(100) NOT NULL,
    slug            varchar(50) NOT NULL,
    description     varchar(500),
    project_id      uuid REFERENCES projects(id) ON DELETE SET NULL,
    fields_schema   jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_active       boolean NOT NULL DEFAULT true,
    is_public       boolean NOT NULL DEFAULT false,
    created_by_id   uuid REFERENCES users(id),
    updated_by_id   uuid REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_request_forms_workspace_slug ON request_forms (workspace_id, slug);
CREATE INDEX ix_request_forms_workspace_active ON request_forms (workspace_id, is_active);
```

### 2.24 request_submissions

```sql
CREATE TABLE request_submissions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    request_form_id     uuid NOT NULL REFERENCES request_forms(id) ON DELETE CASCADE,
    data                jsonb NOT NULL DEFAULT '{}'::jsonb,
    status              varchar(20) NOT NULL DEFAULT 'New',
    triaged_by_id       uuid REFERENCES users(id),
    created_task_id     uuid REFERENCES tasks(id) ON DELETE SET NULL,
    submitter_email     varchar(254),
    submitter_name      varchar(100),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_request_submissions_form_status ON request_submissions (request_form_id, status);
CREATE INDEX ix_request_submissions_workspace ON request_submissions (workspace_id);
```

### 2.25 project_templates

```sql
CREATE TABLE project_templates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            varchar(100) NOT NULL,
    description     varchar(500),
    template_data   jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_default      boolean NOT NULL DEFAULT false,
    created_by_id   uuid REFERENCES users(id),
    updated_by_id   uuid REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_project_templates_workspace ON project_templates (workspace_id);
```

### 2.26 notifications

```sql
CREATE TABLE notifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    recipient_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id        uuid REFERENCES users(id),
    type            varchar(50) NOT NULL,
    title           varchar(200) NOT NULL,
    body            varchar(500),
    resource_type   varchar(50),
    resource_id     uuid,
    resource_url    varchar(500),
    is_read         boolean NOT NULL DEFAULT false,
    read_at         timestamptz,
    is_emailed      boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_notifications_recipient_read_created ON notifications (recipient_id, is_read, created_at DESC);
CREATE INDEX ix_notifications_workspace ON notifications (workspace_id);
```

### 2.27 notification_preferences

```sql
CREATE TABLE notification_preferences (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    in_app_enabled          boolean NOT NULL DEFAULT true,
    email_enabled           boolean NOT NULL DEFAULT true,
    email_digest_enabled    boolean NOT NULL DEFAULT false,
    email_digest_frequency  varchar(20) NOT NULL DEFAULT 'Daily',
    muted_types             jsonb,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_notification_preferences_user ON notification_preferences (user_id);
```

### 2.28 subscriptions

```sql
CREATE TABLE subscriptions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    plan_id                 uuid NOT NULL REFERENCES plans(id),
    stripe_customer_id      varchar(100) NOT NULL,
    stripe_subscription_id  varchar(100) NOT NULL,
    status                  varchar(20) NOT NULL DEFAULT 'Active',
    trial_ends_at           date,
    current_period_start    timestamptz NOT NULL,
    current_period_end      timestamptz NOT NULL,
    cancelled_at            timestamptz,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_subscriptions_workspace ON subscriptions (workspace_id);
CREATE INDEX ix_subscriptions_stripe_customer ON subscriptions (stripe_customer_id);
CREATE INDEX ix_subscriptions_stripe_subscription ON subscriptions (stripe_subscription_id);
```

### 2.29 plans

```sql
CREATE TABLE plans (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    varchar(50) NOT NULL,
    stripe_price_id         varchar(100),
    monthly_price_usd       decimal(10, 2) NOT NULL,
    annual_price_usd        decimal(10, 2),
    max_members             integer NOT NULL DEFAULT -1,
    max_projects            integer NOT NULL DEFAULT -1,
    max_storage_bytes       bigint NOT NULL DEFAULT -1,
    max_automations         integer NOT NULL DEFAULT -1,
    has_ai                  boolean NOT NULL DEFAULT false,
    has_advanced_reports    boolean NOT NULL DEFAULT false,
    has_custom_fields       boolean NOT NULL DEFAULT false,
    has_timeline            boolean NOT NULL DEFAULT false,
    has_2fa                 boolean NOT NULL DEFAULT false,
    has_saml                boolean NOT NULL DEFAULT false,
    has_audit_log           boolean NOT NULL DEFAULT false,
    is_active               boolean NOT NULL DEFAULT true,
    sort_order              integer NOT NULL DEFAULT 0,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_plans_name ON plans (name);
CREATE INDEX ix_plans_active ON plans (is_active);
```

### 2.30 usage_records

```sql
CREATE TABLE usage_records (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    subscription_id     uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    metric_type         varchar(50) NOT NULL,
    value               bigint NOT NULL,
    recorded_date       date NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_usage_records_sub_metric_date ON usage_records (subscription_id, metric_type, recorded_date);
CREATE INDEX ix_usage_records_workspace ON usage_records (workspace_id);
```

### 2.31 ai_conversations

```sql
CREATE TABLE ai_conversations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id             uuid NOT NULL REFERENCES users(id),
    title               varchar(200),
    model               varchar(50) NOT NULL DEFAULT 'gpt-4o',
    message_count       integer NOT NULL DEFAULT 0,
    total_tokens_used   integer NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_ai_conversations_workspace_user_created ON ai_conversations (workspace_id, user_id, created_at DESC);
```

### 2.32 ai_messages

```sql
CREATE TABLE ai_messages (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    conversation_id     uuid NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role                varchar(20) NOT NULL,
    content             text NOT NULL,
    tokens_used         integer,
    duration_ms         integer,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_ai_messages_conversation_created ON ai_messages (conversation_id, created_at);
CREATE INDEX ix_ai_messages_workspace ON ai_messages (workspace_id);
```

### 2.33 ai_tool_invocations

```sql
CREATE TABLE ai_tool_invocations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    message_id      uuid NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    tool_name       varchar(100) NOT NULL,
    input           jsonb,
    output          jsonb,
    status          varchar(20) NOT NULL DEFAULT 'Pending',
    duration_ms     integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_ai_tool_invocations_message ON ai_tool_invocations (message_id);
CREATE INDEX ix_ai_tool_invocations_workspace ON ai_tool_invocations (workspace_id);
```

### 2.34 audit_events

```sql
CREATE TABLE audit_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_id        uuid REFERENCES users(id),
    action          varchar(50) NOT NULL,
    entity_type     varchar(50) NOT NULL,
    entity_id       uuid NOT NULL,
    old_values      jsonb,
    new_values      jsonb,
    ip_address      varchar(45),
    user_agent      varchar(500),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_events_workspace_entity ON audit_events (workspace_id, entity_type, entity_id);
CREATE INDEX ix_audit_events_workspace_actor_created ON audit_events (workspace_id, actor_id, created_at DESC);
CREATE INDEX ix_audit_events_created ON audit_events (created_at);
-- Partition-ready: consider range partitioning on created_at for large volumes
```

### 2.35 file_attachments

```sql
CREATE TABLE file_attachments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    file_name       varchar(255) NOT NULL,
    content_type    varchar(100) NOT NULL,
    size_bytes      bigint NOT NULL,
    storage_key     varchar(500) NOT NULL,
    storage_bucket  varchar(100) NOT NULL,
    uploaded_by_id  uuid NOT NULL REFERENCES users(id),
    thumbnail_key   varchar(500),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_file_attachments_workspace_uploader ON file_attachments (workspace_id, uploaded_by_id);
CREATE INDEX ix_file_attachments_storage_key ON file_attachments (storage_key);
```

### 2.36 feature_flags

```sql
CREATE TABLE feature_flags (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key                         varchar(100) NOT NULL,
    description                 varchar(500),
    is_enabled                  boolean NOT NULL DEFAULT false,
    enabled_for_plans           jsonb,
    enabled_for_workspaces      jsonb,
    metadata                    jsonb,
    created_at                  timestamptz NOT NULL DEFAULT now(),
    updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_feature_flags_key ON feature_flags (key);
```

---

## 3. Storage Strategy

### 3.1 PostgreSQL — Relational Data

All structured application data lives in PostgreSQL. This includes:

- All entities listed above
- Hangfire job storage (dedicated schema: `hangfire`)
- ASP.NET Core Identity tables (dedicated schema: `identity`)
- EF Core migration history

**Connection pooling:** Use Npgsql connection pooling with `MaxPoolSize=100` default. For Worker service, use a separate pool with `MaxPoolSize=20`.

### 3.2 Redis — Transient and High-Frequency Data

| Use Case | Key Pattern | TTL |
|----------|------------|-----|
| Distributed cache | `cache:{entity}:{id}` | 5-60 min |
| Rate limiting state | `ratelimit:{ip}:{window}` | 1-5 min |
| SignalR backplane | Managed by library | — |
| Refresh token blocklist | `blocklist:rt:{jti}` | 7 days (match refresh token lifetime) |
| Active user presence | `presence:{workspaceId}:{userId}` | 5 min (heartbeat) |
| Running timer state | `timer:{workspaceId}:{userId}` | 24 hours |
| Session data | `session:{sessionId}` | 24 hours |

**Eviction policy:** `allkeys-lru` for cache. Separate Redis database (or key prefix) for persistent data like blocklist.

### 3.3 S3-Compatible Storage — Files

| Configuration | Development | Production |
|--------------|-------------|------------|
| Provider | MinIO (local Docker) | AWS S3 / GCS / Azure Blob |
| Bucket | `linearprecision-files` | `{env}-linearprecision-files` |
| Access | Presigned URLs (1 hour expiry) | Presigned URLs (1 hour expiry) |
| Upload limit | 50 MB | 50 MB (configurable per plan) |
| Lifecycle | No auto-delete | Intelligent tiering after 90 days |

**Upload flow:**

```
1. Client requests presigned upload URL  → POST /api/files/upload/presign
2. API generates presigned PUT URL       → returns { uploadUrl, fileId }
3. Client uploads directly to S3         → PUT {uploadUrl}
4. Client confirms upload                → POST /api/files/upload/{fileId}/confirm
5. API verifies file exists in S3        → marks FileAttachment as confirmed
```

### 3.4 Full-Text Search

**Phase 1: PostgreSQL `tsvector`**

```sql
-- Tasks search
SELECT id, title, ts_rank(search_vector, query) AS rank
FROM tasks,
     to_tsquery('english', 'bug & critical') AS query
WHERE search_vector @@ query
  AND workspace_id = @workspace_id
ORDER BY rank DESC
LIMIT 20;
```

**Phase 2: Meilisearch (when PG search becomes a bottleneck)**

- Sync via background jobs on entity change events.
- Search API proxies to Meilisearch.
- Tenant isolation via filterable `workspace_id` attribute.

---

## 4. Multi-Tenant Strategy

### 4.1 Architecture: Shared Database, Shared Schema

All tenants share the same PostgreSQL database and schema. Isolation is enforced at the application level via:

1. **EF Core global query filters** — automatically append `WHERE workspace_id = @current` to every query.
2. **SaveChanges interceptor** — automatically set `WorkspaceId` on new entities.
3. **Middleware** — resolve current workspace from JWT claims or `X-Workspace-Id` header.

### 4.2 EF Core Configuration

```csharp
// Infrastructure/Persistence/AppDbContext.cs
public class AppDbContext : DbContext
{
    private readonly ICurrentWorkspace _workspace;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply tenant filter to all ITenantScoped entities
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(AppDbContext)
                    .GetMethod(nameof(ApplyTenantFilter), BindingFlags.NonPublic | BindingFlags.Static)!
                    .MakeGenericMethod(entityType.ClrType);
                method.Invoke(null, [modelBuilder]);
            }
        }

        // Apply soft-delete filter
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ISoftDeletable).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(AppDbContext)
                    .GetMethod(nameof(ApplySoftDeleteFilter), BindingFlags.NonPublic | BindingFlags.Static)!
                    .MakeGenericMethod(entityType.ClrType);
                method.Invoke(null, [modelBuilder]);
            }
        }
    }

    private static void ApplyTenantFilter<T>(ModelBuilder builder) where T : class, ITenantScoped
    {
        builder.Entity<T>().HasQueryFilter(e => e.WorkspaceId == _workspaceId);
    }

    private static void ApplySoftDeleteFilter<T>(ModelBuilder builder) where T : class, ISoftDeletable
    {
        builder.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
    }
}
```

### 4.3 Tenant Interceptor

```csharp
// Infrastructure/Persistence/Interceptors/TenantInterceptor.cs
public class TenantInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentWorkspace _workspace;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken ct = default)
    {
        foreach (var entry in eventData.Context!.ChangeTracker.Entries<ITenantScoped>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.WorkspaceId = _workspace.Id;
            }
        }
        return base.SavingChangesAsync(eventData, result, ct);
    }
}
```

### 4.4 Bypassing Tenant Filter

For cross-tenant operations (admin, billing webhooks, background jobs):

```csharp
// Use IgnoreQueryFilters() explicitly
var allWorkspaces = await _db.Workspaces
    .IgnoreQueryFilters()
    .Where(w => !w.IsDeleted)
    .ToListAsync(ct);
```

---

## 5. Migration Strategy

### 5.1 EF Core Code-First Migrations

```bash
# Create migration
dotnet ef migrations add InitialCreate --project src/LinearPrecision.Api

# Apply migration
dotnet ef database update --project src/LinearPrecision.Api

# Generate SQL script (for production review)
dotnet ef migrations script --project src/LinearPrecision.Api --output migrations.sql
```

### 5.2 Migration Workflow

1. Developer creates migration locally.
2. Migration is reviewed in PR.
3. CI generates SQL script and attaches as artifact.
4. Production applies via `dotnet ef database update` in deployment pipeline (or reviewed SQL script for critical changes).

### 5.3 Seed Data (Development)

```csharp
// Infrastructure/Persistence/Seeds/SeedData.cs
public static class SeedData
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Plans.AnyAsync()) return;

        // Plans
        db.Plans.AddRange(
            new Plan { Name = "Free", MonthlyPriceUsd = 0, MaxMembers = 5, MaxProjects = 3 },
            new Plan { Name = "Starter", MonthlyPriceUsd = 8, MaxMembers = 15, MaxProjects = -1 },
            new Plan { Name = "Pro", MonthlyPriceUsd = 16, MaxMembers = -1, MaxProjects = -1, HasAI = true, HasAdvancedReports = true },
            new Plan { Name = "Enterprise", MonthlyPriceUsd = 0, MaxMembers = -1, MaxProjects = -1, HasAI = true, HasSAML = true, HasAuditLog = true }
        );

        // Feature flags
        db.FeatureFlags.AddRange(
            new FeatureFlag { Key = "ai-assistant", IsEnabled = false, EnabledForPlans = "[\"Pro\",\"Enterprise\"]" },
            new FeatureFlag { Key = "advanced-automations", IsEnabled = true },
            new FeatureFlag { Key = "timeline-view", IsEnabled = true, EnabledForPlans = "[\"Pro\",\"Enterprise\"]" }
        );

        // Demo workspace + user (dev only)
        var user = new User { Email = "demo@linearprecision.dev", FullName = "Demo User", EmailConfirmed = true };
        db.Users.Add(user);

        var workspace = new Workspace { Name = "Demo Workspace", Slug = "demo", CreatedById = user.Id };
        db.Workspaces.Add(workspace);

        db.Memberships.Add(new Membership { WorkspaceId = workspace.Id, UserId = user.Id, Role = "Owner" });

        await db.SaveChangesAsync();
    }
}
```

---

## 6. Performance Considerations

### 6.1 Query Performance

| Strategy | Applied To |
|----------|-----------|
| Covering indexes | Task list queries (workspace + project + status) |
| Partial indexes | Active sprints, non-deleted entities, confirmed emails |
| JSONB GIN indexes | Labels, form field search |
| Connection pooling | Npgsql built-in pooling, 100 connections default |
| Read replicas | Future: route analytics/report queries to replica |

### 6.2 Caching Strategy

| Data | Cache TTL | Invalidation |
|------|-----------|-------------|
| Workspace settings | 10 min | On workspace update event |
| Plan/entitlements | 30 min | On subscription change event |
| User profile | 5 min | On profile update |
| Project list | 2 min | On project CRUD |
| Feature flags | 5 min | On flag update |

### 6.3 Bulk Operations

```csharp
// Bulk task status update (board reorder)
await _db.Tasks
    .Where(t => taskIds.Contains(t.Id))
    .ExecuteUpdateAsync(t => t
        .SetProperty(x => x.Status, newStatus)
        .SetProperty(x => x.SortOrder, /* computed */)
        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow),
    ct);
```

---

## 7. Backup and Recovery

| Concern | Strategy |
|---------|----------|
| Database backup | Daily automated pg_dump + WAL archiving |
| Point-in-time recovery | WAL-based PITR, 7-day retention |
| File storage backup | S3 versioning enabled, cross-region replication |
| Redis | No backup needed (transient cache), reconstruct from DB |
| RTO target | < 1 hour |
| RPO target | < 5 minutes |
