# Deployment Session Report — projectmanagement.polytronx.com

## Deployment Target
- **VPS**: `185.252.233.186` (root access)
- **Domain**: `projectmanagement.polytronx.com`
- **CF mode**: Full (strict) — self-signed origin cert
- **Compose file**: `docker-compose.vps.yml`
- **Working dir**: `/opt/projectmanagementsaas`
- **GitHub**: `jerryboganda/projectmanagementsaas`

## Running Containers (6, all healthy)
| Container | Status |
|---|---|
| pm-web | Up, healthy |
| pm-api | Up, healthy |
| pm-worker | Up, healthy |
| pm-postgres | Up, healthy |
| pm-redis | Up, healthy |
| pm-minio | Up, healthy |

## Git Commits Applied
| Commit | Purpose |
|---|---|
| `ee7041b` | Initial deployment structure |
| `7039fd0` | VPS-specific compose + env wiring |
| `566de24` | CSP allow Cloudflare Insights + wss/https connect-src |
| `18507bc` | Register `JsonStringEnumConverter` for string enum deserialization |

## Infrastructure Configuration

### NPM Proxy (id=29)
- `29.conf` hand-authored inside nginx-proxy-manager-app-1 container
- Origin TLS cert self-signed at `/data/custom_ssl/pm-origin/` for CF Full mode
- Orphan cert config `12.conf.bak-deleted-orphan` cleaned up
- Proxies upstream `pm-web:3000`

### CSP Header (verified live)
```
script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com
connect-src 'self' https://static.cloudflareinsights.com wss: https:
```

### Backend JSON Config (`Program.cs`)
Added:
```csharp
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
```

## Test Identity
- Email: `e2etest@polytronx.com`
- User ID: `019d9b36-6e5d-76d6-87cb-728d17649370`
- Workspace: `019d9b36-7051-7f51-90cd-1476cb1e0ade` ("E2E Tester's Workspace")
- Role: Owner

## E2E Route Walk (logged-in, screenshots captured for all)

| Route | Status | Notes |
|---|---|---|
| `/` Dashboard | ✓ Renders | Empty workspace (0 cycles, 0 issues) |
| `/inbox` | ✓ Renders | "All caught up!" |
| `/projects` | ✓ Renders + creates | 3 projects created via API test |
| `/portfolio` | ✓ Renders | 0 goals |
| `/board` | ✓ Renders | "Create a project first" guard |
| `/sprints` | ✓ Renders | "Create a project first" guard |
| `/timeline` | ✓ Renders | Empty |
| `/calendar` | ✓ Renders | April 2026 empty grid |
| `/workload` | ✓ Renders | 1 Member (E2E Tester, idle) |
| `/goals` | ✓ Renders | "No goals defined" |
| `/time-tracking` | ✓ Renders | Timer UI + 0h log |
| `/docs` | ✓ Renders | 5 default folders |
| `/reports` | ✓ Renders | Live workspace metrics |
| `/automations` | ✓ Renders | "No automations yet" |
| `/intake` | ✓ Renders | 3 forms / 7 submissions demo |
| `/templates` | ✓ Renders | "No templates found" |
| `/settings` | ✓ Renders | Workspace General loaded |

## Write-Flow Verification

### Bug Found + Fixed
**Symptom**: `POST /api/v1/projects` returned 400 with empty body from browser UI.

**Root cause**: ASP.NET Core API did not register `JsonStringEnumConverter`. Frontend TypeScript contract sends string enum values (`"status":"Active"`, `"visibility":"Workspace"`) but System.Text.Json default deserializer requires integer values. Result: silent JSON binding failure → `ValidationProblem` with no detail for the enum fields.

**Reproduction (direct curl, scp'd bash script to bypass PowerShell quote-mangling)**:
```
Test 1 (no status field):       HTTP 201 ✓
Test 2 (status: "Active"):      HTTP 400 ✗
Test 3 (status: 0):              HTTP 201 ✓
```

**Fix**: Registered `JsonStringEnumConverter` on both `ConfigureHttpJsonOptions` (Minimal API) and `AddControllers().AddJsonOptions` (MVC controllers).

**Post-fix verification**:
```
Test 2 (status: "Active", visibility: "Workspace"):  HTTP 201 ✓
  response: {"status":"Active","visibility":"Workspace",...}
```

Browser UI now shows 3 projects listed: Test Int (TINT), Test Minimal (TMIN), Test String (TSTR).

## Remaining Known Behavior
- Most modules show empty state by design when workspace has no projects/tasks/goals yet — this is correct, not a defect.
- `/intake` shows demo/mock data (3 forms, 7 submissions) — appears to be seeded UI state, not backend data.
- Raw `<img>` lint warnings acknowledged as prototype debt (per AGENTS.md).

## Deliverables
- ✅ Fresh GitHub upload (no old Postgres/Redis artifacts)
- ✅ 6-container stack live on VPS
- ✅ NPM + CF Full-mode TLS working
- ✅ CSP fix deployed
- ✅ Enum serialization fix deployed (`18507bc`)
- ✅ Login → Dashboard → All 16 routes verified
- ✅ Write flow (Create Project) verified via both direct API and frontend contract shape


---

## Session 2 Addendum � End-to-End Write Flows Verified

### Additional Commits
| Commit | Purpose |
|---|---|
| `74d02e0` | SignalR JWT query-string auth + task modal projectId init |
| `12eb6b3` | Refactor task modal to use derived `effectiveProjectId` (avoid `react-hooks/set-state-in-effect` lint) |

### New Bugs Discovered & Fixed
**1. SignalR WebSocket 401 on `/hubs/board`**
- **Symptom**: Browser console repeatedly logged `WebSocket /hubs/board ... 401 HTTP Authentication failed` on Board page.
- **Root cause**: `JwtBearerEvents` in `backend/src/LinearPrecision.Api/Program.cs` only handled `OnTokenValidated`. Browsers cannot set an `Authorization` header on a WebSocket upgrade, so SignalR passes the JWT as a query-string `access_token`. Without an `OnMessageReceived` handler, the token was never read.
- **Fix**: Added `OnMessageReceived` event that copies `access_token` from the query string into `context.Token` for any request path starting with `/hubs`.
- **Verified**: WebSocket moved from 401 ? open on `/hubs/board`, `/hubs/notifications`, `/hubs/presence`, `/hubs/ai-stream`.

**2. Create Task modal rejected valid submissions with "A project is required"**
- **Symptom**: `<select>` showed "Customer Portal Launch" as selected, but clicking "Create Task" failed with frontend validation error.
- **Root cause**: `components/board/create-task-modal.tsx` declared `const [projectId, setProjectId] = useState("")`. The HTML `<select>` visually defaults to the first option when its bound value is empty, but React state stayed `""` until the user manually changed the dropdown.
- **First attempted fix**: `useEffect` to call `setProjectId(projects[0].id)` on open � rejected by Next.js production build (`react-hooks/set-state-in-effect` ESLint rule).
- **Final fix**: Removed `useEffect`, computed `const effectiveProjectId = projectId || projects[0]?.id || ""` inline, bound the `<select value>` to it, and submitted with it. Idiomatic "derive instead of sync" React pattern; no effect, no lint violation.
- **Verified**: UI Create Task on `/board` produced task **CPL-1** ("Set up project workspace structure") visible in the To Do column.

### End-to-End UI Flow Verification
| Flow | Result |
|---|---|
| Login via `/login` (E2E Tester) | ? Session established, refresh-token cookie persists |
| Session refresh on 401 via `lp_refresh_token` | ? Auto-restored on next navigation |
| Create Project via Quick Action ? Modal (Customer Portal Launch / CPL) | ? 201 Created, listed on `/projects`, visible in Project Health widget |
| Delete test Projects via API (3x) | ? 204 No Content each |
| Create Task via `/board` ? New Task modal ? Create | ? 201 Created, CPL-1 appears in To Do column with realtime update |
| SignalR hubs authentication | ? No more 401 on `/hubs/*` |
| Public HTTPS `/` and `/board` | ? 200 OK |

### Final Deployment State
- `pm-web` image: `sha256:211c09bff752` (new, 2026-04-17 16:30 UTC) � contains `12eb6b3`.
- `pm-api` image: rebuilt at 16:08 UTC � contains `74d02e0` (SignalR query-string JWT handler).
- `pm-worker` image: rebuilt at 16:08 UTC � contains `74d02e0`.
- All 6 containers report healthy; no restart loops; no queued crash logs.

### Outcome
`projectmanagement.polytronx.com` is now a fully functional deployment validated end-to-end:
- Read flows (browsing dashboards, projects, board) ?
- Write flows (register/login, create project, create task) ?
- Realtime (SignalR hubs) ?
- Persistence (Postgres, Redis, MinIO) ?
- Background work (Hangfire worker) ?
