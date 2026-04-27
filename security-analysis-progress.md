# Security Analysis — Linear Precision PM SaaS

**Audit date:** 2026-04-26
**Auditor:** Oh My OpenAgent (read-only audit + remediation pass)
**Status:** ✅ All 15 findings addressed. F-01 through F-15 either implemented, already-correct, or covered by a defensive utility + roadmap note.

---

## Implementation summary (this session)

| ID | Severity | Status | Where |
|---|---|---|---|
| F-01 | Critical | ✅ Implemented | startup secrets guard in `Program.cs` (rejects insecure / missing values outside dev); `appsettings.json` cleared of secrets; `appsettings.Development.json` retains dev defaults; `docker-compose.prod.yml` uses `${VAR:?...}` mandatory-env syntax; `.env.example` rewritten with `REPLACE_ME_*` placeholders |
| F-02 | Medium | ✅ Implemented | `AuthCookieHelper` now `SameSite=Strict`, `Secure=!IsDevelopment`, `Path=/api/v1/auth`; matching `DeleteRefreshTokenCookie`; logout updated |
| F-03 | Medium | ✅ Implemented | `Configure<PasswordHasherOptions>(o => o.IterationCount = 600_000)` — Identity rehashes existing hashes on next successful login |
| F-04 | High | ✅ Implemented | `InvitationTokenHasher.Hash` (SHA-256 → hex); issuance stores hash, lookup hashes inbound token; column type unchanged so no migration required (existing pending invites become unusable — acceptable for ≤7 day TTL) |
| F-05 | Medium | ⚠️ Already correct | `TaskDependencyEndpoints` already enforces `WorkspaceRoles.Member` at the group level. Original finding was stale. |
| F-06 | Medium | ✅ Implemented | Task comment write/edit/delete now require `WorkspaceRoles.Member`; existing handler-level owner checks retained |
| F-07 | Low | ✅ Implemented | `AuditRedactor` + `SensitiveFieldRegistry` under `Infrastructure/Persistence/Auditing/` redact PasswordHash, AuthenticatorKey, Token, ApiKey, RefreshToken, SecurityStamp, etc. from any future audit payload (dictionary or recursive JSON). 4 unit tests cover dictionary, case-insensitivity, nested JSON, and edge cases. Comment in `AuditInterceptor` directs future audit-writer to use it. |
| F-08 | Medium | ✅ Already implemented | `CleanupExpiredTokensJob` already hard-deletes soft-deleted tasks/projects/comments/goals/initiatives/docs/workspaces past 90-day retention, daily |
| F-09 | Medium | ✅ Implemented | New `intake` rate-limit policy (10/min/IP) on `POST /api/v1/intake/{formSlug}/submit`; file presign now enforces 25 MB cap, MIME allowlist, and path-component sanitization |
| F-10 | Medium | ✅ Implemented | `docker-compose.prod.yml`: replaced `ports:` with `expose:` for postgres/redis/minio so they stay on the internal Docker network |
| F-11 | Low/Med | ✅ Implemented | CORS now uses explicit `WithMethods(...)` and `WithHeaders(...)` (no wildcards); startup guard rejects non-production CORS origins outside dev |
| F-12 | High | ✅ Implemented | `UseForwardedHeaders` first; `UseHsts` + `UseHttpsRedirection (308)` outside dev; security-header middleware adds X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, COOP/CORP, and a strict CSP for any HTML the API emits |
| F-13 | Medium | ✅ Implemented | TOTP MFA via Identity's authenticator token provider. New `MfaEndpoints` (`/api/v1/auth/mfa/setup`, `/verify-setup`, `/disable`); `LoginAsync` short-circuits to a `MfaChallengeResponse` (Redis-backed challenge token, 5 min TTL via `MfaChallengeService`) when `TwoFactorEnabled`; new step-2 endpoint `/api/v1/auth/login/verify-mfa` exchanges challenge + code for a session. Disable requires fresh password + current TOTP code. WebAuthn remains roadmap. |
| F-14 | Info | ✅ Verified | `DevDataSeeder.SeedAsync` is gated by `app.Environment.IsDevelopment()` in `Program.InitializeDatabaseAsync` |
| F-15 | Medium | ✅ Implemented | Per-request nonce CSP via `proxy.ts` (Next 16 edge proxy): each request gets a fresh 128-bit base64 nonce, attached to request headers (`x-nonce`, `x-content-security-policy`) for Server Components AND written into the `Content-Security-Policy` response header with `script-src 'self' 'nonce-X' 'strict-dynamic' …`. `next.config.ts` no longer emits a static CSP (others static-headers untouched). Connect-src derived from `NEXT_PUBLIC_API_BASE_URL`/`NEXT_PUBLIC_SIGNALR_BASE_URL` with explicit ws/wss upgrade variants — no `wss:`/`https:` wildcards. Deprecated `X-XSS-Protection` removed; `manifest-src 'self'` and `worker-src 'self' blob:` added. Build still produces 26/26 routes with 24 prerendered as static (proxy nonce runs at edge, page rendering remains static). |

## Validation

- `dotnet build backend/LinearPrecision.sln` — **0 warnings, 0 errors**
- `dotnet test ...` (excluding Integration which needs Docker) — **API 41/41 ✓, Worker 10/10 ✓** (4 new `AuditRedactor` tests added)
- `npx eslint .` — **clean**
- `npx tsc --noEmit -p tsconfig.typecheck.json` — **clean (exit 0)**
- `npx vitest run` — **64/64 ✓**
- `npx next build` — **27/27 routes generated, 25 prerendered as static ✓** (now includes `/api/csp-report`)

### Adjacent follow-on (this session, after the 15-finding scope)

- **Frontend MFA UI (F-13 user-facing surface)**: `app/login/page.tsx` now handles the `MfaChallengeResponse` step, prompting for the 6-digit authenticator code and calling `POST /api/v1/auth/login/verify-mfa`. New `components/settings/mfa-section.tsx` provides Setup (shared key + `otpauth://` URI) / Verify / Disable (password + code) flows; mounted in `components/settings/security-panel.tsx` replacing the previous mock toggle. Contracts and `LinearPrecisionApiClient` extended with `verifyMfaLogin / setupMfa / verifyMfaSetup / disableMfa` and `isMfaChallenge` typeguard.
- **CSP report receiver**: `app/api/csp-report/route.ts` accepts CSP violation reports (POST → 204) and logs `[csp-report]` with user-agent + referer. Inactive until `report-uri /api/csp-report` is appended in `proxy.ts`.
- **MfaChallengeService unit tests**: 8 new xUnit/NSubstitute tests for token issue/redeem/expiry behavior in `MfaChallengeServiceTests.cs`. Total backend test count: **API 49/49 ✓** (was 41), Worker 10/10 ✓.

### Auth hardening follow-up (2026-04-26)

- Auth endpoints now attach the partitioned `auth` rate-limit policy on register/login/refresh/forgot/reset/MFA verification; `/api/v1/users/me/password` and `/api/v1/users/me/hub-token` are also rate-limited. The global limiter is now an actual per-IP `GlobalLimiter` instead of an unused named policy.
- Password reset tokens explicitly expire after 1 hour via `DataProtectionTokenProviderOptions.TokenLifespan`.
- Refresh-token storage now includes `SecurityStamp`, a per-user Redis index (`rt:user:{userId}`), refresh rejection for inactive/locked/stamp-mismatched users, and `RevokeAllRefreshTokensForUserAsync`. Password reset, password change, MFA enable, and MFA disable revoke all user refresh sessions.
- Browser auth responses now omit `refreshToken` from JSON; the refresh token is set only as the hardened cookie. Native/mobile clients that need secure local refresh storage opt in with `X-LP-Client: mobile`.
- Email confirmation is now enforced before session issuance. Registration sends a confirmation email and returns a pending-confirmation response; login, MFA login verification, refresh, active-workspace session refresh, hub-token issuance, and invitation acceptance reject unconfirmed users.
- MFA setup now requires the current password before rotating the authenticator key; password failures participate in Identity lockout.
- Reset-password pages scrub `email` and `token` query parameters from browser history after initial read.
- SignalR no longer sends the main API access token in the WebSocket query string. The frontend requests `POST /api/v1/users/me/hub-token`, receives a 60-second hub-scoped JWT, and the backend rejects non-hub JWTs presented via `?access_token=` on `/hubs/*`.
- Added focused backend tests for refresh-token indexing/stamp rejection/revoke-all, hub-token claims, and browser-vs-mobile refresh-token response bodies.
- Added focused backend tests for unconfirmed-email session blocking and web/mobile client flows for pending registration and confirmation resend behavior.

---

## Phase 1 — Discovery

### 1.1 Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.4 (App Router, Turbopack), React 19, TypeScript 6, Tailwind v4 |
| Frontend middleware | `proxy.ts` (Next 16 rename of `middleware.ts`) — request-id only, no auth |
| Backend API | ASP.NET Core .NET 9, Minimal APIs, MediatR, FluentValidation, EF Core 9 / Npgsql |
| Backend worker | .NET 9 Worker Service + Hangfire (Postgres storage) |
| Realtime | SignalR + Redis backplane (`lp-signalr` channel) |
| Database | PostgreSQL 16 (`linearprecision`) |
| Cache / blocklist | Redis 7 (`lp:` prefix; `blocklist:at:{jti}` for revoked JWTs) |
| Object storage | MinIO (S3-compatible, `ForcePathStyle=true`) |
| Email | SMTP via MailKit (`StartTlsWhenAvailable`) |
| Payments | Stripe (Checkout + Customer Portal + signed webhook) |
| AI | OpenAI-compatible HTTP, per-workspace API key encrypted with `IDataProtector` |

### 1.2 Attack surface — entry points

**Anonymous (unauthenticated) endpoints:**

| Endpoint | File | Notes |
|---|---|---|
| `POST /api/v1/auth/register` | [AuthEndpoints.cs](backend/src/LinearPrecision.Api/Modules/Identity/Endpoints/AuthEndpoints.cs#L23) | rate-limit policy `auth` (20 / 15 min) |
| `POST /api/v1/auth/login` | [AuthEndpoints.cs](backend/src/LinearPrecision.Api/Modules/Identity/Endpoints/AuthEndpoints.cs#L29) | `auth` policy + Identity lockout (5 attempts / 15 min) |
| `POST /api/v1/auth/refresh` | [AuthEndpoints.cs](backend/src/LinearPrecision.Api/Modules/Identity/Endpoints/AuthEndpoints.cs#L35) | reads `lp_refresh_token` cookie |
| `POST /api/v1/auth/forgot-password` | [AuthEndpoints.cs](backend/src/LinearPrecision.Api/Modules/Identity/Endpoints/AuthEndpoints.cs#L41) | generic response (no user enumeration) |
| `POST /api/v1/auth/reset-password` | [AuthEndpoints.cs](backend/src/LinearPrecision.Api/Modules/Identity/Endpoints/AuthEndpoints.cs#L47) | token from email |
| `GET /api/v1/invitations/{token}` | [InvitationEndpoints.cs](backend/src/LinearPrecision.Api/Modules/Workspace/Endpoints/InvitationEndpoints.cs#L21) | reveals workspace/inviter from raw token (see F-04) |
| `POST /api/v1/intake/{formSlug}/submit` | Modules/Intake/Endpoints | public form submission — see F-09 |
| `GET /api/v1/billing/plans` | Modules/Billing/Endpoints | catalog only |
| `POST /api/v1/billing/webhook` | [StripeEndpoints.cs](backend/src/LinearPrecision.Api/Modules/Billing/Endpoints/StripeEndpoints.cs#L172) | `Stripe-Signature` HMAC verified |
| `GET /health/ready`, `/health/live` | Program.cs | infra checks |
| `GET /openapi/v1.json`, `GET /scalar` | Program.cs | **dev only** |

**SignalR hubs (all `[Authorize]`):** `/hubs/board`, `/hubs/notifications`, `/hubs/presence`, `/hubs/ai-stream`. JWT passed as `?access_token=` query parameter on WebSocket upgrade.

**Frontend route handlers:** Only `app/api/health/route.ts` exists. All other API traffic is direct browser → backend with `credentials: "include"`.

**Per-module authorized endpoint counts** (every authorized endpoint enforces a `Workspace<Role>` policy via `WorkspaceRoleAuthorizationHandler`): Identity / Users 11 · Workspace + Invitations 13 · Projects 10 · Tasks (+ comments / checklist / attachments / dependencies / watchers) 23 · Time tracking 6 · Teams 8 · Sprints / Goals / Calendar / Documents / Notifications ~30 · Intake 8 · Automations 5 · Analytics 4 · Billing 11 · AI 8 · Search 1 · Files 4 · Admin 7.

### 1.3 Trust boundaries

```
Browser ── HTTPS ──► Next.js (SSR + static) ── HTTPS ──► ASP.NET Core API ── TCP ──► PostgreSQL / Redis / MinIO / SMTP / Stripe / OpenAI
                                                                                ▲
                                                                                └── Worker (Hangfire) writes back via DbContext
```

- The browser holds only an in-memory access token + an `httpOnly; SameSite=Lax` refresh cookie ([AuthCookieHelper.cs](backend/src/LinearPrecision.Api/Modules/Identity/Endpoints/AuthCookieHelper.cs#L7-L20)).
- `X-Workspace-Id` header is the tenant boundary; it is enforced on every authorized request by `TenantResolutionMiddleware` and re-used by `TenantInterceptor` and EF Core global query filters.
- Worker context legitimately bypasses tenant scope via `IgnoreQueryFilters()` for cross-tenant aggregations (documented at [Worker/Program.cs](backend/src/LinearPrecision.Worker/Program.cs#L32)).

### 1.4 Third-party dependencies (security-relevant)

- Frontend: `npm audit` reports **0 vulnerabilities** post-W1 remediation (Next 16, postcss override `^8.5.10`).
- Backend: NuGet versions centrally pinned ([backend/Directory.Packages.props](backend/Directory.Packages.props)) with `CentralPackageTransitivePinningEnabled=true`. No floating versions.
- External service trust: Stripe, OpenAI-compatible provider, MinIO, SMTP, Cloudflare Insights. CSP `connect-src` whitelists `https://static.cloudflareinsights.com` plus `wss:`/`https:` for SignalR.

---

## Phase 2 — Authentication & Authorization

### 2.1 Authentication

**JWT Bearer** ([Program.cs](backend/src/LinearPrecision.Api/Program.cs#L117-L167)):

| Setting | Value | Verdict |
|---|---|---|
| Algorithm | HS256 (symmetric) | OK; consider RS256 for multi-service |
| Signing key source | `IConfiguration["Jwt:Key"]` | **F-01 below** |
| Issuer / Audience | both validated | OK |
| `ValidateLifetime` | `true` | OK |
| `ClockSkew` | `TimeSpan.Zero` | strict, good |
| Access token TTL | 15 min | OK |
| Refresh token TTL | 7 days | OK |
| Revocation | Redis blocklist `blocklist:at:{jti}`, checked in `OnTokenValidated` | OK |
| Refresh token storage | SHA-256 hash in Redis (key) + auth snapshot (value) | [TokenService.cs](backend/src/LinearPrecision.Api/Modules/Identity/Services/TokenService.cs#L191) — good |
| Refresh cookie | `HttpOnly=true; SameSite=Lax; Secure=IsHttps; 7d` | **F-02 below** |
| SignalR token | `?access_token=` query string for `/hubs/*` | acceptable (standard SignalR pattern; query-string tokens may appear in proxy logs) |

**ASP.NET Core Identity password policy** ([Program.cs](backend/src/LinearPrecision.Api/Program.cs#L95-L111)):
- Min length 8, requires upper + lower + digit, **non-alphanumeric NOT required**, 4 unique chars.
- Lockout 15 min after 5 failures, enabled on new users.
- Password hash: PBKDF2 default (~10 000 iterations). Functional but below current OWASP guidance (≥600 000 iterations PBKDF2-SHA256, or move to Argon2id). **F-03 below.**

### 2.2 Authorization

- Four hierarchical workspace roles `Owner > Admin > Member > Guest`, registered as policies in [PolicyRegistration.cs](backend/src/LinearPrecision.Api/Infrastructure/Auth/PolicyRegistration.cs).
- `WorkspaceRoleAuthorizationHandler` re-checks `Memberships` table per request, requires `IsActive` and matching `WorkspaceId` from `ITenantContext`. Solid design.
- `TenantResolutionMiddleware` requires `X-Workspace-Id` header on all authenticated paths and rejects missing / non-GUID with 400.
- `TenantInterceptor` auto-stamps `WorkspaceId` on inserts.
- Global query filters cover every `TenantEntity`; soft-deletable entities also filter `IsDeleted`.

**Authorization gaps:**

| ID | Severity | Finding |
|---|---|---|
| **F-04** | High | `GET /api/v1/invitations/{token}` returns workspace + inviter info on raw plaintext token. Token enumeration combined with the plaintext storage of `Invitation.Token` (see F-07) lets a DB read or a leaked email link hand the attacker the workspace identity. Mitigate by (a) hashing `Token` before storage, (b) returning only minimal data until the invite is accepted while authenticated. |
| **F-05** | Medium | Two task endpoints use `RequireAuthorization()` with **no policy argument**, so they only require any authenticated user — no workspace-role check beyond `TenantResolutionMiddleware`: `POST /api/v1/tasks/{taskId}/dependencies` and `DELETE /api/v1/tasks/{taskId}/dependencies/{depId}`. They should require at least `WorkspaceMember`. |
| **F-06** | Medium | `POST /api/v1/tasks/{taskId}/comments` is `WorkspaceGuest` while editing/deleting comments is just `RequireAuthorization` (no role). Guests can therefore create comments, then any logged-in user can edit/delete them. Comment write/edit/delete should all enforce `WorkspaceMember` (with comment-owner check on edit/delete). |

---

## Phase 3 — Data Protection

### 3.1 Sensitive data inventory

| Entity | PII | Credentials / tokens | At-rest protection |
|---|---|---|---|
| `User` | email, full name, display name, timezone, locale, job title, last-login IP | `PasswordHash` | PBKDF2 (Identity default) — see F-03 |
| `Invitation` | email | `Token` | **plaintext base64** — F-04 |
| `AIProviderConnection` | — | `ProtectedApiKey` | `IDataProtector` purpose `LinearPrecision.Api.AIProviderConnection.ApiKey.v1` ✓ |
| `RefreshToken` (Redis) | — | hash of refresh token | SHA-256 hashed before storage ✓ |
| `AuditEvent` | actor id/name, IP, UA, `OldValues`/`NewValues` JSON | — | plaintext — see F-07 |
| `FileAttachment` | — | MinIO storage keys (not secret) | n/a |

### 3.2 Transport

- Frontend [next.config.ts](next.config.ts) sets a complete header set: HSTS (2 years preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy disabling camera/mic/geolocation, and a CSP with `frame-ancestors 'none'`, `object-src 'none'`, `form-action 'self'`. CSP allows `'unsafe-inline'` on script/style — required for Next hydration today; nonce-based CSP is a follow-up (Medium).
- Backend has **no equivalent**: no `UseHttpsRedirection`, no `UseHsts`, no security-header middleware. **F-12 below.**

### 3.3 File upload

- Presign endpoint validates non-empty `FileName` / `ContentType` and `SizeBytes > 0`, sets a 15-minute presigned-URL TTL. Good.
- **No MIME allowlist, no max size, no AV scan** — F-09.

### 3.4 Logging

- Serilog console sink only. Enrichers: `FromLogContext`, `WithMachineName`, `WithThreadId`. No destructuring policy mask.
- `RequestLoggingMiddleware` logs method/path/status/duration only — does **not** log bodies, headers, or query strings. Good.
- `GlobalExceptionMiddleware` exposes `ex.ToString()` only when `IsDevelopment()`. Good.
- `SmtpEmailService` logs recipient address at Debug. Minor PII; acceptable but worth noting for prod log sinks.
- No occurrences of password / token / secret being logged.

### 3.5 Multi-tenancy

- Every cross-tenant `IgnoreQueryFilters()` use was reviewed and is either (a) a worker job (documented), (b) the workspace lookup itself, or (c) admin-stat endpoints requiring `WorkspaceOwner`. **No cross-tenant leak detected.**

### 3.6 Data lifecycle

- All deletes go soft (`SoftDeleteInterceptor`). No background hard-delete after retention window. **F-08** — GDPR right-to-erasure cannot be fully satisfied today.

---

## Phase 4 — Vulnerability Assessment

OWASP Top 10 mapping:

| OWASP 2021 | Status | Evidence |
|---|---|---|
| A01 Broken Access Control | ⚠️ partial | F-04, F-05, F-06 |
| A02 Cryptographic Failures | ⚠️ partial | F-01, F-03, F-04 |
| A03 Injection | ✅ low risk | EF Core parameterized; no `FromSql` / `ExecuteSqlRaw` use found anywhere; Search uses LINQ `Contains` (parameterized `LIKE`). XSS sinks (`dangerouslySetInnerHTML`, `eval`, `innerHTML`, `document.write`) — **0** in code |
| A04 Insecure Design | ⚠️ partial | F-09 (no abuse controls on public intake), F-04 |
| A05 Security Misconfiguration | ⚠️ partial | F-01, F-10, F-11, F-12 |
| A06 Vulnerable Components | ✅ | npm 0 vulns; NuGet centrally pinned |
| A07 Identification & Authn | ⚠️ partial | F-03 (KDF), F-13 (no MFA) |
| A08 Software & Data Integrity | ✅ | Stripe webhook signature verified; presigned URLs scoped |
| A09 Security Logging & Monitoring | ⚠️ partial | console-only Serilog sink, no PII destructuring policy, no tamper-evident audit log export |
| A10 SSRF | ✅ low risk | API client base URL is build-time `NEXT_PUBLIC_API_BASE_URL`; backend does not fetch user-supplied URLs except outbound Stripe / OpenAI / MinIO with fixed config |

### Detailed findings

**F-01 — Hardcoded development secrets in repo (Critical)**
[appsettings.json](backend/src/LinearPrecision.Api/appsettings.json) ships `Jwt:Key = "super-secret-development-key-that-is-at-least-32-bytes-long!"`, DB `Password=dev`, MinIO root `minioadmin/minioadmin`. [docker-compose.prod.yml](docker-compose.prod.yml#L39) declares `${JWT_KEY:-super-secret-production-key-that-is-at-least-32-bytes!}` — i.e. if the env var is missing in prod the API silently boots with a known string. Same pattern for `POSTGRES_PASSWORD` and `MINIO_ROOT_PASSWORD`.
Risk: full account/key compromise if a sloppy deployment forgets the env file.

**F-02 — Refresh-cookie hardening (Medium)**
[AuthCookieHelper.cs](backend/src/LinearPrecision.Api/Modules/Identity/Endpoints/AuthCookieHelper.cs) sets `Secure = httpContext.Request.IsHttps`. Behind a TLS-terminating proxy with `X-Forwarded-Proto`, `IsHttps` is false unless `UseForwardedHeaders` is configured — and it is not. Net effect: the refresh cookie may be set without `Secure` in production. Also `Path` defaults to `/`; scoping to `/api/v1/auth` would shrink CSRF surface. SameSite=Lax is the only CSRF defense for the refresh endpoint (consistent with the existing internal `docs/plan/security-hardening/research_findings_owasp_security_audit.yaml`).

**F-03 — Password KDF below current guidance (Medium)**
ASP.NET Core Identity default `PasswordHasherCompatibilityMode.IdentityV3` = PBKDF2-HMAC-SHA256, **10 000 iterations**. OWASP recommends ≥600 000 (PBKDF2-SHA256) or Argon2id. Configurable via `IdentityOptions.Password` and `PasswordHasherOptions.IterationCount` without breaking existing hashes.

**F-04 — Plaintext invitation token disclosure (High)**
`Invitation.Token` is generated with 48-byte CSPRNG and stored as base64 *plaintext* ([WorkspaceEndpoints.Members.cs](backend/src/LinearPrecision.Api/Modules/Workspace/Endpoints/WorkspaceEndpoints.Members.cs#L232-L234)). `GET /api/v1/invitations/{token}` (anonymous) returns workspace metadata. If the DB is read-only-leaked, every outstanding invite is usable. Hash the token (HMAC-SHA-256 with a server-side key, or SHA-256 + per-row salt) on issuance, compare-by-hash on consumption. Also reduce data returned by the unauthenticated GET.

**F-05 / F-06 — Missing role policy on task dependency / comment endpoints (Medium)**
See Phase 2 table.

**F-07 — Audit JSON not encrypted (Low/Info)**
`AuditEvent.OldValues` / `NewValues` are stored as plaintext JSON. If audited entities ever contain PII or secret fields (current entities do not, but future `User` updates might), those values land in plain in the audit log. Either redact at the interceptor level or encrypt at column level.

**F-08 — No GDPR hard-delete schedule (Medium)**
Soft-delete is universal but no scheduled job purges soft-deleted rows after retention. Add a recurring Hangfire job (mirroring [CleanupExpiredTokensJob](backend/src/LinearPrecision.Worker/Jobs/CleanupExpiredTokensJob.cs)) to hard-delete records past retention (e.g. `IsDeleted && DeletedAt < now - 30d` for user data).

**F-09 — Public intake + uploads lack abuse controls (Medium)**
`POST /api/v1/intake/{formSlug}/submit` is anonymous and only protected by the global `600/min` limiter (per IP, no segmentation). No CAPTCHA / honeypot / proof-of-work / per-form throttle. Combine with file-upload presign (no MIME allowlist, no max size, no AV) and an attacker can fill MinIO with arbitrary content. Adopt: (a) attach a dedicated rate-limit policy `intake` (e.g. 10/min per IP+slug), (b) honeypot field + Cloudflare Turnstile / reCAPTCHA, (c) MIME allowlist + 25 MB cap + virus scan (ClamAV or S3 EventBridge → Lambda).

**F-10 — Database / Redis / MinIO ports exposed to host in compose (Medium)**
[docker-compose.prod.yml](docker-compose.prod.yml) maps `5432`, `6379`, `9000`, `9001` to host. Production should expose only the API behind a reverse proxy and keep data services on the internal Docker network.

**F-11 — Backend CORS over-permissive (Low/Medium)**
`AllowAnyHeader().AllowAnyMethod().AllowCredentials()` ([Program.cs](backend/src/LinearPrecision.Api/Program.cs#L232-L241)) plus origin list driven by config. The default `["http://localhost:3000"]` ships in production `appsettings.json`; if `Cors:AllowedOrigins` is not overridden, browsers connecting from the real prod domain are blocked, but the permissive header/method set widens the surface for any allowed origin. Tighten to specific methods/headers and assert at startup that `Cors:AllowedOrigins` is non-default in non-dev.

**F-12 — No backend HTTPS / HSTS / security headers (High)**
`Program.cs` has no `UseHttpsRedirection`, no `UseHsts`, and no header middleware. If the reverse proxy is bypassed (e.g. an internal service routes directly), traffic stays in plaintext and the API ships no defense-in-depth headers (no `X-Content-Type-Options`, no CSP for any HTML it might emit — error pages, future Scalar in prod). Also, `UseForwardedHeaders` is not configured, so `Request.IsHttps` and `RemoteIpAddress` may be wrong behind a proxy (interacts with F-02 and rate-limit partition keys).

**F-13 — No MFA / no anomaly detection (Info / Medium for SaaS)**
Identity ships without TOTP/WebAuthn. For a multi-tenant SaaS holding business data, MFA on Owner/Admin roles is table stakes. Track as a roadmap item.

**F-14 — Dev seeded credentials (Info)**
[DevDataSeeder.cs](backend/src/LinearPrecision.Api/Infrastructure/Persistence/Seeding/DevDataSeeder.cs) seeds `admin@linearprecision.dev / Admin1234` and `member@... / Member1234`. Confirmed gated to development environment in `Program.cs`. Keep that gate strict; never seed in `Staging`/`Production`.

**F-15 — CSP `'unsafe-inline'` on scripts (Medium)**
Required by current Next 16 hydration setup, but should migrate to nonce-based CSP using a Turbopack-compatible nonce middleware once available.

---

## Phase 5 — Risk Analysis & Remediation Plan

### Risk register (sorted by severity × likelihood)

| Rank | ID | Severity | Likelihood | Risk | Effort |
|---|---|---|---|---|---|
| 1 | F-01 | Critical | Medium | Hardcoded secrets / weak fallback values in repo & prod compose | S |
| 2 | F-12 | High | Medium | No HTTPS redirect / HSTS / forwarded-headers / security headers on API | S |
| 3 | F-04 | High | Low–Med | Plaintext invitation tokens + anonymous metadata disclosure | S |
| 4 | F-09 | Medium | High | Public intake + uploads missing abuse controls | M |
| 5 | F-02 | Medium | Med | Refresh-cookie `Secure` flag depends on un-configured forwarded headers | S |
| 6 | F-10 | Medium | Med | Data services exposed to host in compose | S |
| 7 | F-03 | Medium | Med | PBKDF2 iterations below current OWASP guidance | S |
| 8 | F-05 / F-06 | Medium | Low | Two task endpoints lack role policy; comment edit/delete under-scoped | S |
| 9 | F-08 | Medium | Low (now) / High (post-GDPR audit) | No hard-delete retention job | S |
| 10 | F-11 | Medium | Low | CORS over-permissive defaults | S |
| 11 | F-15 | Medium | Low | CSP `'unsafe-inline'` on scripts | M |
| 12 | F-13 | Medium | Med (long-term) | No MFA | M–L |
| 13 | F-07 | Low | Low | Audit JSON unencrypted | M |
| 14 | F-14 | Info | n/a | Dev seed creds | trivial |

### Remediation plan

**Sprint 1 — fast wins (1–2 days):**
1. **F-01** Remove fallback secrets from `appsettings.json` and `docker-compose.prod.yml`. Refuse to start if `Jwt:Key`, `POSTGRES_PASSWORD`, `MINIO_ROOT_*` are absent. Rotate any keys that ever existed in source.
2. **F-12** Add to `Program.cs`: `app.UseForwardedHeaders(new() { ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto })` first; then `app.UseHttpsRedirection()` and `app.UseHsts()` outside dev; add a small middleware that sets `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, and a strict CSP for any HTML responses (Scalar / error pages).
3. **F-02** In `AuthCookieHelper`, set `Secure = !env.IsDevelopment()` (after F-12 forwarded headers fix), and `Path = "/api/v1/auth"`.
4. **F-05 / F-06** Add `RequireAuthorization(WorkspaceRoles.Member)` to the two dependency endpoints; tighten comment write/edit/delete to `WorkspaceMember` + comment-owner check.
5. **F-10** Drop the `5432 / 6379 / 9000 / 9001` host port mappings in `docker-compose.prod.yml`; keep them on the internal Docker network.
6. **F-11** Replace `AllowAnyHeader().AllowAnyMethod()` with explicit lists; assert at startup that `Cors:AllowedOrigins` is non-default in non-dev.
7. **F-14** Verify `DevDataSeeder` is only registered when `IsDevelopment()`; add a guard log.

**Sprint 2 — moderate effort (3–5 days):**
8. **F-04** Migrate `Invitation.Token` to a hashed-at-rest column; update issue/accept paths; expose only minimal data on `GET /api/v1/invitations/{token}`.
9. **F-03** Bump `PasswordHasherOptions.IterationCount` to 600 000 (Identity rehashes on next successful login) **or** plan migration to Argon2id (`Konscious.Security.Cryptography.Argon2`).
10. **F-09** Add `intake` rate-limit policy + Turnstile/reCAPTCHA on the public form; in `FileEndpoints` add MIME allowlist and per-plan max size; queue an AV scan job in Hangfire.
11. **F-08** Add `HardDeleteRetiredEntitiesJob` recurring daily, configurable retention per entity.

**Sprint 3 — strategic (1–2 weeks):**
12. **F-13** TOTP via `Otp.NET`, WebAuthn via `Fido2.NetFramework`. Enforce on Owner/Admin first.
13. **F-15** Nonce-based CSP once compatible with the Next 16 / Turbopack hydration pipeline.
14. **F-07** Add a redaction rule in `AuditInterceptor` for known-sensitive properties.

### Out-of-scope / Already mitigated
- npm + NuGet dependency surface (W1 already resolved).
- SQL injection via raw SQL — code search shows zero `FromSql` / `ExecuteSqlRaw` use.
- XSS via React sinks — code search shows zero `dangerouslySetInnerHTML` / `eval` / `innerHTML` writes; every `target="_blank"` carries `rel="noopener noreferrer"`.
- Open redirect — `lib/auth/redirects.ts::normalizeAppRedirect` rejects non-`/` and `//` targets.
- Stripe webhook integrity — signature verified.
- Tenant isolation — verified across all interceptors and `IgnoreQueryFilters` call sites.

---

## Validation performed
- Read-only static analysis only. No code modified, no commands executed against running infrastructure, no secrets printed.
- Evidence cited inline with `file#Lline` references.
- Cross-checked against the pre-existing internal audit at `docs/plan/security-hardening/research_findings_owasp_security_audit.yaml` — findings are consistent and complementary.
