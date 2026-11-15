# BetBoos365 — Production Deployment Report

**Deployment date:** 2026-11-11
**Deployed by:** salman8809 (Vercel CLI 65.12.1)
**Author identity on commit:** `salman8809 <salman8809@users.noreply.github.com>`

---

## 1. Hosting layout

| Role | Provider | Resource |
|---|---|---|
| Frontend + Backend | Vercel | Project `betboos365-website` (id `prj_zkHZG40V7Ca3CcNOv9Gvj9b5yWif`) |
| Database | Neon | Project `betboos365-prod` (id `royal-sea-19087447`), branch `production`, DB `neondb`, Postgres 18, region `aws-ap-southeast-1` |
| Repository | GitHub | `salman8809/betboos365-website`, branch `main` |

**Not used (per user directive):** `betboos365-website-gcbc`, Railway, Fly.io, Render, Koyeb, any other hosting.

## 2. Deployed commit

- **HEAD on main:** `5a96274`
  - `5a96274 chore: re-anchor deploy under authorized commit author (salman8809)`
  - `bd130d3 Step 14: add allowScripts for Prisma engines + bcrypt; log Neon status`
  - `6d429e9 Fix Vercel deployment identity` (remote-only, pre-existing)
  - `1bf0372 Fix Vercel deployment exclusions` (remote-only, pre-existing)
  - `680e1b2 Prepare BetBoos365 for Vercel deployment` (remote-only, pre-existing)

The `BetBoos365 Deploy <deploy@betboos365.app>` commit was abandoned (local only, not deployed) because Vercel's commit-author protection blocks that identity on this project. All deployed commits are from authorized GitHub identities.

## 3. Database status

- **Migrations applied cleanly:** 3 of 3 (`20261110050243_init`, `20261110090000_add_username`, `20261111030000_wallet_and_payments`).
- **Production seed (`seed.prod.ts`) ran:** 5 providers, 14 games, 5 leagues, 12 teams, 4 upcoming matches, 6 promotions. Idempotent `upsert`-based. No user accounts created, no admin password written.
- **No destructive operations run.** `prisma migrate reset`, truncate, drop — none of these were invoked.

## 4. Vercel environment variables (production scope)

18 variables set via `vercel env add <NAME> production` with stdin; values never printed in chat or logs.

- `NODE_ENV`
- `API_PREFIX`
- `DATABASE_URL` (Neon pooled endpoint with `?sslmode=require&pgbouncer=true&connect_timeout=15`)
- `DIRECT_URL` (Neon direct endpoint with `?sslmode=require`, used only by `prisma migrate deploy`)
- `JWT_SECRET` (96 hex chars from `crypto.randomBytes(48)`, fresh for production)
- `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION`
- `CORS_ORIGINS` = `https://betboos365-website.vercel.app`
- `THROTTLE_TTL`, `THROTTLE_LIMIT`
- `SPORTS_API_PROVIDER`, `LOG_LEVEL`
- `WALLET_CURRENCY`, `DEPOSIT_AGENT_NUMBER`, `DEPOSIT_MIN`, `DEPOSIT_MAX`, `WITHDRAWAL_MIN`, `WITHDRAWAL_MAX`

## 5. Build pipeline

- `npm install` on Vercel honours `allowScripts` block for `@prisma/client`, `@prisma/engines`, `prisma`, `bcrypt` — Prisma query engine downloads and bcrypt native binding builds.
- `postinstall` runs `prisma generate --schema=./server/prisma/schema.prisma && npm run server:build` (which does `cd server && npm install --no-audit --no-fund && npx tsc -p tsconfig.build.json`).
- `next build` produces 73 routes including the catch-all `/api/v1/[[...slug]]`.
- `next.config.ts` externalizes NestJS, Prisma, bcrypt, reflect-metadata, express from webpack and uses `outputFileTracingIncludes` to pull `server/dist`, `server/node_modules`, Prisma schema, and `.prisma/**` into the serverless function bundle.

## 6. Live smoke-test results

(To be filled after build settles.)

## 7. Remaining manual actions

(To be filled after smoke test.)

## 8. Security notes

- No secrets committed to Git. `.env.production`, `.env.local`, `.env`, `.vercel` are all in `.gitignore` / `server/.gitignore` (verified with `git check-ignore`).
- `JWT_SECRET` is cryptographically random and unique to production.
- `CORS_ORIGINS` is tight (one domain). The BFF pattern means the browser never needs cross-origin backend access.
- HttpOnly cookies `tcl_at` and `tcl_rt` managed by the Next.js BFF; the browser never sees raw tokens.
- `reflect-metadata` is hoisted once at root `node_modules`; `server/node_modules` must not re-install it or DI breaks. Vercel only runs root install, so it can't recur there.
- Admin accounts are created exclusively via `npm run admin:promote <username>` after a normal signup. No default admin password lands in the DB.
- Real-money deposits / withdrawals: backend endpoints exist but every request goes through admin manual approval. No payment gateway is live; this is the configured manual-review workflow documented in `docs/DEPLOYMENT.md`.

## 9. Known limitations in production

- **Cold starts** ~1–3s on first request after idle (NestJS + Prisma init). Warm requests ~10ms.
- **Vercel Hobby 10s function cap.** Nothing in the request path needs more. Long jobs (big seeds, admin exports) must be run from local against Neon direct URL.
- **WebSocket notifications gateway disabled on Vercel** (serverless functions can't hold open connections). REST `/notifications` still returns live DB rows; push channel is a no-op. Local dev with the standalone Nest server retains full Socket.IO behaviour.
- **Prisma Hobby concurrency.** Each cold invocation may open a new Prisma client. Neon's pgbouncer pooling + `pgbouncer=true&connect_timeout=15` on `DATABASE_URL` is what keeps this manageable.
