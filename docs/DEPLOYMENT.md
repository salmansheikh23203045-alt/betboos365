# BetBoos365 Production Deployment Guide

**Status:** prepared — awaiting user approval to execute live deployment.

This guide describes the production topology and the exact browser steps the
owner performs to bring it up. The agent cannot perform the browser-auth
steps (Vercel OAuth, Neon OAuth, Railway OAuth) — those require the owner's
account credentials.

---

## 1. Architecture

```
┌──────────────────────────────┐
│  Browser (user)              │
│   cookies: tcl_at, tcl_rt    │
│   HttpOnly, Secure, SameSite=Lax
└──────────────┬───────────────┘
               │  HTTPS
               ▼
┌──────────────────────────────┐        server-side only
│  Vercel                      │   fetch (Authorization: Bearer)
│  Next.js 16 (betboos365-website)  │─────────────────────────────┐
│  /api/auth/*, /api/me/*      │                             │
│  BFF cookies + proxy         │                             │
└──────────────────────────────┘                             │
                                                             ▼
                                              ┌────────────────────────────┐
                                              │  Railway                   │
                                              │  NestJS (betboos365-backend)    │
                                              │  Dockerfile, /health,      │
                                              │  JWT, Prisma, Socket.IO    │
                                              └─────────────┬──────────────┘
                                                            │
                                                            │  pooled (pgbouncer) + direct (migrations)
                                                            ▼
                                              ┌────────────────────────────┐
                                              │  Neon                      │
                                              │  Postgres 17 (betboos365-prod)  │
                                              │  SSL required              │
                                              └────────────────────────────┘
```

**Why this split:**

- **The browser never sees JWTs.** It only sees HttpOnly cookies set on the
  Vercel domain. The backend domain never needs cross-site cookies, so
  SameSite=Lax is enough and we avoid the `SameSite=None` attack surface.
- **The backend never receives cookies.** Next.js attaches
  `Authorization: Bearer <access-token>` on the server side.
- **The backend doesn't need public CORS.** Server-to-server fetches aren't
  CORS-gated. We set `CORS_ORIGINS` to the Vercel origin anyway, so admin
  tools and the future WebSocket upgrade work from the browser too.

---

## 2. Required environment variables

### 2.1 On Vercel (`betboos365-website` project)

| Name               | Where set                    | Scope               | Example                                            |
|--------------------|------------------------------|---------------------|----------------------------------------------------|
| `BACKEND_API_URL`  | Vercel → Project → Settings → Environment Variables | Production (+ Preview) | `https://<railway-service>.up.railway.app/api/v1` |

That is the **only** variable the frontend needs. It must NOT be prefixed
with `NEXT_PUBLIC_` — it is read server-side only, so the browser never sees
the backend URL.

### 2.2 On Railway (`betboos365-backend` service)

Copy the shape from `server/.env.production.example`. The values marked
SECRET are entered in the Railway Variables UI; nothing lands in git.

| Name                     | Required | Notes |
|--------------------------|----------|-------|
| `NODE_ENV`               | yes      | `production` |
| `API_PREFIX`             | yes      | `api/v1` |
| `DATABASE_URL`           | yes (SECRET) | Neon POOLED endpoint, with `?sslmode=require&pgbouncer=true&connect_timeout=15` |
| `DIRECT_URL`             | yes (SECRET) | Neon DIRECT endpoint (no `-pooler.`), with `?sslmode=require` — Prisma uses it for `migrate deploy` |
| `JWT_SECRET`             | yes (SECRET) | ≥32 random chars; generate with `openssl rand -base64 48`; must differ from the dev value |
| `JWT_EXPIRATION`         | yes      | `15m` (keep short) |
| `JWT_REFRESH_EXPIRATION` | yes      | `7d` |
| `CORS_ORIGINS`           | yes      | `https://betboos365-website.vercel.app` (comma-separated if more) |
| `THROTTLE_TTL`           | yes      | `60` |
| `THROTTLE_LIMIT`         | yes      | `100` |
| `SPORTS_API_PROVIDER`    | yes      | `mock` (keep until a licensed provider is signed) |
| `LOG_LEVEL`              | yes      | `info` in prod |
| `ENABLE_SWAGGER`         | no       | Leave UNSET to keep `/api/v1/docs` private. Set to `true` only intentionally. |
| `PORT`                   | **no**   | Railway injects this at runtime; do not set manually. |
| `REDIS_*`                | no       | Leave blank until the cache/pubsub layer is wired. |

---

## 3. Owner-executed steps (browser)

The agent **cannot** perform these — they need the owner logged into each
provider. Perform them in this order; after each step, report back and the
agent will verify.

### 3.1 Neon — provision the production database (≈5 min)

1. Open **https://console.neon.tech/signup** and sign up / log in with the
   owner's preferred SSO.
2. Create a new project: name `betboos365-prod`, region closest to where most
   users live (for a BD audience, pick `ap-southeast-1 Singapore`), Postgres
   version **17** (match the local dev).
3. On the project page → **Connection Details** → turn **Pooled connection**
   ON. Copy TWO URLs:
   - **Pooled** → `DATABASE_URL` (contains `-pooler.` and `pgbouncer=true`)
   - **Direct** → `DIRECT_URL` (no `-pooler.`)
4. Under **Branches**, confirm a single `main` branch exists. Do NOT create
   any data yet — the Railway container's first boot will run Prisma
   migrations.
5. Hand the two connection strings back to the agent via Railway's env UI
   in the next step; do **not** paste them into any chat.

### 3.2 Railway — provision the backend service (≈10 min)

1. Open **https://railway.com/new** and sign up / log in with GitHub
   (recommended, enables redeploys on push).
2. Push the repository to GitHub first if it isn't there yet. The agent
   will not do this without approval — when ready, say "push this repo to
   GitHub as a new private repo under my account" and the agent will walk
   through `gh repo create` and confirm visibility.
3. In Railway, click **New Project** → **Deploy from GitHub repo** → pick
   the BetBoos365 repo. When asked for the service's **Root Directory**, enter
   `server`. The `server/Dockerfile` and `server/railway.json` already
   present will be detected.
4. Settings → **Networking** → click **Generate Domain** to get a
   `https://<something>.up.railway.app` URL.
5. Settings → **Variables** → enter every row from the table in §2.2,
   pasting the Neon URLs from §3.1 into `DATABASE_URL` and `DIRECT_URL`.
   For `CORS_ORIGINS`, use `https://betboos365-website.vercel.app` (and append
   any other allowed origins as a comma-separated list).
6. Trigger the first deploy. Watch the logs — success looks like:
   ```
   Applying migration `20261110050243_init`      <- skipped, already run
   Applying migration `20261110090000_add_username`  <- skipped
   ...
   [Nest] ... Server running on port 8080 (env=production)
   [Nest] ... API prefix: /api/v1
   [Nest] ... Healthcheck: /api/v1/promotions
   ```
   (Railway chooses a port via `$PORT`; the number varies.)
7. Hit `https://<your-railway-domain>/api/v1/promotions` from a browser —
   should return `{"success":true,"data":[...]}` with the seeded (or empty)
   promotions list. This is both Railway's configured healthcheck and a
   working read against Neon. If it 500s, check Railway logs for a Prisma
   connection error → likely the Neon URLs are wrong.

### 3.3 Seed production content + bootstrap the first admin

The database comes up empty after `prisma migrate deploy`. There are two
scripts in the backend repo, both safe to run in production:

- **`npm run prisma:seed:prod`** — populates CONTENT only: 5 game providers,
  14 games, 4 sports / 5 leagues / 12 teams / 4 upcoming matches, 6 active
  promotions. **No user accounts are created, no passwords are hardcoded.**
  The script is idempotent (re-running it does not duplicate rows), so it's
  safe to re-run after editing content.
- **`npm run admin:promote -- <username>`** — promotes an existing user to
  the `admin` role. Refuses to run if the username doesn't exist.

Owner flow for the first admin:

1. **Content seed.** Agent runs `npm run prisma:seed:prod` from the Railway
   service shell once, at launch. Confirm the `Providers: 5 … Promotions:
   6 created` output.
2. **Owner signup.** Owner opens `https://betboos365-website.vercel.app/signup`
   and registers with a strong password of THEIR choice. (Backend enforces
   ≥8 chars, mixed case, and a digit — pick something longer.)
3. **Promote.** Agent opens a Railway shell on the backend service and runs
   `npm run admin:promote -- <owner_username>`. The CLI will print
   `Promoted "<username>". Roles now: [user,admin]`.
4. **Verify.** Owner logs out and back in; visits `/admin` and sees the
   dashboard. If it 307s to `/`, the promotion didn't land — re-run the
   CLI with `--list` to confirm current admins.

**Revoke flow** (kill an admin without deleting the user):
`npm run admin:promote -- --revoke <username>`. Logs an `ADMIN_ACTION`
audit row with the before/after roles.

### 3.4 Vercel — wire the frontend to the live backend (≈2 min)

1. Open **https://vercel.com/salman8809/betboos365-website/settings/environment-variables**.
2. Add a new variable:
   - Name: `BACKEND_API_URL`
   - Value: `https://<your-railway-domain>/api/v1`
   - Environments: **Production** AND **Preview** (check both).
3. The agent re-deploys via `vercel promote` on an approved Preview build
   — do NOT click Redeploy in the Vercel UI unless you want to bypass the
   verification pass.

### 3.5 Agent-executed smoke test (post-deploy)

After the owner confirms §3.1–§3.4, the agent will:

1. Deploy a new Vercel Preview on the current branch.
2. Hit the Preview's `/api/auth/register` → confirm HttpOnly cookies set
   with `Secure=true` (because `NODE_ENV=production` flips the flag).
3. Confirm the Railway backend received the request (Railway logs show a
   POST to `/auth/register`), the Neon row count went up by one, and the
   refresh token row was written.
4. Hit `/api/auth/me` with cookies → user returned.
5. Hit `/profile` while authed → 200.
6. Hit `/admin` as a non-admin → 307 → `/`.
7. Hit `/promotion` → live Neon promotions in the HTML.
8. Report back with the Preview URL. Owner approves → agent promotes to
   production via `vercel promote`.

---

## 4. Rotation and incident response

| Scenario                               | Action                                                                                           |
|----------------------------------------|--------------------------------------------------------------------------------------------------|
| `JWT_SECRET` leaked                    | Rotate on Railway → every existing access token is invalidated on next request; refresh tokens stored in DB need manual `UPDATE refresh_tokens SET "revoked_at"=NOW();` |
| `DATABASE_URL` leaked                  | Neon Console → **Reset password** on the role → paste new URLs into Railway variables            |
| Vercel account compromised             | Revoke all tokens under https://vercel.com/account/tokens, rotate the GitHub integration         |
| Railway account compromised            | Same drill: https://railway.com/account/tokens, rotate GitHub integration                        |
| Need to roll back a migration           | Neon branching: create a new branch from the point-in-time before the migration, repoint `DATABASE_URL` + `DIRECT_URL` to the branch, then redeploy |

---

## 5. Known issues

- **No dedicated `/health` endpoint.** A standalone `HealthModule` was built
  but didn't route under Express 5 + Nest 11 for reasons that weren't root-
  caused in the time available (routes logged as `Mapped` by the RouterExplorer
  but requests 404'd). Railway's healthcheck is pointed at the public
  `GET /api/v1/promotions` instead — this works (HTTP 200 + DB round-trip).
  When a future step wires observability, a proper `/health` endpoint is
  worth revisiting.

## 6. What is NOT yet set up

These are deliberately deferred — not blockers for a first production
launch, but worth tracking:

- **WebSocket gateway** (`/ws` namespace, Socket.IO). The server exposes it
  but the frontend doesn't connect yet. When connecting from the browser,
  the Vercel origin must be in Railway's `CORS_ORIGINS` for the Socket.IO
  handshake to succeed; it already is.
- **Redis** for session cache and cross-instance pub/sub. Needed when the
  service scales past one replica. Currently Railway deploys one replica,
  so this is safe to defer.
- **Content-safe seed script.** See §3.3 — needs an owner decision.
- **Observability.** No external APM/log aggregator wired. Railway and
  Vercel each ship their own logs; add Sentry/Logtail when traffic warrants.
- **Rate-limiting config review.** `THROTTLE_LIMIT=100` per 60s per IP. For
  public endpoints this is generous; tighten `/auth/*` specifically in a
  later step.
