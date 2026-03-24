# Authentication, Tenancy, and RBAC Plan — Linear Precision PM SaaS

> **Status:** Draft v1.0
> **Last updated:** 2026-03-19
> **Owner:** Backend Architecture Team
> **Related:** `backend-architecture-master-plan.md`, `domain-model.md`, `data-model-and-storage-plan.md`

---

## 1. Overview

This document defines the authentication, multi-tenancy, and role-based access control (RBAC) architecture for Linear Precision. The system uses ASP.NET Core Identity with JWT Bearer tokens, supports multiple OAuth providers, and enforces workspace-level tenant isolation with a four-role permission model.

**Design goals:**

- **Stateless authentication** — JWT Bearer tokens enable horizontal scaling without sticky sessions.
- **Tenant isolation from day one** — every tenant-scoped request requires a resolved workspace context.
- **Defense in depth** — multiple layers enforce access: middleware, authorization policies, EF Core query filters.
- **Progressive security** — start with email/password + OAuth, add magic links and 2FA as the user base grows.

---

## 2. Authentication Architecture

### 2.1 Identity Provider Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| User store | ASP.NET Core Identity + EF Core | User registration, password hashing, lockout |
| Token generation | Custom `TokenService` | JWT access + refresh token issuance |
| Token validation | `Microsoft.AspNetCore.Authentication.JwtBearer` | Middleware-level JWT validation |
| OAuth | ASP.NET Core External Authentication | Google, GitHub, Microsoft sign-in |
| Token blocklist | Redis | Revoked refresh token tracking |
| Magic links | Custom `MagicLinkService` | Passwordless authentication |
| 2FA | ASP.NET Core Identity TOTP | Time-based one-time passwords |

### 2.2 JWT Token Configuration

**Access Token:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Algorithm | RS256 | Asymmetric — API can validate without the signing key |
| Lifetime | 15 minutes | Short-lived to limit exposure from stolen tokens |
| Issuer | `https://api.linearprecision.com` | Prevents cross-service token replay |
| Audience | `linear-precision-api` | Scoped to this API |
| Key rotation | RSA 2048-bit, rotated every 90 days | JWKS endpoint for key discovery |

**Token claims:**

```json
{
  "sub": "a1b2c3d4-...",
  "email": "user@example.com",
  "name": "Jane Doe",
  "iat": 1711000000,
  "exp": 1711000900,
  "iss": "https://api.linearprecision.com",
  "aud": "linear-precision-api",
  "jti": "unique-token-id"
}
```

Note: workspace role is **not** embedded in the JWT. Roles are resolved per-request during tenant resolution because a user may have different roles in different workspaces.

**Implementation:**

```csharp
// Infrastructure/Auth/JwtTokenGenerator.cs
public class JwtTokenGenerator : ITokenGenerator
{
    private readonly RSA _signingKey;
    private readonly JwtSettings _settings;

    public string GenerateAccessToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Name, user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64)
        };

        var key = new RsaSecurityKey(_signingKey);
        var creds = new SigningCredentials(key, SecurityAlgorithms.RsaSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.AccessTokenLifetimeMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### 2.3 Refresh Token Strategy

| Parameter | Value |
|-----------|-------|
| Storage | Redis (hashed with SHA-256) |
| Lifetime | 7 days |
| Rotation | Mandatory — every refresh issues a new pair |
| Family tracking | Each refresh chain has a `familyId` |
| Reuse detection | If a revoked token is used, entire family is invalidated |

**Refresh token data model (Redis):**

```
Key:     rt:{hashedToken}
Value:   { userId, familyId, createdAt, expiresAt, isRevoked, replacedBy }
TTL:     7 days
```

**Rotation flow:**

```
1. Client sends POST /api/v1/auth/refresh { refreshToken }
2. Server looks up rt:{hash(refreshToken)} in Redis
3. If not found or expired → 401 Unauthorized
4. If isRevoked = true → REUSE DETECTED
   → Revoke entire family (all tokens with same familyId)
   → Return 401 with "security_violation" error
   → Log security event
5. If valid:
   → Mark current token as revoked, set replacedBy = newTokenId
   → Generate new access token + new refresh token (same familyId)
   → Store new refresh token in Redis
   → Return { accessToken, refreshToken, expiresIn }
```

**Blocklist for access tokens (logout/revocation):**

```
Key:     blocklist:at:{jti}
Value:   1
TTL:     15 minutes (match access token lifetime)
```

On every authenticated request, the JWT validation middleware checks Redis:

```csharp
options.Events = new JwtBearerEvents
{
    OnTokenValidated = async context =>
    {
        var jti = context.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
        if (jti is null) { context.Fail("Missing jti"); return; }

        var redis = context.HttpContext.RequestServices
            .GetRequiredService<IConnectionMultiplexer>();
        var db = redis.GetDatabase();

        if (await db.KeyExistsAsync($"blocklist:at:{jti}"))
        {
            context.Fail("Token has been revoked");
        }
    }
};
```

### 2.4 OAuth Providers

| Provider | Package | Callback URL | Scopes |
|----------|---------|-------------|--------|
| Google | `Microsoft.AspNetCore.Authentication.Google` | `/api/v1/auth/oauth/google/callback` | `openid`, `email`, `profile` |
| GitHub | `AspNet.Security.OAuth.GitHub` | `/api/v1/auth/oauth/github/callback` | `user:email`, `read:user` |
| Microsoft | `Microsoft.AspNetCore.Authentication.MicrosoftAccount` | `/api/v1/auth/oauth/microsoft/callback` | `openid`, `email`, `profile` |

**OAuth flow:**

```
1. Frontend redirects to: GET /api/v1/auth/oauth/{provider}?returnUrl={frontendUrl}
2. Server initiates OAuth challenge → redirect to provider
3. Provider authenticates → callback to /api/v1/auth/oauth/{provider}/callback
4. Server processes callback:
   a. Extract external identity (email, name, avatar, provider ID)
   b. Look up existing user by provider ID or email
   c. If found: link provider ID if not already linked, generate tokens
   d. If not found: create new user, generate tokens
5. Redirect to: {returnUrl}?accessToken={token}&refreshToken={token}
```

**Account linking rules:**

| Scenario | Behavior |
|----------|----------|
| OAuth email matches existing user with password | Link OAuth to existing account, issue tokens |
| OAuth email matches existing OAuth-only user | Link new provider to existing account |
| No matching email | Create new user from OAuth profile |
| OAuth user later sets password | Allowed — enables email/password login |
| Remove last OAuth provider when no password set | Blocked — must set password first |

### 2.5 Magic Link Authentication

Magic links provide passwordless authentication for users who prefer not to manage passwords.

**Flow:**

```
1. POST /api/v1/auth/magic-link { email }
2. Server generates cryptographic token (32 bytes, URL-safe base64)
3. Store in Redis: magic:{hashedToken} → { email, createdAt, expiresAt }
4. TTL: 15 minutes
5. Send email with link: {frontendUrl}/auth/magic?token={token}
6. User clicks link → Frontend sends POST /api/v1/auth/magic-link/verify { token }
7. Server validates token, creates/finds user, issues JWT + refresh token
8. Delete token from Redis (single-use)
```

**Security considerations:**
- Rate limit: 3 magic link requests per email per hour
- Tokens are single-use — deleted immediately after verification
- If email doesn't exist, silently accept (no email enumeration)
- Log all magic link issuance for audit trail

### 2.6 Two-Factor Authentication (2FA)

**Implementation:** TOTP (Time-based One-Time Password) via ASP.NET Core Identity.

**Setup flow:**

```
1. GET /api/v1/auth/2fa/setup
   → Generate TOTP secret, return QR code URI + recovery codes
2. POST /api/v1/auth/2fa/enable { verificationCode }
   → Validate TOTP code against secret, enable 2FA on account
   → Store hashed recovery codes (8 codes, single-use)
```

**Login flow with 2FA:**

```
1. POST /api/v1/auth/login { email, password }
   → Credentials valid but 2FA enabled
   → Return 200 { requiresTwoFactor: true, twoFactorToken: "..." }
   (twoFactorToken is a short-lived token, 5 min, stored in Redis)

2. POST /api/v1/auth/2fa/verify { twoFactorToken, code }
   → Validate TOTP code
   → If valid: issue access + refresh tokens
   → If invalid: increment failure counter, lock after 5 attempts
```

**Recovery codes:**
- 8 recovery codes generated at 2FA setup
- Each code is single-use
- Codes stored as hashed values
- `POST /api/v1/auth/2fa/recovery { twoFactorToken, recoveryCode }` validates and consumes a recovery code
- `POST /api/v1/auth/2fa/regenerate-recovery` issues new recovery codes (requires 2FA verification)

### 2.7 Session Management

Sessions track active authentication contexts per user for visibility and revocation.

**Session entity (Redis):**

```
Key:     session:{sessionId}
Value:   {
           userId, deviceInfo, ipAddress, userAgent,
           createdAt, lastActiveAt, refreshTokenFamily
         }
TTL:     7 days (refreshed on each token refresh)
```

**Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/sessions` | GET | List active sessions for current user |
| `/api/v1/auth/sessions/{id}` | DELETE | Revoke a specific session |
| `/api/v1/auth/sessions/revoke-all` | POST | Revoke all sessions except current |

Revoking a session invalidates the associated refresh token family and adds the current access token JTI to the blocklist.

---

## 3. Multi-Tenant Architecture

### 3.1 Tenant Model

Linear Precision uses **shared database, shared schema** multi-tenancy with row-level isolation.

| Concept | Implementation |
|---------|---------------|
| Tenant unit | `Workspace` |
| Tenant identifier | `workspace_id` (UUID v7) on every tenant-scoped row |
| Tenant resolution | `X-Workspace-Id` HTTP header |
| Query isolation | EF Core global query filters |
| Write isolation | `TenantInterceptor` on `SaveChanges` |
| Cross-tenant prevention | Middleware verifies membership before setting context |

### 3.2 Tenant Resolution Middleware

The `TenantResolutionMiddleware` runs after authentication and before authorization in the pipeline.

**Resolution order:**

```
1. Check if route is exempt (auth, public intake, health checks, OpenAPI)
2. Extract X-Workspace-Id header
3. Parse as GUID — 400 if missing or invalid
4. Verify authenticated user is a member of the workspace — 403 if not
5. Load membership role
6. Set ITenantContext: { WorkspaceId, UserId, Role }
7. Continue pipeline
```

**Exempt routes (no workspace context required):**

| Path prefix | Reason |
|-------------|--------|
| `/api/v1/auth/*` | Authentication (no workspace yet) |
| `/api/v1/workspaces` (POST, GET list) | Creating/listing workspaces |
| `/api/v1/invitations/*/accept` | Accepting invitation (joining workspace) |
| `/api/v1/intake/*/submit` | Public form submission |
| `/health/*` | Health checks |
| `/openapi/*` | API documentation |
| `/hubs/*` | SignalR (auth handled in hub) |

### 3.3 ITenantContext Interface

```csharp
// LinearPrecision.Shared/Contracts/ITenantContext.cs
public interface ITenantContext
{
    Guid WorkspaceId { get; }
    Guid UserId { get; }
    MembershipRole Role { get; }
    bool IsResolved { get; }
}

// Scoped implementation — set by middleware, consumed by EF Core + services
public class TenantContext : ITenantContext
{
    public Guid WorkspaceId { get; set; }
    public Guid UserId { get; set; }
    public MembershipRole Role { get; set; }
    public bool IsResolved => WorkspaceId != Guid.Empty;
}
```

### 3.4 EF Core Tenant Isolation

**Global query filters** automatically append `WHERE workspace_id = @current` to every query on tenant-scoped entities:

```csharp
// Applied via reflection in AppDbContext.OnModelCreating
private static void ApplyTenantFilter<T>(ModelBuilder builder, ITenantContext tenant)
    where T : class, ITenantScoped
{
    builder.Entity<T>().HasQueryFilter(e => e.WorkspaceId == tenant.WorkspaceId);
}
```

**TenantInterceptor** ensures new entities always receive the correct `WorkspaceId`:

```csharp
public class TenantInterceptor : SaveChangesInterceptor
{
    private readonly ITenantContext _tenant;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken ct)
    {
        foreach (var entry in eventData.Context!.ChangeTracker.Entries<ITenantScoped>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.WorkspaceId = _tenant.WorkspaceId;
                    break;
                case EntityState.Modified:
                    // Prevent workspace reassignment
                    entry.Property(e => e.WorkspaceId).IsModified = false;
                    break;
            }
        }
        return base.SavingChangesAsync(eventData, result, ct);
    }
}
```

### 3.5 Bypassing Tenant Filters

Certain operations require cross-tenant access:

| Scenario | Approach |
|----------|----------|
| Stripe webhook handler | `IgnoreQueryFilters()` + explicit workspace lookup |
| Background jobs (Hangfire) | `IgnoreQueryFilters()` + job carries `WorkspaceId` parameter |
| Admin/system operations | Dedicated `ISystemDbContext` without filters |
| Invitation acceptance | Explicit workspace lookup by invitation token |

```csharp
// Example: Stripe webhook resolves workspace by Stripe customer ID
var subscription = await _db.Subscriptions
    .IgnoreQueryFilters()
    .FirstOrDefaultAsync(s => s.StripeCustomerId == stripeEvent.CustomerId, ct);
```

### 3.6 SignalR Tenant Isolation

SignalR hubs use group-based tenant isolation:

```csharp
public class BoardHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var workspaceId = Context.GetHttpContext()!
            .Request.Headers["X-Workspace-Id"].ToString();

        // Validate membership (same as middleware)
        var userId = Context.User!.GetUserId();
        if (!await _membershipService.IsMember(userId, Guid.Parse(workspaceId)))
        {
            Context.Abort();
            return;
        }

        // Join workspace group — only receives events for this workspace
        await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace:{workspaceId}");
        await base.OnConnectedAsync();
    }
}

// Broadcasting scoped to workspace
await _hubContext.Clients
    .Group($"workspace:{workspaceId}")
    .SendAsync("TaskMoved", taskId, newStatus, newSortOrder);
```

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Role Hierarchy

Linear Precision defines four workspace-level roles:

| Role | Level | Description |
|------|-------|-------------|
| **Owner** | 4 (highest) | Full workspace control, billing, destructive operations |
| **Admin** | 3 | Member management, workspace settings, all content operations |
| **Member** | 2 | Full content CRUD within assigned projects |
| **Guest** | 1 (lowest) | Read-only access to explicitly shared projects |

**Constraints:**
- Every workspace must have at least one Owner.
- Owners cannot downgrade themselves if they are the last Owner.
- Guests can only access projects explicitly shared with them (via `Invitation.ProjectIds`).
- Role changes require Admin or Owner.

### 4.2 Authorization Policies

Policies are registered in `Program.cs` and referenced by endpoint groups:

```csharp
builder.Services.AddAuthorization(options =>
{
    // Hierarchical: each policy includes all higher roles
    options.AddPolicy("WorkspaceOwner", policy =>
        policy.AddRequirements(new WorkspaceRoleRequirement(MembershipRole.Owner)));

    options.AddPolicy("WorkspaceAdmin", policy =>
        policy.AddRequirements(new WorkspaceRoleRequirement(MembershipRole.Admin)));

    options.AddPolicy("WorkspaceMember", policy =>
        policy.AddRequirements(new WorkspaceRoleRequirement(MembershipRole.Member)));

    options.AddPolicy("WorkspaceGuest", policy =>
        policy.AddRequirements(new WorkspaceRoleRequirement(MembershipRole.Guest)));
});
```

**Custom authorization handler:**

```csharp
public class WorkspaceRoleRequirement : IAuthorizationRequirement
{
    public MembershipRole MinimumRole { get; }
    public WorkspaceRoleRequirement(MembershipRole minimumRole) => MinimumRole = minimumRole;
}

public class WorkspaceRoleHandler : AuthorizationHandler<WorkspaceRoleRequirement>
{
    private readonly ITenantContext _tenant;

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, WorkspaceRoleRequirement requirement)
    {
        if (!_tenant.IsResolved)
        {
            context.Fail(new AuthorizationFailureReason(this, "No workspace context"));
            return Task.CompletedTask;
        }

        // Role hierarchy: Owner(4) > Admin(3) > Member(2) > Guest(1)
        if ((int)_tenant.Role >= (int)requirement.MinimumRole)
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail(new AuthorizationFailureReason(this,
                $"Requires {requirement.MinimumRole} role, current role is {_tenant.Role}"));
        }

        return Task.CompletedTask;
    }
}
```

### 4.3 Policy Assignment by Module

| Module | Default Policy | Notes |
|--------|---------------|-------|
| Identity | None (public) | Auth endpoints have no workspace context |
| Workspace (read) | `WorkspaceGuest` | Any member can view workspace info |
| Workspace (write) | `WorkspaceAdmin` | Settings, member management |
| Workspace (delete) | `WorkspaceOwner` | Destructive operation |
| Projects (read) | `WorkspaceGuest` | Guests see shared projects only (additional filter) |
| Projects (write) | `WorkspaceMember` | Create, update, archive |
| Projects (delete) | `WorkspaceAdmin` | Soft delete |
| Tasks (read) | `WorkspaceGuest` | Guests see tasks in shared projects only |
| Tasks (write) | `WorkspaceMember` | Create, update, move, comment |
| Tasks (delete) | `WorkspaceMember` | Soft delete own tasks; Admin for others |
| Goals (read) | `WorkspaceMember` | Goals are workspace-wide, not for guests |
| Goals (write) | `WorkspaceMember` | Create, update |
| Goals (delete) | `WorkspaceAdmin` | Soft delete |
| Sprints (read) | `WorkspaceMember` | Sprint data is project-scoped |
| Sprints (manage) | `WorkspaceMember` | Create, start, complete |
| Calendar (read) | `WorkspaceMember` | Calendar is workspace-scoped |
| Calendar (write) | `WorkspaceMember` | Create, update events |
| Documents (read) | `WorkspaceGuest` | Guests can view shared project docs |
| Documents (write) | `WorkspaceMember` | Create, edit |
| TimeTracking (read) | `WorkspaceMember` | Own entries; Admin sees all |
| TimeTracking (write) | `WorkspaceMember` | Own entries only |
| Automations (read) | `WorkspaceMember` | View rules |
| Automations (write) | `WorkspaceAdmin` | Create, modify rules |
| Intake (manage) | `WorkspaceAdmin` | Form management |
| Intake (submit) | None (public) | Public submission endpoint |
| Notifications (read) | `WorkspaceGuest` | Own notifications |
| Search | `WorkspaceGuest` | Results filtered by accessible content |
| Billing | `WorkspaceOwner` | Subscription management |
| AI | `WorkspaceMember` | Requires plan entitlement check |
| Analytics (read) | `WorkspaceMember` | Members see project-scoped data |
| Analytics (export) | `WorkspaceAdmin` | PDF/CSV exports |
| Files (upload) | `WorkspaceMember` | Upload attachments |
| Files (delete) | `WorkspaceMember` | Own files; Admin for others |
| Admin (audit log) | `WorkspaceAdmin` | View audit trail |
| Admin (feature flags) | `WorkspaceOwner` | Manage workspace flags |

### 4.4 Permission Matrix

Detailed per-action permission matrix:

| Action | Owner | Admin | Member | Guest |
|--------|:-----:|:-----:|:------:|:-----:|
| **Workspace** | | | | |
| View workspace details | Y | Y | Y | Y |
| Update workspace settings | Y | Y | N | N |
| Delete workspace | Y | N | N | N |
| Manage billing | Y | N | N | N |
| Transfer ownership | Y | N | N | N |
| **Members** | | | | |
| View member list | Y | Y | Y | Y |
| Invite members | Y | Y | N | N |
| Change member roles | Y | Y | N | N |
| Remove members | Y | Y | N | N |
| **Projects** | | | | |
| Create project | Y | Y | Y | N |
| View project (any) | Y | Y | Y | Shared only |
| Update project | Y | Y | Y (lead) | N |
| Archive/delete project | Y | Y | N | N |
| **Tasks** | | | | |
| Create task | Y | Y | Y | N |
| View task | Y | Y | Y | Shared project |
| Update task | Y | Y | Y | N |
| Delete task | Y | Y | Own only | N |
| Move task (board) | Y | Y | Y | N |
| Add comment | Y | Y | Y | Shared project |
| **Goals** | | | | |
| Create goal | Y | Y | Y | N |
| View goals | Y | Y | Y | N |
| Update goal | Y | Y | Owner only | N |
| Delete goal | Y | Y | N | N |
| **Sprints** | | | | |
| Create sprint | Y | Y | Y | N |
| Start/complete sprint | Y | Y | Y | N |
| **Documents** | | | | |
| Create document | Y | Y | Y | N |
| View document | Y | Y | Y | Shared project |
| Edit document | Y | Y | Y | N |
| Delete document | Y | Y | Own only | N |
| **Automations** | | | | |
| View automation rules | Y | Y | Y | N |
| Create/edit rules | Y | Y | N | N |
| Delete rules | Y | Y | N | N |
| **AI** | | | | |
| Use AI copilot | Y | Y | Y | N |
| **Billing** | | | | |
| View subscription | Y | N | N | N |
| Manage subscription | Y | N | N | N |
| **Admin** | | | | |
| View audit log | Y | Y | N | N |
| Manage feature flags | Y | N | N | N |

### 4.5 Guest Access Scoping

Guests have restricted access to explicitly shared projects:

```csharp
// Guest project filter — applied in project queries
public class GuestProjectFilter
{
    public IQueryable<Project> Apply(IQueryable<Project> query, ITenantContext tenant)
    {
        if (tenant.Role == MembershipRole.Guest)
        {
            // Guests only see projects they were explicitly invited to
            var guestProjectIds = _db.Invitations
                .Where(i => i.Email == tenant.UserEmail
                    && i.Status == InvitationStatus.Accepted
                    && i.ProjectIds != null)
                .SelectMany(i => i.ProjectIds!);

            query = query.Where(p => guestProjectIds.Contains(p.Id));
        }
        return query;
    }
}
```

---

## 5. Authentication Endpoints

### 5.1 Endpoint Catalog

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|-----------|-------------|
| POST | `/api/v1/auth/register` | None | `auth` | Create account |
| POST | `/api/v1/auth/login` | None | `auth` | Email/password login |
| POST | `/api/v1/auth/refresh` | None | `auth` | Refresh token pair |
| POST | `/api/v1/auth/logout` | Bearer | `global` | Revoke tokens |
| POST | `/api/v1/auth/forgot-password` | None | `auth` | Request password reset |
| POST | `/api/v1/auth/reset-password` | None | `auth` | Reset password with token |
| POST | `/api/v1/auth/magic-link` | None | `auth` | Request magic link |
| POST | `/api/v1/auth/magic-link/verify` | None | `auth` | Verify magic link |
| GET | `/api/v1/auth/oauth/{provider}` | None | `auth` | Initiate OAuth flow |
| GET | `/api/v1/auth/oauth/{provider}/callback` | None | N/A | OAuth callback |
| GET | `/api/v1/auth/2fa/setup` | Bearer | `global` | Get TOTP setup info |
| POST | `/api/v1/auth/2fa/enable` | Bearer | `global` | Enable 2FA |
| POST | `/api/v1/auth/2fa/disable` | Bearer | `global` | Disable 2FA |
| POST | `/api/v1/auth/2fa/verify` | None | `auth` | Verify TOTP during login |
| POST | `/api/v1/auth/2fa/recovery` | None | `auth` | Use recovery code |
| POST | `/api/v1/auth/2fa/regenerate-recovery` | Bearer | `global` | New recovery codes |
| GET | `/api/v1/auth/sessions` | Bearer | `global` | List active sessions |
| DELETE | `/api/v1/auth/sessions/{id}` | Bearer | `global` | Revoke session |
| POST | `/api/v1/auth/sessions/revoke-all` | Bearer | `global` | Revoke all other sessions |
| GET | `/api/v1/users/me` | Bearer | `global` | Get current user profile |
| PUT | `/api/v1/users/me` | Bearer | `global` | Update current user profile |
| PUT | `/api/v1/users/me/password` | Bearer | `global` | Change password |

### 5.2 Request/Response Examples

**Register:**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "SecureP@ss123",
  "fullName": "Jane Doe"
}

→ 201 Created
{
  "id": "01957e72-...",
  "email": "jane@example.com",
  "fullName": "Jane Doe"
}
```

**Login:**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "SecureP@ss123"
}

→ 200 OK
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "dGhpcyBpcyBh...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "01957e72-...",
    "email": "jane@example.com",
    "fullName": "Jane Doe",
    "avatarUrl": null
  }
}

→ 200 OK (2FA required)
{
  "requiresTwoFactor": true,
  "twoFactorToken": "temp-token-..."
}
```

### 5.3 Validation Rules

| Field | Rule |
|-------|------|
| `email` | Required, valid email format, max 254 chars |
| `password` | Required, min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit |
| `fullName` | Required, 1-200 chars |
| `refreshToken` | Required, valid base64 string |

---

## 6. Frontend Integration

### 6.1 Token Storage

| Token | Storage | Rationale |
|-------|---------|-----------|
| Access token | In-memory (React state / context) | Not persisted across tabs — prevents XSS exfiltration |
| Refresh token | `httpOnly` secure cookie | Not accessible to JavaScript — prevents XSS exfiltration |

**Cookie configuration (set by server on login/refresh):**

```csharp
Response.Cookies.Append("__Host-refresh-token", refreshToken, new CookieOptions
{
    HttpOnly = true,
    Secure = true,
    SameSite = SameSiteMode.Strict,
    Path = "/api/v1/auth/refresh",
    MaxAge = TimeSpan.FromDays(7)
});
```

### 6.2 Refresh Interceptor

The frontend uses an Axios/fetch interceptor to transparently refresh expired tokens:

```typescript
// lib/api-client.ts
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include', // sends httpOnly cookie
  });

  if (!response.ok) {
    accessToken = null;
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await response.json();
  accessToken = data.accessToken;
  return accessToken;
}

async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Always include workspace context
  const workspaceId = getCurrentWorkspaceId();
  if (workspaceId) {
    headers.set('X-Workspace-Id', workspaceId);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && accessToken) {
    // Token expired — refresh once
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    await refreshPromise;
    headers.set('Authorization', `Bearer ${accessToken}`);
    response = await fetch(url, { ...options, headers });
  }

  return response;
}
```

### 6.3 Workspace Context

The frontend maintains the selected workspace in URL state or localStorage:

```typescript
// hooks/useWorkspace.ts
export function useWorkspace() {
  const [workspaceId, setWorkspaceId] = useState<string>(
    () => localStorage.getItem('workspace_id') ?? ''
  );

  const switchWorkspace = useCallback((id: string) => {
    setWorkspaceId(id);
    localStorage.setItem('workspace_id', id);
    // Invalidate all workspace-scoped queries
    queryClient.invalidateQueries();
  }, []);

  return { workspaceId, switchWorkspace };
}
```

---

## 7. Security Considerations

### 7.1 Attack Mitigation

| Attack | Mitigation |
|--------|-----------|
| Credential stuffing | Rate limit on `/auth` (20 req/15min per IP), account lockout (5 failures → 15 min lock) |
| Token theft (XSS) | Access token in memory only, refresh token in httpOnly cookie |
| Token theft (network) | HTTPS only, `Secure` cookie flag, HSTS headers |
| CSRF | `SameSite=Strict` on refresh cookie, `Path=/api/v1/auth/refresh` restricts scope |
| Refresh token reuse | Family-based rotation with reuse detection → revoke entire family |
| Email enumeration | Forgot-password always returns 200 regardless of email existence |
| Session hijacking | Session bound to device fingerprint (user-agent + IP prefix), mismatch triggers re-auth |
| Privilege escalation | Role checked per-request via middleware, not embedded in JWT |

### 7.2 Password Policy

```csharp
builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = false; // not required but allowed
    options.Password.RequiredUniqueChars = 4;

    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    options.User.RequireUniqueEmail = true;
});
```

### 7.3 Audit Trail

All authentication events are logged as `AuditEvent` records:

| Event | Fields Captured |
|-------|----------------|
| `auth.login.success` | userId, IP, userAgent |
| `auth.login.failure` | email (hashed), IP, reason |
| `auth.register` | userId, IP |
| `auth.logout` | userId, sessionId |
| `auth.refresh` | userId, tokenFamily |
| `auth.2fa.enabled` | userId |
| `auth.2fa.disabled` | userId |
| `auth.password.reset` | userId |
| `auth.oauth.linked` | userId, provider |
| `auth.session.revoked` | userId, sessionId, revokedBy |
| `auth.magic_link.sent` | email (hashed), IP |
| `auth.reuse_detected` | userId, tokenFamily, IP |

---

## 8. Configuration

### 8.1 appsettings.json

```json
{
  "Jwt": {
    "Issuer": "https://api.linearprecision.com",
    "Audience": "linear-precision-api",
    "AccessTokenLifetimeMinutes": 15,
    "RefreshTokenLifetimeDays": 7,
    "RsaPrivateKeyPath": "/secrets/jwt-rsa-private.pem"
  },
  "OAuth": {
    "Google": {
      "ClientId": "",
      "ClientSecret": ""
    },
    "GitHub": {
      "ClientId": "",
      "ClientSecret": ""
    },
    "Microsoft": {
      "ClientId": "",
      "ClientSecret": ""
    }
  },
  "MagicLink": {
    "LifetimeMinutes": 15,
    "MaxPerHour": 3
  }
}
```

### 8.2 Environment Variables (Production)

| Variable | Purpose |
|----------|---------|
| `JWT__RSAPRIVATEKEYPATH` | Path to RSA private key PEM file |
| `OAUTH__GOOGLE__CLIENTID` | Google OAuth client ID |
| `OAUTH__GOOGLE__CLIENTSECRET` | Google OAuth client secret |
| `OAUTH__GITHUB__CLIENTID` | GitHub OAuth client ID |
| `OAUTH__GITHUB__CLIENTSECRET` | GitHub OAuth client secret |
| `OAUTH__MICROSOFT__CLIENTID` | Microsoft OAuth client ID |
| `OAUTH__MICROSOFT__CLIENTSECRET` | Microsoft OAuth client secret |

---

## 9. Implementation Phases

| Phase | Scope | Week |
|-------|-------|------|
| **P0** | Email/password register + login, JWT access + refresh, basic RBAC (4 roles) | Week 3-4 |
| **P1** | OAuth (Google, GitHub, Microsoft), tenant resolution middleware | Week 4-5 |
| **P2** | Magic link auth, session management | Week 11 |
| **P3** | 2FA (TOTP + recovery codes) | Week 17 |
| **P4** | SAML SSO (Enterprise tier) | Week 25 |

---

## 10. Open Questions

| Question | Status | Notes |
|----------|--------|-------|
| Should refresh tokens be stored in PostgreSQL instead of Redis for durability? | Resolved: Redis | Refresh tokens are ephemeral (7-day TTL). Redis TTL handles cleanup automatically. PostgreSQL would require a cleanup job. |
| Should workspace role be embedded in JWT? | Resolved: No | Users can have different roles in different workspaces. Per-request lookup via middleware is more correct. |
| Should we support API keys for machine-to-machine auth? | Deferred | Not needed for MVP. Add when webhook/integration consumers need programmatic access. |
| Cookie vs localStorage for refresh token? | Resolved: httpOnly cookie | Prevents XSS access to refresh token. Path-restricted to `/api/v1/auth/refresh`. |
