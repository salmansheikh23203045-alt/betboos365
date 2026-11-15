# BetBoos365 Production Deployment Readiness Audit

**Audit date:** 2026-11-11 16:46 (+06:00)  
**Target:** Vercel project `betboos365-website`  
**Production URL:** <https://betboos365-website.vercel.app>  
**Scope:** Current working-tree source and configuration, local build/type checks, Vercel project environment-variable names, and read-only production HTTP probes. No application code was changed and no deployment or database migration was run.

## Executive decision

**Overall readiness: NOT READY**

| Area | Readiness | Evidence summary |
|---|---:|---|
| Frontend | **80%** | `npm run build` and `npm run typecheck` pass. The current live site serves `/` but the production API paths checked return 404. |
| Backend | **25%** | 58 Nest route decorators are present, but the Vercel adapter omits bootstrap behavior that the frontend depends on. The generated Next function trace does not contain Nest/Prisma/backend files. |
| Database | **40%** | Prisma schema and three migration directories exist; Vercel has no production environment variables. A production database connection and migration state could not be verified. |
| Security | **NOT READY** | Known default JWT secret, missing production secrets, incomplete account invalidation, no effective rate-limit guard, broken refresh persistence in server-rendered session reads, and an unauthenticated Socket.IO identity event. |

These percentages are checklist estimates, not measured service-level scores. A successful Next build is not evidence that the embedded Nest runtime, PostgreSQL, or user-facing money flows work in production.

## Verified checks

- **Frontend build:** `npm run build` passed using Next.js 16.4.5 / Turbopack. The build reported 59 route entries and generated 49 static pages.
- **Frontend TypeScript:** `npm run typecheck` passed (`tsc --noEmit`).
- **Backend TypeScript:** attempted `npx tsc --noEmit -p server\tsconfig.json`; it failed with 58 diagnostics. The local root install is inconsistent with the manifest: root `package.json` asks for Prisma `^6.19.3`, root `package-lock.json` locks Prisma `^8.0.0-rc.33`, and installed Prisma is `8.0.0-rc.33`. `npm ls prisma @prisma/client --depth=0` reports Prisma invalid. The installed backend dependency tree is also absent (`server/node_modules` is missing), so this attempt is **not a clean, representative backend build**. No successful clean backend compile was verified.
- **Prisma CLI/generation:** `npx prisma generate --schema server/prisma/schema.prisma` failed because the installed Prisma 8 RC CLI reported no `generate` command. A separate attempt to use the backup CLI for schema validation failed because its `@prisma/engines` dependency is missing. No schema validation, client generation, or migration execution is claimed as passing.
- **Current Vercel production environment:** `vercel env ls --environment production` reported **no environment variables** for the linked project. Values were not requested or displayed.
- **Read-only live probes:** production `/` returned **200**; `/api/v1/promotions` and `/api/me/wallet/providers` returned **404**. These verify the currently deployed artifact only; they do not prove what a future deployment would serve.
- **Generated serverless trace:** after the local Next build, `.next/server/app/api/v1/[[...slug]]/route.js.nft.json` contained 113 traced paths and no `server/dist`, `server/node_modules`, Nest, Express, or Prisma paths. The handler dynamically requires `server/dist/app.module.js`, so the current generated trace does not demonstrate that the function will contain the files it needs.
- **API surface inventory:** 58 Nest controller route decorators and 22 Next `route.ts` modules (21 BFF/API modules plus the `/api/v1` catch-all) exist in source. These counts include overlapping proxy/backend operations and are not 80 unique URLs. The Next build proves route compilation, not production runtime behavior for each endpoint.
- **Working tree:** the repository already had modifications and untracked files before this audit. They were preserved; this audit did not edit application code.

## Critical blockers

### 1. Production Vercel project has no runtime configuration and current API probes 404

The linked Vercel project has no production environment variables. The live homepage responds, but the backend catch-all and wallet provider paths checked respond 404. The local `.env.local` points `BACKEND_API_URL` at localhost; that local configuration is not a production backend.

Relevant configuration: [`src/lib/api.ts`](src/lib/api.ts), [`src/app/api/v1/[[...slug]]/route.ts`](src/app/api/v1/[[...slug]]/route.ts), and [`.vercelignore`](.vercelignore).

### 2. Vercel upload/tracing excludes or fails to demonstrate the Nest runtime

The root [`.vercelignore`](.vercelignore) explicitly excludes `server/`, while the root `postinstall` builds from `server/` and the Next route requires `server/dist/app.module.js` at runtime. Although [`next.config.ts`](next.config.ts) declares tracing includes for backend output, the actual local route trace did not include any backend/Nest/Prisma paths. This leaves the deployment function without a verified runtime bundle. A Vercel deployment cannot be approved until a Vercel-produced function artifact contains the compiled module, all required runtime packages, Prisma client/engine, and schema.

### 3. Vercel Nest bootstrap differs from the standalone Nest bootstrap

[`src/lib/nest-handler.ts`](src/lib/nest-handler.ts) creates Nest and calls `app.init()`, but does not apply the global validation pipe, exception filter, interceptors, Helmet, or CORS setup applied in [`server/src/main.ts`](server/src/main.ts). The code comment in the adapter says these global providers are configured through `AppModule`; the inspected `AppModule` does not register them.

This creates an immediate response-contract problem: the standalone bootstrap's `TransformInterceptor` wraps successful responses as `{ success, data, timestamp }`, and the login/register BFF handlers read `body.data`. The Vercel bootstrap does not install that interceptor, while Nest controllers return their service value directly. Consequently, the BFF's expected `body.data` shape is not established by the Vercel path. DTO validation is also not established for that path.

### 4. Dependency lock/install state is inconsistent

Root `package.json` requests Prisma 6, but the modified root lockfile resolves Prisma 8 RC. The locally installed Prisma 8 RC cannot execute the postinstall's `prisma generate` command. Root `npm run build` does not run this postinstall, so its success does not prove a clean Vercel install will complete. Backend packages also exist in a separate `server/package-lock.json` with different versions from the root tree. A fresh, deterministic install plus the repository's actual `postinstall` and backend compile must pass before deployment.

### 5. Production database and migrations are not ready to verify

[`server/prisma/schema.prisma`](server/prisma/schema.prisma) declares both `DATABASE_URL` and `DIRECT_URL`; its direct URL is not optional in the schema even though comments in the example environment file describe it as optional locally. The local production env file has blank database URLs, and Vercel has no variables. Three migration directories exist, but no production database was contacted, so whether they are applied, compatible with the target database, or safe against its current data is **unknown**. No migration was run.

### 6. Production JWT key is mandatory; source falls back to a known development key

[`server/src/config/configuration.ts`](server/src/config/configuration.ts) uses a known development fallback when `JWT_SECRET` is absent and does not fail startup. With no Vercel environment variable configured, a Vercel bootstrap could sign/validate tokens using that fallback. This is a critical authentication security blocker. Configure a new cryptographically random secret (at least 32 bytes) in Vercel and ensure production startup refuses the development fallback.

## Feature-by-feature answers

### 1. Is the frontend fully ready for Vercel production?

**No.** Compilation, static generation, and frontend TypeScript checks pass. The Vercel project is linked and Next.js auto-detection appears to work locally, but the live API probes return 404, no production environment variables exist, and the generated function trace omits the dynamically loaded backend. Some public pages use static mock data from [`src/data/mock.ts`](src/data/mock.ts). Frontend build readiness is not end-to-end production readiness.

### 2–3. Can NestJS run correctly as Vercel Serverless Functions; is the architecture compatible?

**Not as currently verified.** A Nest application can be adapted to a request/response function, but this repository's current custom adapter is not equivalent to the standalone Nest bootstrap and its runtime files are absent from the local output trace. The conventional backend entry point calls `app.listen()` and is a long-lived HTTP server; Vercel requires a function entry point. The current adapter is an attempted adaptation, not a proven production-compatible backend.

### 4. Are all API routes configured?

The Next build compiles the source routes and the `/api/v1` catch-all is declared as Node runtime, dynamic, and allowed to handle standard HTTP verbs. However, the production URL probes return 404, the generated function trace lacks the backend files the catch-all requires, and bootstrap differences affect API behavior. Therefore **route compilation is verified; production API availability and correctness are not**.

### 5. Will signup, login, refresh, logout, and RBAC work?

**Not reliably / not production-ready.**

- Signup and login BFF handlers assume the Nest response has a `data` envelope. The Vercel bootstrap omits the `TransformInterceptor` that provides that envelope in the standalone server.
- Refresh rotation is implemented in Nest and refresh tokens are stored in PostgreSQL. However, `getSession()` refreshes an expired access token and returns the user without persisting the rotated tokens to cookies. Server components cannot set cookies, and `/api/auth/me` calls this same helper, so the browser can retain the old, revoked refresh token and lose its session on a later request. The lower-level `withAuthedBackend()` does attempt cookie updates in route-handler contexts.
- Logout clears local cookies but intentionally suppresses backend revocation failures. A failed request can leave the refresh token usable until it expires.
- RBAC decorators/guards exist, but inactive users are not checked by the JWT strategy or refresh path; deactivation alone does not revoke existing refresh tokens. Also, several endpoints require `admin` specifically, while the finance controller accepts both `admin` and `super_admin`; a `super_admin` role by itself does not satisfy those `admin` checks.
- No effective Throttler guard was found, and the Vercel bootstrap skips the global DTO validation pipe.

Relevant source: [`src/lib/session.ts`](src/lib/session.ts), [`src/app/api/auth/login/route.ts`](src/app/api/auth/login/route.ts), [`server/src/auth/auth.service.ts`](server/src/auth/auth.service.ts), [`server/src/auth/strategies/jwt.strategy.ts`](server/src/auth/strategies/jwt.strategy.ts), [`server/src/users/users.service.ts`](server/src/users/users.service.ts), and [`server/src/common/guards/roles.guard.ts`](server/src/common/guards/roles.guard.ts).

### 6–7. Is Prisma configured for serverless PostgreSQL; are migrations ready?

**Partially configured, not verified ready.** The schema comments recommend a pooled runtime `DATABASE_URL` and a direct migration `DIRECT_URL`, which is the right separation for pooled PostgreSQL. A `PrismaService` connects on Nest module initialization; the lambda adapter caches the Nest app promise per warm instance. This does not establish connection capacity under parallel lambdas, verify provider compatibility, or prove that the correct Prisma client/engine is in the function bundle.

Three migration directories and production migration scripts exist. The production database URL variables are not configured in Vercel, the production local template has empty URL values, and no migration status or schema drift check was performed. The SQL files alone do not prove they are applied or safe against the production database.

### 8. Environment variables to configure

Set these in the Vercel project settings for the intended environment(s), not in Git:

| Variable | Requirement / purpose |
|---|---|
| `DATABASE_URL` | **Required at runtime.** PostgreSQL connection suitable for serverless use (the schema comments expect a pooled URL). |
| `JWT_SECRET` | **Required at runtime.** Fresh cryptographically random secret, at least 32 bytes; do not use the code fallback or reuse a local value. |
| `DIRECT_URL` | **Required for schema validation/migration commands** because the Prisma schema declares it with `env("DIRECT_URL")`; use a direct, non-pooled PostgreSQL URL for DDL/migrations. |
| `BACKEND_API_URL` | Optional in the current helper because it falls back to `VERCEL_URL`. For explicit production configuration, point it to that deployment's own `/api/v1`; do not set it to localhost or make preview deployments call production unintentionally. |
| `WALLET_CURRENCY`, `DEPOSIT_AGENT_NUMBER`, `DEPOSIT_MIN`, `DEPOSIT_MAX`, `WITHDRAWAL_MIN`, `WITHDRAWAL_MAX` | Optional in code, but set and verify intentionally before enabling real-money flows. Code defaults are present, including a hard-coded payment contact value; the report does not repeat it. |
| `CORS_ORIGINS` | Only needed if the standalone Nest bootstrap or cross-origin clients are used. The current Vercel adapter does not call `enableCors`; same-origin BFF calls do not require browser CORS. |

`NODE_ENV` is supplied by Vercel. `VERCEL_URL` is supplied by Vercel. `PORT` and `API_PREFIX` are not used by the Vercel adapter (it hardcodes `api/v1`). `REDIS_*` are read into config but no Redis client use was found. `THROTTLE_*` are configured in the module, but no active global `ThrottlerGuard` was found. `SPORTS_API_*` do not switch the sports service away from the hard-wired mock adapter. Do not treat setting those unused values as enabling the feature.

### 9–10. Localhost and platform-specific features

- Local development config includes a localhost backend URL, local PostgreSQL URL, local Redis defaults, and localhost CORS origins. The frontend helper also falls back to localhost if neither `BACKEND_API_URL` nor `VERCEL_URL` exists.
- A Socket.IO `/ws` notifications gateway is registered. Vercel Functions do not provide the persistent WebSocket server behavior this gateway requires; no Vercel-compatible realtime implementation was verified. The gateway is not actually excluded by an environment guard in the inspected `NotificationsModule`.
- The gateway's `authenticate` handler accepts a caller-supplied `userId` without validating a JWT, and its Socket.IO CORS origin is `*`. Do not expose this gateway as an authenticated production service.
- No server-side file upload/storage implementation, cron scheduler, queue, or background-job processor was found. UI `setTimeout` calls are not backend jobs.
- REST notifications exist; the admin UI itself documents its notification center as unavailable.

### 11. Security findings

**No tracked `.env` credential file was found** (only `server/.env.example` is tracked), and the credential-pattern scan did not identify clear private-key/cloud-key material. Local ignored environment files exist; their values were not displayed. This is not a substitute for a full secret-history scan or external secret scanner.

Material issues:

1. **Critical — predictable JWT fallback:** missing `JWT_SECRET` does not stop production startup.
2. **High — disabled users can continue:** deactivation only flips `isActive`; refresh does not check it and JWT validation trusts the token payload without a user lookup.
3. **High — cookie refresh is not persisted by `getSession()`:** rotating refresh tokens can leave stale browser cookies.
4. **High — websocket identity is client-asserted:** `authenticate` trusts a supplied `userId`; wildcard CORS is configured.
5. **High — no active rate-limit guard found:** importing/configuring `ThrottlerModule` alone does not attach it globally or to endpoints.
6. **High — Vercel path omits global validation and response/security middleware** applied in `main.ts`.
7. **Additional hardening:** refresh tokens are stored as plaintext opaque values in the database; logout suppresses backend revocation errors; real-money/compliance controls remain explicitly planned rather than implemented.

[`server/docs/SECURITY.md`](server/docs/SECURITY.md) marks age verification, KYC, responsible-gaming controls, data rights, and geo-blocking as planned. Jurisdiction and licensing requirements were not provided; a qualified legal/compliance review is required before real-money launch.

### 12–14. Build, TypeScript, dependencies, and Vercel settings

- **`npm run build`: PASS** for the Next app.
- **`npm run typecheck`: PASS** for the root frontend TypeScript project.
- **Backend type-check/build: NOT VERIFIED / FAILED IN CURRENT INSTALL.** See the dependency mismatch above. The backend's own lockfile has its intended dependency set, but `server/node_modules` is absent. Do not report the backend as type-safe based on the root check.
- **Missing/incorrect build configuration:** root manifest/lock Prisma mismatch; broken local Prisma CLI `generate`; nested backend install/build in `postinstall`; backend source excluded by `.vercelignore`; generated route trace has no backend dependencies. No `vercel.json` exists, but that is not itself a blocker because Vercel normally detects a Next.js project.
- No complete Playwright/API integration suite was run. The available Playwright config expects manually started local services and the existing visual test does not verify the Vercel serverless adapter.

### 15–16. Can 73+ routes, wallet, deposits, withdrawals, admin, games, profiles, and notifications work?

The source contains more than 73 declared handler surfaces when backend route methods and frontend BFF route modules are counted together, but many are proxy/backend pairs, not unique URLs. The local Next build compiles the routes. **This does not establish that all can work in the production function**, and the checked production API paths currently return 404.

- **Wallet/deposit/withdrawal:** database-backed request, ledger, reservation, and admin decision flows exist. Payment providers are records/configuration, not an integrated payment gateway. Deposits rely on a user-entered reference and manual admin review; withdrawals require manual handling. Real-money payout/settlement, fraud checks, KYC, reconciliation, and operational procedures are not verified.
- **Admin finance:** endpoints and role guards exist, but they depend on database, auth, the broken Vercel response/bootstrap setup, and proper initial admin provisioning. The production content seed intentionally creates no user/admin accounts.
- **Games:** catalog operations use Prisma. `POST /games/:id/launch` records a launch and returns a message; no game-provider launch/session integration was found. Many public UI lists use static mock data.
- **Sports:** the module is hard-wired to `MockSportsAdapter`, returning synthetic event/score data; configuring `SPORTS_API_*` does not change that binding.
- **Profile and notifications:** user-scoped REST controllers exist, but reachability depends on the same backend catch-all and auth/session issues. Socket pushes will not work as a Vercel WebSocket gateway.
- **Admin UI:** the settings page itself labels notification center and global search unavailable and describes other modules as deferred/read-only.

## Exact actions required before approval

1. Resolve the Vercel-only backend packaging design. Include the backend source/build artifacts in the Vercel build input and produce a deployment trace that contains `server/dist`, the Nest runtime dependencies, Prisma client/engine, and schema. Verify by inspecting a Vercel build artifact; do not infer from `next build`.
2. Reuse one Nest application configuration path for both standalone and Vercel entry points. Ensure the Vercel path installs validation, exception handling, response wrapping, and required security middleware; confirm every BFF's response contract with request-level tests.
3. Reconcile root `package.json` and `package-lock.json` to the intended Prisma 6 version; use a clean install in the same way Vercel does, then run `postinstall`, backend compile/typecheck, Next build, and API smoke tests. Confirm no mismatch or nested-install dependency drift remains.
4. Choose and provision the production PostgreSQL provider. Set pooled `DATABASE_URL` and direct `DIRECT_URL`; test serverless connection limits, TLS, migrations, backup/restore, and cold starts. Review/apply migrations with an approved change process and verify resulting migration status before traffic.
5. Add `JWT_SECRET` to Vercel and remove/fail startup on the development fallback. Fix inactive-account validation, refresh-cookie rotation persistence, logout revocation observability, and active request throttling.
6. Disable or redesign Socket.IO for Vercel-only hosting, and require cryptographic identity verification if it is ever exposed. Do not claim live notification delivery until tested on the selected Vercel-compatible design.
7. Complete licensed sports/game/payment integrations, seed/reference data review, admin bootstrap, finance reconciliation, KYC/age/responsible-gaming/jurisdiction review, and manual payout procedures before accepting real money.
8. After those blockers are resolved, deploy a **preview only** with all required environment values; verify route trace/package contents and test signup, login, refresh past access expiry, logout/revocation, user/admin RBAC, profile, notifications, wallet, deposit/withdrawal state transitions, and direct database migration status. Production promotion remains a separate approval.

## Manual configuration summary

- Vercel production variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`; intentionally chosen wallet configuration values; optionally `BACKEND_API_URL` per production/preview deployment.
- PostgreSQL: create/provision a production database and verify the pooler/direct URLs, SSL, limits, and backups. No production DB was connected during this audit.
- Admin: provision an initial administrator through a reviewed secure procedure; production seed does not create one.
- Operations: choose a supported notification/realtime approach, payment and game providers, monitoring/alerts, incident response, and jurisdictional compliance controls.
- Current live site currently exposes only the homepage from the probes performed; confirm API deployment after an approved preview deployment.

## Scope limitations

This was a static/source and read-only deployment audit. I did not deploy, change code, install dependencies, access a database, run migrations, inspect secret values, or verify current Vercel build settings beyond linked-project environment-variable names. Production URL probes were GET-only. Production behavior not directly exercised is explicitly marked unverified above.
