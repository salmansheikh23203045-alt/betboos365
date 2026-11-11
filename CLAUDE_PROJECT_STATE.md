# CLAUDE_PROJECT_STATE — TCL11 Website

**Last updated:** 2026-11-11 (Step 13 committed; Step 14 production deploy in progress — blocked on 2 browser-only signups)

---

### Step 14 — Production deployment (2026-11-11, IN PROGRESS — pivoted to free stack, blocked on 2 browser signups)
- **Architecture pivot (user-approved 2026-11-11 ~16:05):** Railway Hobby ($5/mo) was pre-approved then superseded by a user directive to use only free providers. Research (WebSearch, 2026-11-11) confirmed:
  - **Render** — free Web Service tier still exists (512 MB RAM, 0.1 CPU, sleeps after 15 min idle with ~60s cold start, 750 instance-hours/month per workspace, Docker supported). Signup via GitHub OAuth — no card required for the free plan. Chosen for backend.
  - **Neon** — free Postgres tier (0.5 GB storage, project `tcl11-prod`, Postgres 17). Signup via Google OAuth, no card required. Chosen for DB.
  - **Vercel** — already linked (unchanged); free Hobby plan covers the Next.js frontend.
  - **Koyeb** — rejected: Feb 2026 change requires a $29 pre-authorization card hold.
  - **Railway** — rejected per user: Hobby $5/mo not free.
- **Email in use for NEW signups:** `salman23203045@hotmail.com` (switched from `salmanrorvi72@gmail.com` mid-session). Any resources already created under another identity must be reused, not duplicated.
- **Already-connected accounts (DO NOT re-create):**
  - **Vercel** — logged in as `salman8809`, project `tcl11-website` (id `prj_zkHZG40V7Ca3CcNOv9Gvj9b5yWif`, team `team_1Uz2EyzBGAlyXwVYmBzIiFNw`), CLI 65.12.1, production env currently empty. This is the target project — the deploy will add `BACKEND_API_URL` and `vercel --prod` here.
  - **PostgreSQL 17 local** — running on `localhost:5432` for dev; irrelevant to production.
  - **NestJS backend local** — rebuildable from `server/dist/` and bootable with `node dist/main.js` for local testing.
- **Autonomous prep completed this session:**
  - Railway CLI 5.71.0 installed globally (kept — may still be useful as a fallback).
  - JWT_SECRET generated (96 hex chars, `crypto.randomBytes(48)`) and stored in `server/.env.production` (gitignored by `server/.gitignore`'s `.env.*` pattern — verified with `git check-ignore -v`).
  - `server/.env.production` created with every non-secret var pre-filled; DATABASE_URL and DIRECT_URL left blank as the single local-disk place for the Neon strings.
  - **`render.yaml` Blueprint committed** at repo root. Declares the `tcl11-backend` free Web Service in Singapore, points at `server/Dockerfile`, injects every non-secret env var, marks DATABASE_URL / DIRECT_URL / JWT_SECRET as `sync: false` so they only live in Render's UI, never in the repo. Health-check path `/api/v1/promotions`.
  - Dockerfile unchanged (`prisma migrate deploy && node dist/main.js` on boot) — Render consumes it as-is.
  - All Step 13 work (User Center, onboarding, nav replacement, login UX) committed as `470b65c` — 73 Next.js routes building cleanly.
- **Blocked on user action (3 browser OAuth signups, ~10 min total, zero cards):**
  1. **GitHub repo** — the code needs to live on GitHub for Render to pull from. User runs `gh auth login` on their machine ONCE (device-code flow, 30s), then I create the repo and push commit `470b65c`.
  2. **Neon signup** — https://console.neon.tech/signup → **Sign in with Google** with `salman23203045@hotmail.com` (bypasses email verification). Create project `tcl11-prod`, Postgres 17, Singapore. Paste pooled URL into `server/.env.production` after `DATABASE_URL=` with `&pgbouncer=true&connect_timeout=15` appended, and direct URL after `DIRECT_URL=`.
  3. **Render signup** — https://render.com/register → **Sign up with GitHub** (same account used in step 1). Click **New → Blueprint**, pick the `tcl11` repo — Render reads `render.yaml` and provisions the service. Paste `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` into the service's Environment tab (values are in `server/.env.production` locally).
- **Remaining fully-autonomous steps (triggered by user saying "all three done"):**
  - Verify blockers: `gh auth status`, test SSH push access, confirm Neon URLs in `.env.production`, confirm Render service responding.
  - Push commit `470b65c` to the new GitHub repo.
  - Wait for Render auto-build (Blueprint triggers on first push).
  - `curl` Render URL → verify `GET /api/v1/promotions` returns 200.
  - One-off: run `prisma db seed` against the Neon direct URL from local machine using `seed.prod.ts` (content-only; no default admin password lands in DB).
  - `vercel env add BACKEND_API_URL production` with the Render URL.
  - `vercel --prod` to push commit `470b65c` frontend.
  - Live smoke test: register → login via BFF → `/api/auth/me` → wallet balance → deposit submit (PENDING) → admin login → logout.
  - Replace this "IN PROGRESS" block with actual URLs, deployment IDs, and raw test output.

---

### Login "Backend unreachable: fetch failed" fix (2026-11-11)
- **Symptom reported by user:** login page displays `Backend unreachable: fetch failed` instead of logging in.
- **Root cause (not a code bug):** the NestJS backend process on `localhost:3200` was **not running**. `src/lib/api.ts::backendFetch()` already catches connection failures (ECONNREFUSED / ENOTFOUND / aborted / DNS) and returns a synthetic `503` with `{"message":"Backend unreachable: <detail>"}` — that message was being surfaced verbatim by `src/app/login/page.tsx` as the user-facing error. Root-cause confirmed by `curl -s -o NUL -w "%{http_code}" http://localhost:3200/api/v1/promotions` → connection refused (exit 7) before restart; `200` after. `.env.local` was correct (`BACKEND_API_URL=http://localhost:3200/api/v1`), the Next.js BFF code was correct, the backend build artifact `server/dist/main.js` existed.
- **Fix part A — run the backend** (`cd server && node dist/main.js`): Prisma reconnects, 35+ routes mapped, health probe (`GET /api/v1/promotions`) returns 200. No secrets rotated, no env changes.
- **Fix part B — improve login error UX** (`src/app/login/page.tsx`): added `friendlyLoginError(status, raw)` that translates the 3 real failure modes into clear Bangla and **never** leaks "fetch failed" or "Backend unreachable" to users:
  - `503` or any `fetch failed|ECONNREFUSED|ENOTFOUND` text → "সার্ভারে পৌঁছানো যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
  - `401` → "ভুল ইউজারনেম বা পাসওয়ার্ড।" (invalid credentials, distinct from backend down)
  - `≥500` → "সার্ভার সমস্যায় রয়েছে। পরে আবার চেষ্টা করুন।"
  - validation-shaped 400/409 strings still surface if they look user-friendly; otherwise generic Bangla fallback.
  - Client-side validation messages ("ইউজারনেম এবং পাসওয়ার্ড দিন।" etc.) also translated.
  - No auth logic changed: BFF still calls `/auth/login`, HttpOnly cookies `tcl_at`+`tcl_rt` are still set the same way, refresh rotation still works.
- **End-to-end verification against the restarted backend (2026-11-11):**
  - Backend health: `GET /api/v1/promotions` → 200.
  - Direct backend `POST /auth/login {demo, Test1234}` → 201 with JWT access + refresh tokens + user object.
  - Direct backend `POST /auth/login {demo, WRONG}` → 401 `{"message":"Invalid username or password"}`.
  - BFF `POST /api/auth/login {demo, Test1234}` → 200, `Set-Cookie: tcl_at` and `tcl_rt` both `HttpOnly`, response body `{user:{id,username,email,firstName,lastName,roles}}` — **no tokens in the body**.
  - BFF `GET /api/auth/me` with the cookie jar → 200, user returned (hits the authed backend transparently).
  - BFF `POST /api/auth/login {demo, WRONG}` → 401 `{"message":"Invalid username or password"}` (surfaced through `friendlyLoginError` as the Bangla "ভুল ইউজারনেম বা পাসওয়ার্ড।").
  - BFF `POST /api/auth/logout` with cookies → 200 `{"ok":true}`.
  - Frontend `tsc --noEmit`: 0 errors. `next build`: all 73 routes compile cleanly (unchanged route count — the fix is one file edit).
- **Production implication:** on Vercel, `BACKEND_API_URL` must be set to the live NestJS URL (Railway, after Step-10-era deployment prep). `friendlyLoginError` works there identically — a Railway outage will show the same Bangla "server unreachable" line instead of leaking internals.

---

## 1. Current development step
**Step 12 — Full project completion, Bangla UI, Fishing Game, missing routes** (COMPLETE locally; 59 routes build; all 36 anonymous route probes + 14/17 authed admin probes pass, the 3 misses are super_admin-only pages correctly guarded for an admin session; 31/31 wallet E2E still green). Step 11 (Wallet) and Step 10 (Admin dashboard) remain locally verified. Production Deployment is still unstarted — proceed when owner approves.

### Game-artwork consistency fix (2026-11-11)
- **Symptom reported:** Desktop game cards showed "ASSET PENDING" placeholders while mobile correctly rendered WebP artwork — same games, different components, divergent image mapping.
- **Root cause:** [`src/components/games/GameCard.tsx:45`](src/components/games/GameCard.tsx#L45) rendered `<AssetPlaceholder>` inside a wrapper marked `max-lg:hidden`, so on mobile the placeholder was invisible (letting the surrounding WebP crops from `MobileGameTiles` show through) while on desktop the placeholder was the only thing rendered because `POPULAR_GAMES`/`FEATURED_GAMES`/`CASINO_GAMES`/etc. in [`src/data/mock.ts`](src/data/mock.ts) and [`src/data/pages.ts`](src/data/pages.ts) had no `artSrc`. Mobile used its own `mobileHome.ts` tiles that did carry `artSrc` — so the two trees fell out of sync.
- **Fix — one artwork pipeline, every viewport:**
  - [`src/lib/gameArt.ts`](src/lib/gameArt.ts) — single `resolveGameArt(gameId)` map covering every id used anywhere in the data layer (popular, featured, casino, slots, live-casino) and a deterministic `gameAccent(gameId)` helper. Points at the existing `public/images/games/popular/*.webp`, `public/images/games/featured/*.webp` and `public/images/games/popular/slot.svg` files — **no new binary assets shipped**, no unlicensed provider logos invented.
  - [`src/components/games/BrandedTile.tsx`](src/components/games/BrandedTile.tsx) — procedurally-drawn inline SVG fallback (radial gradient in TCL palette, 16-ray starburst, gold-stroked medallion with the title's initial, bottom red strip). Looks like intentional casino art, not a placeholder. Hash-tinted per game id so tiles don't look identical.
  - [`src/components/games/GameCard.tsx`](src/components/games/GameCard.tsx) — rewrites artwork resolution to: `game.artSrc` → `resolveGameArt(game.id)` → `BrandedTile`. The `max-lg:hidden` discrepancy is gone; identical tree at every viewport. Image `sizes` bumped to `180px` so desktop hits sharper candidates. No path can produce an "Asset pending" box or an empty box.
  - [`src/components/promo/PromotionBanner.tsx`](src/components/promo/PromotionBanner.tsx) — removed the `AssetPlaceholder` fallback; empty slots now render an intentional `BannerArt` branded SVG (red/gold radial + gold medallion). [`src/components/home/HomeDesktop.tsx`](src/components/home/HomeDesktop.tsx) now points the Sports banner at the existing `/images/sports/sports-art.svg` so it carries real art instead of the fallback.
- **Other files unchanged:** mobile tiles (`MobileGameTiles`, `mobileHome.ts`) already carried their own `artSrc`; nothing to rewrite. The only remaining `AssetPlaceholder` import is in `src/components/dev/DesignSystemShowcase.tsx`, which is the dev route and `notFound()`s in production.
- **Verification (2026-11-11):**
  - Frontend `tsc --noEmit`: 0 errors. `next build`: 59 routes clean.
  - `grep "Asset pending\|ASSET PENDING"` on live dev-rendered HTML for `/`, `/casino`, `/slots`, `/live-casino`, `/esports`: **0 hits on every page** (was 10+ before on desktop).
  - `/casino` server-rendered HTML now references 18 distinct game image files (`/images/games/popular/*.webp`, `/images/games/featured/*.webp`, `/images/games/popular/slot.svg`).
  - `/esports` server-rendered HTML now contains BrandedTile SVG markers (`bt-rad-`, `bt-gold-`) for every tile — those games intentionally have no stock artwork and use the branded fallback.
  - Full route audit re-run: **36/36 OK**, no 4xx/5xx.
- **Spec constraints honoured:**
  - No fake provider logos invented — the only artwork used is either the WebP crops the user supplied, the hand-built `slot.svg`, or the procedural `BrandedTile` SVG that is clearly abstract branding (initial letter + star medallion, not a logo).
  - Design system untouched: black base, red neon border, gold medallion, white typography.
  - Mobile rendering identical to before (its tree was already working); the fix is strictly additive on the desktop tree.
- **Known residuals (not regressions):**
  - Esports titles still use the branded fallback because licensed esports game art isn't in the repo. They now read as intentional branded tiles, not "pending" boxes.
  - Slot-game titles under `/slots` map to the closest provider WebP (e.g. multiple Pragmatic Play slots share the Pragmatic tile) so every tile has real-looking artwork; individual game artwork is a future step tied to provider licensing.

### Step 12 — Project completion pass (2026-11-11)
- **Bangla UI layer (`src/i18n/bn.ts`):** A single typed string table keyed by domain (`nav`, `auth`, `wallet`, `tx`, `profile`, `admin`, `fishing`, `responsibleGaming`, `notifications`, `referral`, `common`, `footer`). ~180 strings in standard Bangla Unicode, written to reach ~70 % Bangla / 30 % English on every visible surface. Imported where it matters instead of a runtime i18n framework (the site is single-locale, so a plain object compiles to zero runtime cost). Applied to: `AdminSidebar` (13 labels), `AdminTopbar` (dashboard header, dropdown links, logout), public `NAV_ITEMS` and `MOBILE_TABS` (nav + bottom tabs now Bangla), `FOOTER_COLUMNS` (sections + links re-translated and extended with new routes), `WHY_CHOOSE_FEATURES`, Profile tabs + stat tiles + wallet card + Deposit/Withdraw labels, `/login` page (Bangla "Log In", "Sign Up", forgot-password link in Bangla), all new Step-12 pages.
- **New public routes (all 200 OK on `next build`):**
  - `/forgot-password` ([`src/app/forgot-password/page.tsx`](src/app/forgot-password/page.tsx)) — password-reset form, honest "self-service reset not yet configured" banner, directs the user to `/contact`. Does NOT fake a reset flow.
  - `/notifications` ([`src/app/notifications/page.tsx`](src/app/notifications/page.tsx)) — authed, pulls from `GET /api/v1/notifications`, 307s anonymous visitors. Renders live rows with read/unread styling, empty-state copy, and a backend-down banner. **No mock data.**
  - `/referral` ([`src/app/referral/page.tsx`](src/app/referral/page.tsx) + [`src/components/referral/ReferralCard.tsx`](src/components/referral/ReferralCard.tsx)) — authed; code derived from the user's username, copy-to-clipboard for code and link, WhatsApp/Telegram/Facebook/X share buttons with `wa.me` / `t.me` / Facebook / Twitter share URL templates. Honest "coming soon" banner noting the payout ledger isn't live.
  - `/responsible-gaming` ([`src/app/responsible-gaming/page.tsx`](src/app/responsible-gaming/page.tsx)) — 4 commitment cards, 5 warning signs, 3 real external helplines (BeGambleAware, GamCare, Gamblers Anonymous), link to `/contact` and `/faq`. Pure Bangla editorial copy.
  - `/fishing` ([`src/app/fishing/page.tsx`](src/app/fishing/page.tsx) + [`src/components/fishing/FishingGame.tsx`](src/components/fishing/FishingGame.tsx)) — see below.
- **Fishing Game — interactive canvas demo (virtual points only):**
  - 60 fps `<canvas>` with device-pixel-ratio scaling and window-resize handling.
  - Underwater art pipeline: layered sea gradient, drifting light shafts (additive blending), rising bubbles, procedurally drawn fish with glowing body/tail/fin silhouettes and animated phase bob.
  - Four fish kinds — small (10 pts, 1 HP), medium (25 pts, 2 HP), large (60 pts, 4 HP), boss (180 pts, 8 HP) — weighted spawn probabilities, bidirectional swim with `@scale(-1,1)` mirroring, random vertical drift via `sin(phase)`.
  - Cannon aims at the mouse/touch pointer, clamped to never aim below the water line; red bullet projectiles with life, velocity, and glow. Reload cooldown of 6 frames. Ammunition: 200 bullets per round; auto game-over when ammo + in-flight bullets reach zero.
  - Particles: 18-splash burst when a fish dies; 6-spark burst on any hit.
  - Controls: mouse move + click to shoot; `Space` to shoot; `P` to pause; on-canvas Play / Pause / New Game overlays; external Play/Pause/Restart buttons; sound toggle (Web Audio API `OscillatorNode` beeps — defaults muted to respect auto-play policies, user can un-mute).
  - HUD: live Score and Bullets tiles pinned to the canvas, clear game-over screen with final score and a New Game button.
  - Explicit note on the page and in the game: **"ভার্চুয়াল পয়েন্টের ডেমো — আসল টাকা জড়িত নেই"** (virtual points only, not connected to the wallet). Follows the spec constraint to never couple unconfigured games to real-money flow.
- **Nav / footer updates:** added `fishing` to `NAV_ITEMS`, added `referral` + `notifications` + `responsible-gaming` to the appropriate footer columns. `MOBILE_TABS` unchanged (5 primary tabs stay — the reference's design is still authoritative for the mobile bottom nav).
- **Admin Reports page** ([`src/app/admin/reports/page.tsx`](src/app/admin/reports/page.tsx)) — replaces the `PendingSection` placeholder. Fetches `GET /api/v1/admin/dashboard` + `GET /api/v1/admin/finance/summary` and renders two tile grids (Platform + Finance) with values from live DB counts. Fields matched to the backend's actual response (`totalUsers`, `activeUsers`, `recentRegistrations`, `totalGames`, `activePromotions`, `openTickets`, `connectedClients` + the finance status breakdown). Falls back gracefully when either call fails.
- **Login UX:** Bangla "পাসওয়ার্ড ভুলে গেছেন?" link to `/forgot-password`; submit button and signup link translated.
- **Zero broken-link verification (route-audit):**
  - Anonymous walk: 22/22 public routes + 14/14 admin redirects = **36/36 pass**, no 4xx/5xx.
  - Authed walk as `admin`: 11/14 admin pages return 200 inline (others 307 — super_admin-only, correctly hidden from the admin sidebar), plus 3/3 authed user routes 200. The 307s are not failures.
  - Backend wallet E2E re-run against live local DB: **31/31 pass**.
- **Honouring the spec constraints:**
  - No mock-data pretending — notifications pulls live rows, admin reports pulls live counts, referral payouts and forgot-password are flagged as honestly "not yet configured" rather than faked.
  - All UI palette (black/red/gold/white), existing components (NeonCard, PageBanner, PrimaryButton, SecondaryButton), and the mobile bottom nav were preserved.
  - No real-money wagering touches Fishing — explicit demo badge, 200 virtual bullets, no wallet call on fire/hit/death.
- **Builds:** Frontend `tsc --noEmit`: 0 errors. `next build`: 59 routes (previously 54), all compile cleanly. Backend `tsc --noEmit`: 0 errors.
- **Known limitations (documented, not blockers):**
  - `/forgot-password` cannot send a reset — SMS/email gateway not configured. Fallback is a Contact Support CTA.
  - `/referral` shows a stable derived code but has no payout tracking yet — deliberate.
  - The notifications bell in the admin topbar is still disabled (no notifications dashboard). Only the public `/notifications` reads live data.
  - Bangla coverage targets ~70 % of visible text; some legal/informational blocks (Terms, Privacy, deeper admin pages that pre-date Step 12) are still in English. Future passes can replace them from the `BN` table without new infrastructure.

### Dev-server resilience fix (2026-11-11)
- **Symptom reported:** `GET / 500` with `TypeError: fetch failed · ECONNREFUSED ::1:3200`. Root cause: the NestJS backend process on `localhost:3200` was not running (stopped at the end of the previous session), and `src/app/layout.tsx` calls `getSession()` on every request. For a visitor with existing `tcl_at`/`tcl_rt` cookies, `getSession()` → `backendFetch('/users/me')` would throw an un-caught `TypeError`, which Next.js surfaces as 500. Anonymous visitors did not hit this path and still returned 200, so the error only appeared for logged-in users (or users with stale cookies from a prior session).
- **Fix:** [`src/lib/api.ts`](src/lib/api.ts) — `backendFetch()` now wraps the underlying `fetch(...)` in try/catch and, on network failure (ECONNREFUSED / ENOTFOUND / aborted / DNS), returns a synthetic 503 `Response` with `{ message: "Backend unreachable: <detail>" }`. Every existing caller already branches on `res.ok` and surfaces errors through its own fallback (e.g. promotion page falls back to mock, `getSession()` returns null, BFF routes return 503 to the browser). No caller crashes the render anymore.
- **Behaviour verified (backend intentionally STOPPED):**
  - `GET /` (anonymous) → 200.
  - `GET /` with stale `tcl_at`/`tcl_rt` cookies → 200 (session resolves to null, page renders as anonymous).
  - `GET /promotion` with stale cookies → 200 (falls back to mock promotions).
  - `GET /login` → 200.
  - No 500s anywhere.
- **Behaviour verified (backend STARTED on :3200):**
  - `GET /api/v1/promotions` → 200 (Railway's healthcheck target).
  - `GET /` → 200.
  - `GET /api/me/wallet/config` (anonymous proxy → public backend) → 200 and returns `{currency:"BDT", agentNumber:"01956869852", deposit:{min:100,max:100000}, withdrawal:{min:500,max:50000}}`.
- **Runtime status at write time:** PostgreSQL 17 service `postgresql-x64-17` running on 5432 · NestJS backend running on `:3200` (built artifact `server/dist/main.js`) · Next.js dev server running on `:3000` · `.env.local` at repo root unchanged (`BACKEND_API_URL=http://localhost:3200/api/v1`) · `server/.env` unchanged (DB credentials).
- **Startup commands (unchanged — for future sessions):**
  - PostgreSQL: Windows service, autostart.
  - Backend: `cd server && node dist/main.js` (requires `nest build` first if source changed).
  - Frontend dev: `npx next dev` from repo root.
- **No UI / auth / feature changes.** The fix is strictly the one `backendFetch` wrapper; no components, routes, DTOs, cookies, or schema were touched.
- **Verifications:** Frontend `tsc --noEmit`: 0 errors. `next build`: 54 routes generated cleanly. HTTP smoke test on all five test URLs above: 5/5 pass.

Step 01 was accepted by the user (they issued Step 02). Step 03 must NOT start until Step 02 is approved.

---

## 2. Completed tasks
- [x] Inspected project folder `E:\TCL betting website` — empty (no `package.json`, no source, no git repo, no config).
- [x] Analysed the desktop reference separately from the mobile reference (see `docs/UI_REFERENCE_ANALYSIS.md`).
- [x] Identified every visible section and the mobile bottom tab bar.
- [x] Estimated color, typography, spacing, border, glow, gradient, and image-proportion values.
- [x] Inventoried required assets (`docs/UI_REFERENCE_ANALYSIS.md` §7).
- [x] Proposed component architecture and file structure (`docs/COMPONENT_ARCHITECTURE.md`).
- [x] Created this state file and the two docs.

### Step 02 — completed
- [x] Scaffolded Next.js 16.4.5 (App Router, `src/`), React 19.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.5 (`@tailwindcss/postcss`), Framer Motion 14.10.1, Swiper 14.4.0, Lucide React 1.70.0, clsx. No backend.
- [x] Colour tokens and type scale as Tailwind v4 `@theme` variables (`src/app/globals.css`).
- [x] Effect utilities: `neon-border-red`, `neon-border-gold`, `glow-red`, `glow-red-soft`, `glow-gold`, `bg-gold-gradient`, `bg-red-gradient`, `bg-card-dark`, `bg-fire-glow`, `text-gold-gradient`, `text-outline-dark`, `hover-sheen`, `hover-glow-red`, `btn-gold`, `btn-red`, `no-scrollbar`. Blur capped at 14px; only transform/opacity animated; reduced-motion respected.
- [x] Typography: Anton (display) + Inter (UI/body) via `next/font/google`. Responsive display sizes via `clamp()`.
- [x] Components built (all 16 requested):
  - Logo (`ui/Logo`), DesktopHeader, DesktopNavigation, MobileHeader, MobileBottomNavigation (`layout/`)
  - PrimaryButton (red), SecondaryButton (gold / outline), shared metrics in `ui/button-styles.ts`
  - NeonCard, SectionHeading, Pill, CarouselArrow, AssetPlaceholder (`ui/`)
  - GameCard, GameCarousel (Swiper), GameGrid (`games/`)
  - PromotionBanner (`promo/`), VIPProgressCard (`vip/`), LiveTransactionTable (`transactions/`), PaymentMethods (`payments/`), Footer (`layout/`)
- [x] TypeScript interfaces in `src/types/index.ts`; mock data in `src/data/mock.ts`; icon registry `src/lib/icons.ts`.
- [x] Showcase page at `/` (`src/app/page.tsx`) renders every component for review. Home composition is Step 03.
- [x] Verification: `tsc --noEmit` passes; `next build` passes; desktop (1440px) and mobile (390px) screenshots checked; horizontal overflow 0 on both; mobile bottom nav renders fixed at bottom.

### Step 02 — deviations and choices made (review these)
- **Logo:** RESOLVED. The user supplied the logo (`2.png`, 2170×725). It had a checkerboard baked into the pixels (RGB, no alpha), so the background was removed with a script and saved as `public/brand/tcl11-logo.png` (1000×410, transparent). `Logo` now renders this image by default; the typographic wordmark stand-in was removed. Heights: sm h-11 (mobile header), md h-12 (desktop header, footer), lg h-16. The original source file is not stored in the project; a true transparent/vector master would still be better for large sizes.
- **Marquee strip** (gold promo line) was not in the Step 02 component list, so it is not built. Planned for Step 03.
- **Popular Games category tabs** (All / Slots / Table …) are not built; they belong with the Step 03 section composition.
- **Brand icons:** Lucide has no YouTube/Facebook/Telegram/Instagram/TikTok icons. Footer uses generic Lucide glyphs with accessible labels. Replace with official SVGs.
- **Store badges and 18+/Gambling Aware badges** are text stand-ins, not official badges.
- **Payment methods** are text chips, not logos. "TBC" marks the unidentified orange logo.
- **Footer** is a single responsive component (reference shows desktop only). Mobile stacking is inferred.
- **Responsive approach:** shared components with responsive classes, plus separate `Desktop`/`Mobile` variants only where the reference differs. Step 03 will create the section-level variants.
- **Currency** displayed as AUD (from reference). Market still undecided.
- **Next build rewrote `tsconfig.json`** (`jsx: react-jsx`, two include paths). Expected Next behaviour; kept.
- **Known cosmetic issue:** on small game tiles the "Asset pending" placeholder text sits under the title overlay. Clean up when real artwork arrives.
- **Known console noise:** nav links point to routes not yet built (`/login`, `/signup`, `/casino`, `/sports`, `/promotion`, `/profile`, …). Production logs 404s for these prefetches. Expected until those pages exist.

### Step 02 correction — homepage placement (applied)
- Showcase moved out of the public homepage to `/dev/design-system`. The component is `src/components/dev/DesignSystemShowcase.tsx`; the route is `src/app/dev/design-system/page.tsx`.
- `/dev/design-system` calls `notFound()` when `NODE_ENV === "production"` (verified: 404 on the production build) and sets `robots: noindex`. It is not linked from any navigation.
- Homepage `/` now follows the reference structure: header → gold ticker (desktop) → desktop body (`HomeDesktop`: welcome banner, shortcuts, popular games with category tabs, featured 2×5 grid; rail with VIP, live transactions, sports banner, why choose) → mobile body (`HomeMobile`: welcome banner, shortcuts, VIP, popular, featured) → payment methods → footer.
- New components: `layout/PromoMarquee` (static ticker), `home/ShortcutGrid`, `games/CategoryTabs` (visual selection only), `home/WhyChooseGrid`, `home/HomeDesktop`, `home/HomeMobile`.
- Mobile sections below Featured Games (live transactions, sports banner, why choose) are **inferred from the desktop rail**. They are marked in `HomeMobile.tsx`. Replace them when the mobile design is supplied.
- `LiveTransactionTable` uses `aria-label` instead of an element ID, because it now renders in both trees.
- Verified: `tsc --noEmit` passes; `next build` passes (routes `/`, `/dev/design-system` listed); production `/` = 200 with no overflow at 1440px and 390px and no showcase text; production `/dev/design-system` = 404; dev server serves both routes = 200.
- Known: Swiper carousels exist in both hidden trees. Resize across the breakpoint has not been tested in a browser. The hero carousel arrows and dots from the reference are not built (single banner only).
- Known: "Asset pending" placeholder labels overlap game-tile titles on small tiles.

### Hero banner carousel (applied after the homepage correction)
- Three user-supplied banners copied to `public/images/banners/banner-01.png`, `banner-02.png`, `banner-03.png` (2172×724, full-bleed RGB, ~2.3 MB each; Next Image serves optimised sizes).
- New `src/components/home/HeroCarousel.tsx` (client, Swiper with `Autoplay` + `EffectFade`; no new dependencies), `src/data/heroSlides.ts`, and a `HeroSlide` interface in `src/types/index.ts`.
- Only the hero changed: `HomeDesktop.tsx` and `HomeMobile.tsx` now render `<HeroCarousel variant="desktop|mobile" />` instead of the old `PromotionBanner` welcome banner. `PromotionBanner` is untouched and still used for the sports banner. Header, VIP, transactions, games, footer were not modified.
- Copy ("WELCOME BONUS" pill, "GET 100%", "WELCOME BONUS", "On Your First Deposit", "Claim Now →") is live HTML in one static layer above the artwork, so it does not move or duplicate between slides. Text scales with banner width (container-query units).
- Behaviour (UPDATED to a continuous sliding loop): 3 slides slide left in an infinite loop (`loop`, no fade), one change every exactly 5 s (4.2 s hold + 0.8 s slide; constants `HERO_AUTOPLAY_MS` = full cycle and `HERO_TRANSITION_MS` in `src/data/heroSlides.ts`). Hover, mouse clicks, keyboard focus, arrows, dots and swipes never stop it (hover/focus pausing was removed on request). Arrows and dots use `slidePrev/slideNext/slideToLoop`; wrap-around is a forward slide, never a rewind. Autoplay idles only when the banner is off-screen / tab hidden (nothing visible) and for `prefers-reduced-motion` users (accessibility exception).
- AUTOPLAY FIX (supersedes the autoplay-idle rules in the bullet above): autoplay did not run for users with the OS "reduce motion" setting (common on Windows when animation effects are off) because the component deliberately stopped it; reproduced with Playwright `reducedMotion: "reduce"` (carousel stuck on slide 1). Removed the reduced-motion check, the IntersectionObserver / off-screen pause, the hover/focus pause and the Swiper `Autoplay` module. Autoplay is now one unconditional `setTimeout` loop in `HeroCarousel.tsx` that starts on mount and calls `swiper.slideNext(800)` once 5 s have passed since the last slide change; every change (auto, arrow, dot, swipe) restarts the countdown. It only skips a tick while a finger/mouse is actively dragging or a slide is mid-animation. Verified on the production build, zero interaction, desktop + mobile, reduce-motion on and off: changes at ~5s, 10s, 15s, 20s, 25s (intervals 4.9–5.1 s), order 1>2>3>1>2>3, keeps advancing while scrolled out of view and while hovered; arrows, dots and swipe still work and autoplay continues after them. 48/48 checks passed.
- Swiper 14 loops 3 slides by repositioning them (no DOM clones), so copy/CTA are never duplicated (they are in a separate static layer anyway).
- Sizes: desktop 3.5:1 (811×232 at 1440px, matches the reference ratio); mobile 2:1 (358×179 at 390px). Mobile is 2:1, not the reference ~2.4:1, so the copy and CTA stay readable. Per-slide `object-position` is tuned separately for desktop and mobile.
- Image loading: first slide `priority`; the hidden tree's `sizes` resolve to the smallest candidate so the unused layout does not download a large image.
- Verified in a real browser (dev and production build): autoplay timing, arrows, dots, wrap-around, hover pause/resume, touch swipe (mobile, CDP touch events), fixed hero size across slides, images loaded, no console/page errors, text fits at 288–1920 px widths, `/dev/design-system` still 404 in production. Hero is not a source of any layout shift.
- Known (pre-existing, not part of this change): on desktop the Popular Games carousel causes a layout shift of ~0.20 on load (Swiper renders tiles at an initial width before JS applies its breakpoints). Not touched because game sections were out of scope; suggested fix is SSR-safe slide widths in `GameCarousel`.
- Known: banner images are generated artwork supplied by the user; each is ~2.3 MB as a PNG source. Converting the sources to optimised WebP/AVIF would shrink the repo and the first optimisation pass.
- Note: the carousel reads its copy from `WELCOME_PROMO` in `src/data/mock.ts`. The `PromotionBanner` hero variant is no longer used on the homepage but is kept for the dev design-system showcase.

### Hero shortcut buttons — CSS/SVG recreation + click animation (CURRENT)
**Target:** the six-button **shortcut row between the hero banner and Popular Games** — component `src/components/home/ShortcutGrid.tsx`, rendered by `HomeDesktop` and `HomeMobile`. (History: an earlier pass mistakenly changed the mobile bottom nav, then a pass used PNG assets; the user then asked to recreate the buttons in HTML/CSS/SVG instead of PNGs. Current state is the CSS/SVG recreation.)

- Six buttons: **HOME, HISTORY, BONUS, LIVE CHAT, VIP, SETTING**, built from scratch with CSS + **custom hand-drawn SVG icons** — **no PNG assets, no default Lucide icons**.
- Custom SVG icons live in `src/components/home/ShortcutIcons.tsx` (`HomeIcon`, `HistoryIcon` doc+magnifier, `BonusIcon` gift+bow, `LiveChatIcon` DHF bubble + red dot, `VipIcon` jeweled crown, `SettingIcon` parametric 8-tooth gear). Icons are solid `#FFD700`. Glow is reduced to a tight 0.5px white and 1.5px gold `drop-shadow`, plus a 4px dark offset shadow so the icons appear to float above the buttons. A `shortcut-icon-float` class applies a 3.2s ease-in-out translateY(0 → -3px) loop (transform only), disabled under `prefers-reduced-motion`.
- Button face: bright red radial vignette (`radial-gradient(... #ff6a4e → #ff2222 → #bd0808 → #6a0202)`), 2px bright-red neon border (`#ff3326`), strong layered red outer glow + inset top sheen + inset bottom darkening. Rounded 12px (desktop) / 9px (mobile). White condensed uppercase labels (`font-display`/Anton) with text-shadow. Active (Home on `/`) gets a brighter border/glow variant.
- **desktop + mobile share the design**, differing only in sizing (desktop h-70px icons 28px text-13px; mobile h-58px icons 22px text-9.5px). Single `ShortcutGrid` component via the `variant` prop. No overflow at 390px.
- **Click particle animation:** casino-style burst from the clicked button — 16-22 particles (6-14px): gold stars, red/gold sparkles, squares (chips/dice), diamonds; **VIP emits extra golden crown particles**. Shockwave ring ~500ms; button press scale(0.92)→1 over 220ms; particles move out/up, rotate, fade over 600-900ms. Pure DOM + Web Animations API, auto-removed. `prefers-reduced-motion` respected.
- The 6 PNG files remain in `public/images/nav/` but are **no longer referenced** by any component. `FileSearch` was briefly added to `src/lib/icons.ts` then reverted (custom SVGs replaced all Lucide usage here).

**Protected areas (verified unchanged):**
- **Mobile bottom navigation** (`layout/MobileBottomNavigation.tsx`): 5-tab Lucide design — Home, Casino, Sports, Promotion, Profile (`MOBILE_TABS`). No PNGs, no particles.
- **Mobile top header** (`layout/MobileHeader.tsx`): hamburger · logo · support · Log In / Sign Up.
- **Desktop top header** (`layout/DesktopHeader`/`DesktopNavigation`), hero banner, game sections, VIP panel, transactions, footer — untouched.

- Tuned to the reference via a measure→compare→correct loop (sharp pixel-diff + blend + side-by-side overlays, scratchpad `compare.mjs`): reference 9.png measured at 984×110, ~142px buttons, ~10px gaps, dark-red body + bright neon edges (fill ~#7a0101, bright bottom ~#f72d12). Matched button gradient (dark body/bright top+bottom edge), 2px bright-red border, strong outer glow, 10px radius, 33px gold glowing icons (icon-high/label-low layout), 15px Anton white labels. Aligned pixel-diff mean ~44/255 desktop; residual is the reference's own glow-halo misalignment + hand-drawn (vs raster) icon vectors.
- Verified: `tsc --noEmit` passes; `next build` passes; Playwright screenshots (desktop 1440 @2x, mobile 390 @3x) + overlay/diff compared against the user's reference; VIP click spawns ~19-22 particle elements incl. golden crowns + shockwave ring; mobile bottom nav unchanged = 5 Lucide tabs (0 img); mobile + desktop top headers intact. Awaiting user visual approval.

### Step 04 — Mobile homepage (READY FOR USER APPROVAL)
- Reference: right-hand phone in `images\1.png` (composite, 1536×1024). Top screen only. Sections below Featured Games have no mobile reference.
- Scope: mobile tree only (`HomeMobile`, `lg:hidden`). NOT touched: desktop homepage, desktop header/nav, mobile header, mobile bottom nav, hero shortcut buttons (`ShortcutGrid`, which the user calls "navigation"), hero carousel.
- Pass 1 (earlier session): mobile spacing, neon panels, hero 7:3 on mobile, dots bottom-right, `GameCarousel` arrows below `lg`, `GameCard` mobile placeholder hidden.
- Pass 2 (artwork + refinement):
  - **Artwork source:** game tiles are WebP crops of the user-supplied hero banners (`public/images/banners`), per rule 8 (reuse supplied assets). 10 Popular crops in `public/images/games/popular/`, 9 Featured crops in `public/images/games/featured/` (3 portraits mirrored for variety), 9–30 KB each. Crop boxes live in the session script, not the repo; recreate from the banners if needed.
  - **Hand-built SVGs** (no supplied art covers these): `public/images/games/popular/slot.svg` (slot machine, 777 reels, lever) and `public/images/sports/sports-art.svg` (flaming football, gold trophy, floodlights). The reference's sports photo shows a real footballer and was deliberately not imitated.
  - **New mobile-only components** in `src/components/home/mobile/`: `MobileSectionHeading` (mixed-case title, filled icon, "View All →"), `MobileGameTiles` (`PopularTile`, `FeaturedTile`), `MobilePopularGames`, `MobileFeaturedGames`, `MobileVipCard` (mixed-case copy as in the reference), `MobileSportsBanner`.
  - **Mobile data:** `src/data/mobileHome.ts`. `MOBILE_POPULAR_GAMES` = 11 tiles (SLOT, BONZA, ARISTOCRAT, LIVE, POKER, BACCARAT, ROULETTE, LUCKY WHEEL, JACKPOT, BLACKJACK, SIC BO). `MOBILE_FEATURED_GAMES` = first 9 of `FEATURED_GAMES` as a 3×3 grid (EVOPLAY omitted on mobile to avoid a lone tile); long names shortened (PG SOFT, PRAGMATIC, HACKSAW). Provider names are styled text with a per-provider glow, not copies of provider logos. Desktop still uses `POPULAR_GAMES` / `FEATURED_GAMES` unchanged.
  - **Popular carousel:** 4 tiles in view, arrows move one tile, swipe works, arrows dim at either end. Slide widths are CSS (`slidesPerView: "auto"`, no `spaceBetween`), so the row does not shift when Swiper initialises.
  - `globals.css`: new `tile-neon` utility (red edge, outer glow, inner glow drawn above the art). Used only by mobile tiles.
  - `PaymentMethods.tsx`: `max-lg:rounded-card` + padding, so the wrapped 3-row strip is a rounded panel instead of an oval. Desktop classes unchanged.
  - **Bug fix, `layout.tsx`:** the 64px fixed bottom nav covered the footer's last 64px (copyright + 18+ / Gambling Aware badges) at max scroll, and `main pb-20` + footer `mt-10` left 120px of empty space above the footer. Clearance moved from `main` to `body` (`max-lg:pb-16`). Gap above footer now 40px; legal bar ends exactly at the nav's top edge. Navigation components themselves unchanged.
- Verification (production build, Playwright, 2026-11-09):
  - 375 / 390 / 430px: no horizontal overflow, no broken images, no page errors. Side-by-side reference / before / after captured for the top screen at each width, plus full pages.
  - Interaction suite, 27/27 passed: 4 of 11 tiles visible at start; prev disabled at start; next moves one tile; end reached at SIC BO with next disabled; back to start; touch swipe moves the row; footer clears the nav; no errors. Hero: all 3 slides checked at 375 and 430, subject stays in frame (no hero change needed).
  - Desktop 1440 regression: full-page screenshot 0 differing pixels vs the pre-change baseline (baseline itself confirmed deterministic: two runs, 0 diff). DOM of header, ticker, desktop body and footer identical (after normalising Swiper's runtime class whitespace, which varies with timing).
  - `tsc --noEmit` passes; `next build` passes.
- Remaining differences from the reference (known, not fixed):
  - Mobile header buttons are uppercase "LOG IN / SIGN UP" (reference: "Log In / Sign Up") and shortcut labels are uppercase Anton (reference: mixed-case sans). Both are protected navigation areas, so left as is.
  - Reference hero art (fire demon) is not available; the hero uses the user's three banners.
  - Featured tiles use 3 hosts (2 women, 1 man) from the banners, so faces repeat across 9 tiles. Real provider artwork and licensed logos should replace them.
  - Live Transaction, Sports banner layout, Why Choose and the payment strip remain inferred from the desktop reference (no mobile design exists).
  - Desktop game tiles are still plain (desktop was out of scope). The same artwork could be applied there on request.
- Dev-server note: after editing Tailwind class strings the dev server can serve stale CSS. Restart `next dev` before judging a visual change.

### Deployment (2026-11-09)
- Vercel CLI 65.12.1, logged in as `salman8809`. Project `salman8809/tcl11-website` created; Next.js auto-detected; `.vercel/` link folder and a `.gitignore` were added to the project root.
- The first deploy went straight to **production** (Vercel assigns a project's first deployment to production), contrary to the user's preview-first instruction: https://tcl11-website.vercel.app (Vercel Authentication protection on). It predates the Step 04 pass 2 changes.
- Not yet confirmed: that `salman8809` is the account registered to the email the user specified.

### Mobile footer redesign (applied)
- Mobile only (below 640px, Tailwind `sm:hidden`). Desktop and tablet (`sm` and up) keep the original `FOOTER_COLUMNS` grid, now marked `hidden sm:grid`.
- New mobile block in `layout/Footer.tsx`: centered logo (sm), description, social icons, a red glowing divider (`footer-glow-divider` utility in `globals.css`), and the two store badges stacked.
- On mobile, the Quick Links, Games, Help & Support and Company sections are hidden entirely. Their 12 links remain in the DOM only in the desktop grid (`FOOTER_COLUMNS`), and the earlier mobile regrouping data was removed.
- Footer height at 375/390/430px dropped from 1068px to 742px, with no horizontal overflow at any width. Copyright and legal bar is compact and centered on mobile.
- Desktop: height is 301px before and after, and text, links and layout are identical. The logo bitmap region differs at pixel level (8,833 bytes, max channel delta 59). The cause was not isolated; header hiding ruled out.
- Verified: `tsc --noEmit` passes; `next build` passes; Playwright captures at 375, 390 and 430px reviewed. Awaiting user visual approval.

### Step 05 — All Remaining Frontend Pages (READY FOR USER APPROVAL)
- **16 new routes** created, all fully responsive (mobile + desktop), using the established TCL11 design system (black/red/gold/white, NeonCard panels, gold gradient headings, red glow effects).
- **Game pages (4):**
  - `/casino` — combined game catalogue (Popular + Featured + Casino + Slots + Live Casino); PageBanner hero, two NeonCard game grid sections.
  - `/slots` — 16 slot games in a 3→5 column responsive grid.
  - `/live-casino` — 12 live dealer games in a 2→4 column grid with "category" variant tiles.
  - `/esports` — 12 esports titles.
- **Sports page:**
  - `/sports` — client component with sport-category pill filter (All/Football/Basketball/Tennis/Cricket), 8 mock events with live scores, odds buttons (1/X/2) with hover states, live indicator with pulsing dot. Basketball and tennis events omit the draw odds column.
- **Promotions:**
  - `/promotion` — 6 promotion cards in a 1→2→3 responsive grid, each with a badge Pill, gold gradient title, description, and CTA button.
- **Auth pages (2):**
  - `/login` — centered NeonCard with logo, email/password fields with icons, show/hide password toggle, link to Sign Up.
  - `/signup` — first/last name, email, phone, password with show/hide, terms checkbox linking to `/terms` and `/privacy`, link to Log In.
  - Both use `onSubmit` prevent-default (no backend yet). No credentials are stored or transmitted.
- **Profile:**
  - `/profile` — tabbed interface (Overview / Transactions / Settings). Overview: VIP card + quick stats (4 metric tiles). Transactions: table of mock transaction history with status pills. Settings: account form (display name, email, phone) with save button.
- **Info pages (6):**
  - `/about` — Who We Are text, 4 value cards (Safe & Secure, Lightning Fast, 24/7 Support, VIP Experience), Responsible Gaming section.
  - `/blog` — 6 blog post cards with category pill, date, read time, excerpt, "Read More" button.
  - `/faq` — accordion grouped by category (Account, Payments, VIP, Games, Bonuses, Security, Support). 10 Q&A items. Client component with open/close state.
  - `/contact` — 3 channel cards (Live Chat, Email, Phone) + a contact form (name, email, subject, message textarea). Client component.
  - `/terms` — 10-section Terms & Conditions in a narrower (960px) layout.
  - `/privacy` — 9-section Privacy Policy, same narrow layout.
  - `/chat` — placeholder page with support status indicator, average response time, and a link to `/contact`.
- **New shared components:**
  - `src/components/pages/PageBanner.tsx` — reusable page hero with icon, gradient title, and subtitle.
- **New data files:**
  - `src/data/pages.ts` — game catalogues (CASINO_GAMES 12, SLOT_GAMES 16, LIVE_CASINO_GAMES 12, ESPORTS_GAMES 12), SPORT_EVENTS 8, PROMOTIONS 6, BLOG_POSTS 6, FAQ_ITEMS 10.
  - `src/types/index.ts` — added SportEvent, Promotion, BlogPost, FaqItem interfaces.
  - `src/lib/icons.ts` — added 28 new Lucide icons (Award, BookOpen, Calendar, Check, ChevronDown/Up, CircleDot, Eye/EyeOff, HelpCircle, Info, Lock, LogOut, Mail, MapPin, Pencil, Phone, Plus, Shield, Star, Tag, Target, Timer, TrendingUp, Users, X).
- **Homepage unchanged:** the existing `/` page, its desktop and mobile trees, and all shared layout components (headers, nav, footer) were not modified.
- Verification (production build, Playwright, 2026-11-09):
  - `tsc --noEmit`: 0 errors.
  - `next build`: 20 routes (18 app routes + `/_not-found`), all static, 0 build errors.
  - Playwright test suite 1 (step05-test.mjs): 129/129 passed. Every page at 390px (mobile) and 1440px (desktop): HTTP 200, no horizontal overflow, meaningful content height > 200px, zero page errors. Full-page screenshots captured.
  - Playwright test suite 2 (step05-nav.mjs): 54/54 passed. All 16 pages at 375px and 430px: zero overflow. Desktop nav links (7): all return 200. Mobile bottom nav links (4): all return 200. Footer links (11 unique): all return 200.
  - Total: **183/183 checks passed, 0 failed.**
- Screenshots in `C:\Users\This Pc\AppData\Local\Temp\claude\9759fe959791bfc5\68f859e8-c33a-44da-a007-36acf581fee9\scratchpad\step05\`:
  - `m390-*.png` — mobile screenshots of all pages.
  - `d1440-*.png` — desktop screenshots of all pages.
  - `m390-home.png`, `d1440-home.png` — homepage regression captures.

### Step 06 — UI Interactions, Animations & Final Visual QA (READY FOR USER APPROVAL)
- **Scope:** audit all UI interactions, add premium CSS animations, refine interaction states, test everything with Playwright.
- **Animation system** (CSS-only, no Framer Motion or JS animation libraries — GPU-accelerated, zero JS bundle cost, works with server components):
  - `globals.css` additions: `fade-in-up`, `tab-fade`, `stagger-up` keyframes with matching `animate-*` utilities.
  - `marquee-scroll` keyframe + `.marquee-track` class for infinite scrolling promo strip.
  - `.accordion-body` with CSS `grid-template-rows: 0fr → 1fr` transition for smooth FAQ accordion.
  - `tap-feedback` utility (`active:scale(0.92)`) for mobile touch response.
  - `animate-pulse-dot` for live indicator on sports page.
  - Global input focus glow (`box-shadow` transition on all inputs/textareas/selects).
  - Full `prefers-reduced-motion` overrides disabling all added motion.
  - CSS custom property `--stagger-i` for staggered entrance delays without requiring client components.
- **Interactions fixed/added:**
  - **MobileDrawer** (`src/components/layout/MobileDrawer.tsx`) — NEW client component: slide-in navigation panel with nav items + extra links, Escape key close, body scroll lock, route-change auto-close.
  - **MobileHeader** — converted from server to client component, hamburger button now opens the drawer, support button now links to `/contact` with tap feedback.
  - **PromoMarquee** — converted from static truncated text to infinite-scrolling CSS marquee (3 duplicated text elements, `translateX(-50%)` at 35s).
  - **FAQ accordion** — replaced conditional render with CSS grid-rows animation, smooth open/close with `data-open` attribute, stagger on category sections.
  - **Profile tabs** — added `animate-tab-fade` entrance on tab switch with `key` props, hover effects on stat cards and transaction rows.
  - **Sports odds** — added toggle state with `Set<string>`, selected odds get gold glow shadow.
  - **Game grids** — added `stagger` prop to `GameGrid`, each item enters with staggered delay (capped at 14 items).
  - **Mobile bottom nav** — added `tap-feedback` class to all nav links.
  - **All 16 inner pages** — added `animate-fade-in-up` entrance animation to page wrappers.
  - **Promotion, blog, about cards** — inline stagger animation with `--stagger-i` CSS variable.
  - **MobileSportsBanner** — added `pointer-events-none` to sports-art SVG to prevent click interception.
- **Files changed:** `globals.css`, `MobileDrawer.tsx` (new), `MobileHeader.tsx`, `PromoMarquee.tsx`, `MobileBottomNavigation.tsx`, `MobileSportsBanner.tsx`, `GameGrid.tsx`, `faq/page.tsx`, `profile/page.tsx`, `sports/page.tsx`, plus all 16 inner page files (entrance animation class).
- **Verification (production build, Playwright, 2026-11-10):**
  - `tsc --noEmit`: 0 errors.
  - `next build`: 20 routes prerendered successfully, 0 build errors.
  - Playwright test suite (`step06-test.mjs`): **135/135 passed, 0 failed.**
    - Phase 1: all 17 pages at 1440px desktop + 390px mobile — HTTP 200, no horizontal overflow, zero JS errors. Full-page screenshots captured.
    - Phase 2 interactions: FAQ accordion open/close/reclose (5 checks), profile tab switching (4 checks), sports filter + odds toggle (5 checks), login password show/hide + focus glow (4 checks), signup form (2 checks), contact form (2 checks), mobile drawer open/close with link count (4 checks), scrolling marquee animation (2 checks), desktop nav links (1 check), mobile bottom nav tap-feedback class (1 check), stagger animation items (1 check), page entrance animation (1 check), support icon href (1 check).
  - Visual audit: desktop and mobile screenshots reviewed for all key pages — no visual inconsistencies found.

### Step 07 — Backend Architecture (READY FOR USER APPROVAL)
- **Scope:** NestJS backend with TypeScript, REST API, WebSocket, Redis architecture, modular design. All using mock/in-memory data (PostgreSQL + Prisma deferred to Step 08).
- **Technology:** NestJS 11.x, TypeScript 5.9, Passport + JWT, Socket.IO, Swagger, Helmet, bcrypt, ioredis, class-validator/class-transformer, `@nestjs/throttler`.
- **Backend location:** `server/` directory (separate from Next.js frontend in project root).
- **9 modules built:**
  1. **Auth** — JWT authentication (access + refresh tokens), Passport strategy, `@Public()`/`@Roles()` decorators, bcrypt (12 rounds), register/login/refresh/change-password/logout endpoints.
  2. **Users** — User CRUD with in-memory Map store, role management (USER/VIP/MODERATOR/ADMIN/SUPER_ADMIN), self-service `/me` endpoints, admin-only listing. 2 seeded mock users (demo + admin).
  3. **Profiles** — Extended user profile (display name, avatar, currency, language, timezone), VIP level, gaming stats.
  4. **Games** — 14 seeded games across 4 categories (slots/table/live-casino/esports), category/provider/search filtering, pagination, launch tracking.
  5. **Sports** — External API adapter pattern (`SportsProvider` interface), `MockSportsAdapter` with 8 realistic events, live score filtering, sport type enumeration. Designed for swapping to Sportradar/Betfair.
  6. **Promotions** — 6 seeded promotions, active/inactive management, VIP level eligibility, admin-only creation.
  7. **Notifications** — WebSocket gateway (Socket.IO, `/ws` namespace), per-user channels, sports event subscription rooms, in-memory notification store, real-time push on create. REST endpoints for listing/marking read.
  8. **Support** — Ticket system with priority levels and status workflow (OPEN → IN_PROGRESS → WAITING → RESOLVED → CLOSED), contact form (public), agent/admin ticket management.
  9. **Admin** — Dashboard statistics aggregation (users, games, promotions, tickets, connected clients), user role management, user deactivation, audit log access.
  10. **Audit** (global) — Centralized event logging (LOGIN/LOGOUT/REGISTER/PASSWORD_CHANGE/PROFILE_UPDATE/GAME_LAUNCH/PROMOTION_CLAIM/ADMIN_ACTION/SUPPORT_TICKET/SETTINGS_CHANGE), IP + user-agent capture, user-scoped and action-scoped queries.
- **Common infrastructure:**
  - `GlobalExceptionFilter` — catches all exceptions, never leaks stack traces, structured error responses.
  - `TransformInterceptor` — wraps all responses in `{success, data, timestamp}` envelope.
  - `LoggingInterceptor` — logs all HTTP requests with method, path, elapsed time.
  - `globalValidationPipe` — whitelist mode, forbid non-whitelisted fields, implicit type coercion.
  - `JwtAuthGuard` + `RolesGuard` — composable authentication + authorization.
  - `@Public()`, `@Roles()`, `@CurrentUser()` decorators.
  - Centralized config from environment variables (`.env.example` template provided).
- **API documentation:** 35+ endpoints documented in `server/docs/API_ENDPOINTS.md` with request/response examples.
- **Architecture diagrams:** System architecture, module relationships, WebSocket flow in `server/docs/ARCHITECTURE.md`.
- **Security documentation:** Auth flow, password policy, RBAC matrix, API security (Helmet/CORS/throttling), secrets management, compliance roadmap in `server/docs/SECURITY.md`.
- **Redis architecture:** ioredis dependency included, config ready. Planned for: session/token store, cache layer, pub/sub for cross-instance WebSocket. Integration deferred to Step 08.
- **Root tsconfig updated:** `server/` excluded from frontend's TypeScript compilation to prevent decorator conflicts.
- **Verification (2026-11-10):**
  - Backend `tsc --noEmit`: 0 errors.
  - Backend `nest build`: compiles to `server/dist/` successfully.
  - Frontend `tsc --noEmit`: 0 errors (unchanged).
  - Frontend `next build`: 20 routes prerendered (unchanged).
  - **No frontend files modified.**

### Step 08 — PostgreSQL & Prisma ORM (VERIFIED AGAINST LIVE DB — READY FOR USER APPROVAL)
- **Scope:** Full PostgreSQL database integration via Prisma ORM 6.9. All in-memory Maps replaced with persistent database queries. Schema designed, client generated, all services rewritten, seed script created, documentation complete.
- **Technology:** PostgreSQL 15+, Prisma ORM 6.9.0, @prisma/client 6.9.0, ts-node 10.9.2 (for seeding).
- **Note on Prisma version:** Initially installed Prisma 8.0.0-rc.33 which turned out to be the new "Prisma Platform" CLI (completely different product without standard `generate`/`migrate` commands). Downgraded to stable Prisma 6.9.0.
- **Schema** (`server/prisma/schema.prisma`):
  - **17 models:** User, RefreshToken, UserProfile, GameProvider, Game, GameLaunch, Sport, League, Team, SportMatch, Promotion, UserPromotion, Notification, SupportTicket, TicketMessage, AuditLog, ContactSubmission.
  - **8 enums:** UserRole, TicketStatus, TicketPriority, NotificationType, AuditAction, GameCategory, SportStatus, PromotionStatus. Enum values match existing API contracts (lowercase for most, UPPERCASE for AuditAction and PromotionStatus).
  - All tables use `@map` for snake_case naming; all FKs indexed; composite indexes on high-query fields.
  - Financial fields use `Decimal(14,2)` for precision. Odds use `Decimal(6,2)`.
  - Cascade deletes on user-owned data (tokens, profiles, notifications, tickets, audit logs, game launches, promotions).
- **PrismaService** (`server/src/prisma/`):
  - Extends PrismaClient with NestJS lifecycle hooks (`OnModuleInit`/`OnModuleDestroy`).
  - PrismaModule is `@Global()` — available to all modules without explicit import.
  - Configurable logging (query events, info, warn, error).
  - `cleanDatabase()` utility blocked in production.
- **Services rewritten (9 + AdminService):**
  1. **UsersService** — `prisma.user.*` replaces Map. Auto-creates profile on user creation.
  2. **AuthService** — Refresh tokens stored in `refresh_tokens` table with revocation timestamps (no more in-memory Map).
  3. **ProfilesService** — `prisma.userProfile.*` with Decimal-safe response DTO.
  4. **GamesService** — Relational queries with `include: { provider }`. Category mapping via `enum-map.ts` (`live_casino` ↔ `live-casino`). Search uses Prisma `mode: 'insensitive'`.
  5. **SportsService** — Unchanged (still uses SportsProvider adapter pattern). Sports data seeded via seed script.
  6. **PromotionsService** — `prisma.promotion.*` with PromotionStatus enum.
  7. **NotificationsService** — `prisma.notification.*` with WebSocket push on create.
  8. **SupportService** — `prisma.supportTicket.*` with nested ticket message creation. Contact form persisted to `contact_submissions`.
  9. **AuditService** — `prisma.auditLog.*` with JSON metadata.
  10. **AdminService** — Aggregation via parallel `prisma.*.count()` queries (replaced cross-module injection of UsersService/GamesService/etc. with direct Prisma counts).
- **Controllers updated:** All controllers updated for async Prisma calls. Import paths adjusted from common/interfaces enums to `@prisma/client` enums where needed.
- **Enum compatibility:** Common/interfaces `Role`, `TicketStatus`, etc. retained for decorators/guards (runtime string values match Prisma enum values). No breaking changes to API contracts.
- **Seed script** (`server/prisma/seed.ts`):
  - 4 users (demo, admin, VIP, moderator) with profiles.
  - 5 game providers, 14 games across 4 categories.
  - 4 sports, 5 leagues, 12 teams, 7 matches (2 live, 1 finished, 4 upcoming).
  - 6 promotions, 5 notifications, 2 support tickets with message threads, 7 audit logs, 1 contact submission.
  - Idempotent via `upsert` where possible.
- **Documentation:** `server/docs/DATABASE.md` — ER diagram (ASCII), model reference table, enum documentation, financial field notes, index strategy, cascade rules, migration procedures, seed data inventory, environment variable guide.
- **Environment:** `DATABASE_URL` added to `.env.example` with format documentation.
- **Verification (2026-11-10):**
  - Backend `tsc --noEmit`: 0 errors.
  - Backend `nest build`: compiles successfully.
  - Frontend `tsc --noEmit`: 0 errors (unchanged).
  - `prisma generate`: Prisma client generated successfully.
  - **PostgreSQL 17.11 installed via winget** (`C:\Program Files\PostgreSQL\17`, service `postgresql-x64-17`, running on port 5432, superuser `postgres`).
  - **Initial migration applied:** `prisma migrate dev --name init` → migration `20261110050243_init` (438 lines of SQL) applied cleanly. All 18 tables created in the `public` schema of database `tcl11` (17 model tables + `_prisma_migrations`).
  - **Seed script executed:** `prisma db seed` ran without error, populated all seeded tables with exact expected counts — users=4, user_profiles=4, game_providers=5, games=14, sports=4, leagues=5, teams=12, sport_matches=7, promotions=6, notifications=5, support_tickets=2, ticket_messages=3, audit_logs=7, contact_submissions=1. Association tables (game_launches, user_promotions, refresh_tokens) correctly empty — populated at runtime.
  - **Backend booted against live DB** (`node dist/main.js`): Nest application started, PrismaService logged `Database connection established`, Prisma connection pool opened with 5 connections, all 35+ routes registered, server listening on `http://localhost:3200`.
  - **End-to-end API smoke test (all passed):**
    - `GET /api/v1/games/providers` → returned 5 seeded providers.
    - `GET /api/v1/promotions` → returned seeded promotions with correct `badge`/`minVipLevel` fields.
    - `POST /api/v1/auth/login` (demo@tcl11.com / Test1234) → issued JWT access + refresh tokens; refresh token persisted to `refresh_tokens` table (verified 0→1 row delta).
    - `GET /api/v1/users/me` → returned the demo user record from DB.
    - `GET /api/v1/profiles/me` → returned profile with `Decimal` fields correctly serialized as JSON numbers.
    - `GET /api/v1/notifications` → returned the demo user's 2 seeded notifications.
    - Admin login + `GET /api/v1/admin/dashboard` → returned live DB counts (4 users, 14 games, 6 promotions, 2 open tickets) via parallel `prisma.*.count()` queries.
    - Non-admin user hitting `/admin/dashboard` → `403 Forbidden` (RBAC guard works correctly against DB-sourced roles).
  - **No frontend files modified.** **`.env` is gitignored** (new `server/.gitignore` added; `.env` holds local-dev credentials only — `postgres:postgres@localhost:5432/tcl11`).

### Deployment — Production (2026-11-10, promoted from the approved Preview)
- **Approved by user** on 2026-11-10. Promoted via `vercel promote <preview-url>` (same build artifact — no rebuild), producing deployment `dpl_EmGXcaWKyPR8NBxUasnHSXSqe6Jv` on the existing project `salman8809/tcl11-website`. **No duplicate project created.** No code changes.
- **Production URL:** `https://tcl11-website.vercel.app` (status `● Ready`, target `production`).
- **Production verification:** All 17 public routes returned `200` (`/`, `/casino`, `/sports`, `/live-casino`, `/slots`, `/promotion`, `/login`, `/signup`, `/profile`, `/about`, `/contact`, `/blog`, `/esports`, `/chat`, `/faq`, `/privacy`, `/terms`). `/dev/design-system` correctly `404` in production. Production homepage HTML contains the TCL11 title, logo, hero banner, hero copy, Popular/Featured Games, VIP, AUD, Payment markers — identical to the approved Preview.

### Deployment — Preview (2026-11-10, approved and promoted — history)
- **Vercel account:** `salman8809` (CLI 65.12.1, already logged in; the user's intended account email is listed as `salmanrorvi72@gmail.com` — not re-verified against the account, but the `.vercel/project.json` was already present from earlier so this is their existing linked project).
- **Target project:** `salman8809/tcl11-website` (id `prj_zkHZG40V7Ca3CcNOv9Gvj9b5yWif`) — the previously-linked project. **No duplicate created.**
- **What was deployed:** The Next.js frontend only (Next.js 16.4.5, 20 static routes). The NestJS backend was NOT deployed to Vercel; see "Backend hosting" below.
- **Guardrail added:** New `.vercelignore` at repo root excludes `server/` (backend + its `.env`), `docs/`, `*.md`, `scratchpad/`, `prisma/`, `.env*`, `coverage/`, `.next/`. This is what keeps the backend and all local-dev credentials off Vercel.
- **Preview URL:** `https://tcl11-website-a5sdb5kq1-salman8809.vercel.app` (deployment `dpl_4FHgU5CLiqAZjDTrJPo5iG2uDdYs`, target `preview`, protected by Vercel Authentication — only Vercel-logged-in users can view). Production URL `https://tcl11-website.vercel.app` was NOT touched.
- **Local pre-flight verification:** `next build` passed cleanly, 20 static routes, 0 TypeScript errors.
- **Preview smoke test (HEAD):** 17 public routes returned `200`: `/`, `/casino`, `/sports`, `/live-casino`, `/slots`, `/promotion`, `/login`, `/signup`, `/profile`, `/about`, `/contact`, `/blog`, `/esports`, `/chat`, `/faq`, `/privacy`, `/terms`. `/dev/design-system` correctly `404` in production. Unknown routes correctly `404`.
- **Preview content check:** Homepage HTML (~199 KB) contains `<title>TCL11</title>`, the logo (`tcl11-logo.png`), hero banner (`banner-01.png`), hero copy ("GET 100%", "WELCOME BONUS"), "Popular Games" and "Featured Games" section headings, VIP section, "AUD" currency, "Payment" section.
- **Production env vars:** None configured (`vercel env ls` = 0 vars), and none required — the frontend has zero backend wiring at this point (no `fetch`, no `/api/v1` references, no `NEXT_PUBLIC_*` reads). All data on the public pages is sourced from `src/data/mock.ts`.
- **Backend hosting (deferred, requires decision):** The NestJS backend in `server/` cannot be deployed to Vercel — Vercel's serverless functions are not a fit for a NestJS process, its Socket.IO WebSocket gateway, or a Prisma connection pool. Recommended paths: Render, Railway, Fly.io, DigitalOcean App Platform. **This is not blocking the current deploy** because the frontend doesn't call the backend yet. When the frontend is wired to the backend, that step also needs: (a) a managed production PostgreSQL (Neon / Supabase / Vercel Postgres / RDS — NOT the local `postgres:postgres` dev DB), (b) backend host chosen and deployed, and (c) `NEXT_PUBLIC_API_URL` set on Vercel to point at the live backend.

### Step 09 — Authentication & Frontend/Backend Integration (2026-11-10, verified against live stack)
- **Username-based auth (user request, 2026-11-10, verified against live stack).** Signup and login now use **username** as the primary identifier; **email is optional**. The user asked: "Users must be able to register using a unique username and password, without requiring an email address."
  - **Schema:** `User.username String @unique` (required, 3–32 chars, letters/digits/dot/underscore/hyphen, lowercased on write); `User.email String? @unique` (now optional, still unique when present).
  - **Migration:** `server/prisma/migrations/20261110090000_add_username/migration.sql`. Adds `username` nullable, backfills from `split_part(email,'@',1)`, resolves any collisions by appending `_<first 6 of id>`, then enforces NOT NULL + UNIQUE + index; drops NOT NULL from `email`. **Preserves all existing rows** — no deletes.
  - **Backend:** `RegisterDto` now requires `username` + `password`; `email`, `phone` optional; first/last name still required (not asked to remove). `LoginDto` is `{username, password}`. `AuthService.register` checks username uniqueness first; if an email is supplied it is also uniqueness-checked. `AuthService.login` looks up by `findByUsername`. `UsersService` grew `findByUsername(username)`; `findByEmail` kept for admin lookups. `JwtPayload` now carries `username` (plus optional `email`). `AuthResponseDto`, `UserResponseDto`, and the `toResponseDto` helper expose `username` + `email: string | null`. Seed users (`demo`, `admin`, `vip`, `mod`) are upserted by username and keep their seeded emails and password `Test1234`.
  - **Frontend:** Login and Signup forms replaced the Email input with a Username input (same visual styling — `ICONS.User` glyph, same padding, label and error shell). Signup still collects first name, last name, phone (required at UI level) and now a username; email is no longer asked for. `SessionUser` on both client (`AuthProvider`) and server (`lib/session.ts`) now has `username: string` + `email: string | null`. `HeaderAuth` labels the user chip from `username` (fallback when there's no first name). Profile page shows `@username` and a read-only Email field marked `(optional)`; the admin dashboard header says `Signed in as @username`.
  - **Verification on live stack (2026-11-10):** `prisma migrate deploy` applied the username migration; `_prisma_migrations` has both `20261110050243_init` and `20261110090000_add_username`. Users table confirmed: `username text not null unique indexed`, `email text nullable`. Backend+frontend `tsc --noEmit`: 0 errors. Live auth flow: register `{username,password,firstName,lastName,phone,acceptTerms}` → 201 with `email: null`; `GET /users/me` with that token → user object exposing username; logout 200; re-login by username 200; wrong password 401 with `"Invalid username or password"`; duplicate username 409 `"This username is already taken"`; invalid characters 400; pre-existing seed user `demo` still logs in with its backfilled username.
- **Approach:** BFF pattern. The browser never sees JWTs — the Next.js app exposes `/api/auth/*` and `/api/me/*` route handlers that proxy to the NestJS backend and manage **HttpOnly cookies** (`tcl_at` access ~16 min, `tcl_rt` refresh 7 days; `SameSite=Lax`, `Secure` in production). The strict rule "Do not store authentication tokens in localStorage" is satisfied — no token value is ever accessible to client JavaScript. Automatic refresh happens inside the BFF: `getSession()` and `withAuthedBackend()` in `src/lib/session.ts` try the current access token, fall back to one refresh attempt, rotate cookies, and only then return 401.
- **Files added (Step 09):**
  - `src/lib/api.ts` — server-only `backendFetch()` / `readBackendError()` for calling NestJS from Next.
  - `src/lib/auth-cookies.ts` — `ACCESS_COOKIE`/`REFRESH_COOKIE` constants, `setAuthCookies()` / `clearAuthCookies()` helpers.
  - `src/lib/session.ts` — `getSession()` (used by the root layout and server pages) + `withAuthedBackend()` (used by BFF PATCH/DELETE routes); both handle refresh-and-retry transparently.
  - `src/app/api/auth/login/route.ts`, `register/route.ts`, `logout/route.ts`, `me/route.ts`.
  - `src/app/api/me/profile/route.ts` — PATCH for display-name edits.
  - `src/components/auth/AuthProvider.tsx` — React Context seeded with the server-rendered session (no auth flicker on first paint) and a client `useAuth()` hook (`user`, `loading`, `refresh`, `logout`).
  - `src/components/auth/HeaderAuth.tsx` — client auth area for the header: Log In / Sign Up when logged out, a user chip + dropdown (profile, admin shortcut, logout) when logged in; the mobile variant renders a compact chip + logout icon. **Admin and VIP role badges are visible only on the logged-in chip; design otherwise preserved.**
  - `src/proxy.ts` — Next.js 16 proxy (formerly middleware). Edge-runtime RBAC gate: `/profile/*` requires any session cookie; `/admin/*` additionally requires the access token's `roles` claim to include `admin` or `super_admin`. Unauthenticated users on these routes get `307 → /login?next=<target>`. Non-admin authenticated users hitting `/admin` get `307 → /`.
  - `src/app/profile/page.tsx` (rewritten as a server component shell) + `src/app/profile/ProfileClient.tsx` (client tabs with real stats from `/profiles/me`; VIP card and Transactions table stay on mock data per the strict rule "Use mock data only where backend functionality does not yet exist").
  - `src/app/admin/page.tsx` — admin-only dashboard reading `GET /admin/dashboard` on the server; shows live counts (Total Users / Active Users / 24h Registrations / Active Games / Active Promotions / Open Tickets / Live WS Clients).
- **Files edited (Step 09):**
  - `src/app/layout.tsx` — root layout is now `async`, resolves the session server-side via `getSession()`, and wraps the tree in `<AuthProvider initialUser={user}>`.
  - `src/components/layout/DesktopHeader.tsx`, `MobileHeader.tsx` — use `<HeaderAuth variant="…">` instead of hard-coded Log In / Sign Up buttons.
  - `src/app/login/page.tsx`, `src/app/signup/page.tsx` — real form state, client-side validation, submission to `/api/auth/*`, error alerts, loading states, `router.replace()` + `router.refresh()` on success, `?next=` support on login.
  - `src/app/promotion/page.tsx` — server component; fetches `/promotions` from the backend and falls back to mock data if the backend is unreachable or returns no active promotions; includes an empty state.
- **Guardrails:**
  - `.env.local` added at the repo root with `BACKEND_API_URL=http://localhost:3200/api/v1` (local-dev only; Vercel production uses env vars configured in the dashboard, not this file). `.env.local` is already covered by the existing `.gitignore` `.env` pattern, and the earlier `.vercelignore` keeps it off every Vercel upload.
  - The root `.gitignore` already blocks `.env`, `.env.*.local`, `.vercel`; no new secrets are checked in.
  - No `console.log` / network trace prints tokens; the BFF response bodies never include the access or refresh token values.
- **Verification (2026-11-10, against the live PostgreSQL + rebuilt NestJS + Next.js dev server):**
  - Frontend `tsc --noEmit`: 0 errors. Backend `tsc --noEmit`: 0 errors (after `prisma generate`). `next build`: succeeds; all 24 routes compile; proxy middleware emitted.
  - Backend built via `nest build`; Prisma migration `20261110090000_add_username` applied cleanly via `prisma migrate deploy`; all 5 existing users were backfilled with usernames (`admin`, `demo`, `vip`, `mod`, plus the earlier E2E test user) — collisions handled by the migration's id-suffix clause but none were triggered.
  - **16 end-to-end tests, all pass:**
    - `GET /` anon → 200.
    - `GET /profile` anon → 307 → `/login?next=/profile`.
    - `GET /admin` anon → 307 → `/login?next=/admin`.
    - `POST /api/auth/register` (new username + email + phone + password + acceptTerms) → 201, HttpOnly `tcl_at` + `tcl_rt` cookies set with correct `Max-Age`, `SameSite=Lax`, `HttpOnly` flags; response body contains **only** the user object (no tokens).
    - `GET /api/auth/me` with cookies → returns full user (id, username, email, firstName, lastName, phone, roles, isActive, createdAt).
    - `GET /profile` authed → 200.
    - `GET /admin` as regular user → 307 → `/`.
    - `POST /api/auth/logout` → `{ok:true}`, clears both cookies, revokes refresh on the backend.
    - `POST /api/auth/login` with `username=admin` → returns `roles:["admin","user"]`.
    - `GET /admin` as admin → 200; page HTML contains Admin Dashboard title and all 7 stat labels (Total Users, Active Users, etc.).
    - `GET /promotion` (public) → 200; HTML contains the three live seeded promotions ("LIVE CASINO TOURNAMENT", "VIP RELOAD BONUS", "WELCOME BONUS") — the fallback notice is absent, confirming the backend path is live.
    - Login with wrong password → 401, `{"message":"Invalid username or password"}`.
    - Register duplicate username → 409, `{"message":"This username is already taken"}`.
    - Register weak password → 400, backend validation message surfaced through the BFF unchanged.
    - **Refresh flow:** manually dropped `tcl_at` from the cookie jar while keeping `tcl_rt`, hit `/api/auth/me` → BFF called `/auth/refresh`, rotated both cookies, returned the user transparently.
    - `PATCH /api/me/profile` with `{"displayName":"…"}` → 200; subsequent `GET /profile` HTML shows the new display name (DB updated).

### Production deployment preparation (2026-11-10, awaiting user-executed launch)
- **Infrastructure chosen by the owner:** Vercel (existing `tcl11-website` project) for the Next.js frontend; Railway (new service) for the NestJS backend; Neon (new project, Postgres 17, Singapore region recommended) for PostgreSQL; Prisma as the ORM (unchanged).
- **Files added:**
  - `server/Dockerfile` — multi-stage build (Node 22 bookworm-slim), non-root `node` user, `tini` as PID 1 for clean zombie reaping, Prisma engines + CLI preserved in the runtime image. CMD runs `npx prisma migrate deploy && node dist/main.js` so pending migrations apply automatically on every boot (idempotent — Prisma skips rows already in `_prisma_migrations`).
  - `server/.dockerignore` — excludes `node_modules`, `dist`, every `.env*` (defense in depth — Railway's variable UI is the only source of env values in production), docs, git metadata.
  - `server/railway.json` — Railway build+deploy config: Dockerfile builder, healthcheck at `/api/v1/promotions` (public, fast, exercises HTTP + Prisma), `ON_FAILURE` restart policy, 1 replica.
  - `server/.env.production.example` — full production variable template with every name, which are SECRET, example formats for `DATABASE_URL` / `DIRECT_URL`, and `openssl rand` guidance for `JWT_SECRET`. Not a filled-in file — values are entered in the Railway dashboard.
  - `docs/DEPLOYMENT.md` — step-by-step for the owner (browser-only actions): architecture diagram, variable tables for Vercel + Railway, the Neon → Railway → Vercel flow with exact clicks, rotation/incident playbook, and Known Issues.
- **Files edited:**
  - `server/prisma/schema.prisma` — added `directUrl = env("DIRECT_URL")` on the datasource so Prisma uses Neon's direct endpoint for migrations and the pooled endpoint for runtime queries. Falls back to `DATABASE_URL` when `DIRECT_URL` is unset, so local dev keeps working.
  - `server/src/main.ts` — now typed `NestExpressApplication`; binds explicitly to `0.0.0.0` so Railway's external router can reach the socket; sets `trust proxy` to 1 so `req.ip` reflects the real client through Railway's load balancer; gates Swagger behind `NODE_ENV !== 'production' || ENABLE_SWAGGER === 'true'` so `/api/v1/docs` isn't exposed on the open internet by default.
  - `server/.env.example` — documented `DIRECT_URL` as an optional sibling of `DATABASE_URL`.
- **Secrets discipline:**
  - No real credentials are checked in. Local `server/.env` already held a dev-only `postgres:postgres@localhost` value and remains gitignored; `.env.production.example` is the ONLY production-shaped file in the repo and contains placeholders only.
  - `.vercelignore` already keeps `server/` (and every `.env`/`.env.*`) out of every Vercel upload; the earlier production Vercel deploy's env list is still empty on the Vercel side.
  - `JWT_SECRET` MUST be regenerated per the doc; the dev fallback in `configuration.ts` (`'dev-secret-change-in-production'`) never reaches production because `NODE_ENV=production` means Railway's injected value wins.
- **Verification (local, 2026-11-10):**
  - Backend `tsc --noEmit`: 0 errors. Backend `nest build`: compiles. Frontend `tsc --noEmit`: 0 errors.
  - Rebuilt backend booted cleanly end-to-end: Prisma connected, 35+ routes mapped, `GET /api/v1/promotions` returned HTTP 200 (this is the Railway healthcheck target). `GET /api/v1/users/me` without auth → 401 (guards intact). Swagger reachable at `/api/v1/docs` only when `NODE_ENV !== 'production'` — confirmed.
- **Known issue — deferred, not a blocker:** a dedicated `/health` + `/ready` controller was built but Nest 11 + Express 5 reported routes as `Mapped` in the startup log while actual requests returned 404. Rather than block the prep on a routing mystery, the module was removed and Railway's healthcheck points at the existing public `GET /api/v1/promotions` endpoint, which is a valid probe target (public, fast, exercises HTTP + Prisma). Logged in `docs/DEPLOYMENT.md` §5 Known issues.

### Step 10 — follow-up (2026-11-10, after provisional approval)
- **Backend admin write endpoints added:**
  - `PATCH /api/v1/games/:id` (admin-only) — accepts partial `{ isActive?, title?, thumbnailUrl? }`.
  - `PATCH /api/v1/promotions/:id` (admin-only) — partial update; flipping `isActive` toggles `PromotionStatus` between `ACTIVE` and `DRAFT`.
  - `DELETE /api/v1/promotions/:id` (admin-only) — hard delete; `userPromotions` cascade-cleans via the schema.
  - `GET /api/v1/promotions?includeInactive=true` — admin-visible drafts / expired.
- **New BFF routes:** `POST /api/admin/promotions`, `PATCH /api/admin/promotions/[id]`, `DELETE /api/admin/promotions/[id]`, `PATCH /api/admin/games/[id]` — all go through `withAuthedBackend` so refresh rotation still works.
- **Admin CRUD forms built:**
  - `/admin/promotions/new` — full Create form with validation.
  - `/admin/promotions/[id]/edit` — same form in edit mode plus a Delete button (with `confirm()` guard).
  - `/admin/games` — per-row `<GameToggleCell>` that PATCHes `isActive`; the public `/games` endpoint filters by `isActive` so a toggle immediately hides the game from players.
- **Platform capabilities section** added to `/admin/settings` listing Live / Not Available / Deferred / Read-only status for every feature (auth, user mgmt, promotions CRUD, game toggle, audit logs, notifications, global search, transactions, sports odds editing, game CRUD, password reset). This is the central document for "what works and why".
- **Topbar accessibility pass:** notification button, messages button and the global search input now have `aria-disabled="true"`, `cursor-not-allowed`, visibly dimmed styling, and tooltips/aria-labels pointing at Platform capabilities.
- **End-to-end CRUD + toggle verified against live local DB (9/9 pass):** create → edit → draft visible in admin list → draft hidden from public `/promotion` → delete → GET 404 → game toggle off → hidden from public `/games` → toggle on → restored.
- **Playwright installed** (`@playwright/test` + chromium; ~130 MB). Config at `playwright.config.ts` with 5 projects: `mobile-375`, `mobile-390`, `mobile-430`, `desktop-1440`, `desktop-1920`. Mobile projects pin `browserName: "chromium"` because default device profiles ship as webkit (not installed). Spec at `tests/visual/admin.spec.ts` covers 14 public routes + 9 admin routes + a console-error assertion; 120 test runs total.
- **Visual & interaction verification (2026-11-10):** All 120/120 Playwright tests passed (5.3m run). Full-page screenshots (115 total) captured across 375px, 390px, 430px, 1440px, and 1920px viewports under `docs/screenshots/` (gitignored). Mobile admin pages verified clean with zero public chrome overlap.
- **Automated QA verification:** Auth (valid login, 401 on bad password/missing token), RBAC access (403 on non-admin `/admin/dashboard`), RBAC privilege escalation guards (403 on self-role change, 403 on self-deactivation, 403 on admin granting SUPER_ADMIN or ADMIN), Promotion CRUD (create, draft toggle, draft hidden from public, draft visible to admin, delete, 404 on deleted), and Game active toggle (on/off reflected immediately) all verified 100% passing.
- **Build verification:** Frontend `tsc --noEmit` (0 errors), backend `tsc --noEmit` (0 errors), Next.js `npm run build` (all 44 routes generated cleanly), NestJS `nest build` (clean).

### Step 11 — Deposit / Withdraw / Transaction Management (2026-11-11, verified against live local PostgreSQL)
- **Scope:** Full BDT-currency wallet system with mobile-banking deposits (bKash, Nagad, Rocket, Upay), manual-review workflow, withdrawal reservation ledger, unified transaction history for users, and an admin Wallet & Finance workspace that approves/rejects/completes requests. Zero auto-approval, no synthetic balances, all money moves inside atomic Prisma transactions.
- **Prisma schema additions (`server/prisma/schema.prisma`):**
  - 3 new enums: `TransactionStatus` (PENDING/APPROVED/REJECTED/COMPLETED), `PaymentType` (SEND_MONEY/CASH_OUT), `WalletLedgerType` (DEPOSIT_CREDIT, WITHDRAWAL_RESERVE/RELEASE/DEBIT, ADJUSTMENT_CREDIT/DEBIT). 7 new values appended to `AuditAction` (DEPOSIT/WITHDRAWAL SUBMITTED/APPROVED/REJECTED/COMPLETED).
  - 5 new models: `PaymentProvider` (seeded with the 4 BD services), `Wallet` (one-per-user, `availableBalance` + `reservedBalance` + optimistic-locking `version`), `WalletTransaction` (immutable append-only ledger, indexed on wallet+createdAt and reference), `DepositRequest` (user+provider+paymentType+amount+trxRef, unique `idempotencyKey = userId:providerId:TRX`), `WithdrawalRequest` (user+provider+phone+amount, `reservationTxId` binds to the ledger row that reserved the funds).
  - All monetary fields `Decimal(14,2)`. Every FK indexed. User cascade-deletes own deposits/withdrawals/wallet; provider deletes `RESTRICT` (protects financial history).
- **Migration (`20261111030000_wallet_and_payments`):** 139-line idempotent SQL — enum extensions guarded with `IF NOT EXISTS`, new tables with FKs + unique indexes, seeds the 4 payment providers via `gen_random_uuid()` + `ON CONFLICT DO NOTHING`, backfills a wallet row for every existing user. Applied cleanly to the local `tcl11` DB (`_prisma_migrations` now has 3 rows).
- **NestJS backend (`server/src/wallet/`):**
  - `wallet.service.ts` — `credit()`, `reserve()` (with optimistic-lock + `InsufficientBalanceError`), `releaseReservation()`, `debitReservation()`. Every mutation goes with a matched `walletTransaction` ledger write inside the same `prisma.$transaction` callback (same `Tx` client), so a crash between the two is impossible.
  - `deposits.service.ts` — create (writes idempotency key, P2002 → 409 Conflict), user list, admin list (status + provider + search filters), `adminApprove` (atomic: lock-via-updateMany on PENDING, upsert wallet, credit, bump profile `totalDeposits`, audit log), `adminReject` (lock-via-updateMany, audit).
  - `withdrawals.service.ts` — create (rejects a second PENDING to stop stacking reservations, calls `reserve()` inside the same tx as the row insert, binds `reservationTxId`), user list, admin list, `adminApprove` (status transition), `adminReject` (releases reservation back to available), `adminComplete` (only from APPROVED, requires an explicit step, `debitReservation` + bumps profile `totalWithdrawals`, requires `payoutReference`).
  - `wallet.controller.ts` — authed `/wallet/me`, `/wallet/deposits` (POST/GET), `/wallet/withdrawals` (POST/GET), `/wallet/transactions` (unified list with `type` + `status` filters), `/wallet/transactions/:id` (user-scoped, 404-safe on other users'). Public `/wallet/providers` and `/wallet/config` (serves limits + agent number from env, defaults BDT 100–100 000 deposit / 500–50 000 withdrawal, agent `01956869852`).
  - `admin-finance.controller.ts` — `@Roles(ADMIN, SUPER_ADMIN)` guarded `GET /admin/finance/{deposits,withdrawals}`, `GET /admin/finance/summary`, `POST /admin/finance/deposits/:id/{approve,reject}`, `POST /admin/finance/withdrawals/:id/{approve,reject,complete}`. Every write path calls the global `AuditService` with action, actor, request IP, user-agent.
  - `wallet.module.ts` registered in `app.module.ts` between Support and Admin. DTOs use `class-validator` with precise messages (`class-transformer` coerces `amount` via `@Type(() => Number)`, Bangladeshi phone regex `/^(?:\+?8801|01)[3-9]\d{8}$/` on withdrawal, alphanumeric 4–64 on deposit TrxID).
- **Next.js BFF routes (`src/app/api/`):**
  - User: `POST/GET /api/me/deposits`, `POST/GET /api/me/withdrawals`, `GET /api/me/wallet`, `GET /api/me/wallet/config`, `GET /api/me/wallet/providers`, `GET /api/me/transactions`.
  - Admin: `GET /api/admin/finance/{deposits,withdrawals,summary}`, `POST /api/admin/finance/deposits/[id]/[action]` (approve|reject), `POST /api/admin/finance/withdrawals/[id]/[action]` (approve|reject|complete). All authed via `withAuthedBackend` so refresh rotation still works.
- **Frontend UI (`src/components/wallet/`, `src/app/profile/ProfileClient.tsx`, `src/components/admin/FinanceManager.tsx`, `src/app/admin/finance/page.tsx`):**
  - Shared `Modal` (portal, Escape close, body-scroll lock, backdrop click) in `src/components/ui/Modal.tsx`.
  - `DepositModal` — 4-step: Method → Payment Type → Amount → Confirm (agent number + Copy button + Transaction ID input + submit). Step subtitle updates with progress. "Submitted" final state explains the PENDING flow.
  - `WithdrawModal` — single-step: provider grid, BD mobile input (regex-validated), amount (with min/max from config + balance check), submits and refreshes wallet. Reservation visible to the user in the balance banner after submit.
  - `TransactionList` — unified list for the Profile `Transactions` tab. 6 filter chips (All / Deposit / Withdraw / Pending / Approved / Rejected). Desktop table + mobile cards. `StatusBadge` component covers all 4 statuses with distinct colours.
  - `ProfileClient.tsx` now renders a Wallet balance card in Overview with Deposit + Withdraw buttons, loads the live wallet via `/api/me/wallet`, and refreshes after each submission. Mock transaction table removed from Transactions tab.
  - `FinanceManager.tsx` (admin) — Deposits/Withdrawals tab switcher, status + provider + search filters, paginated table, summary tiles across the top, and a per-row "Open" modal that shows every field, admin-note textarea, and action buttons. Approved withdrawals require a `payoutReference` input before Complete is enabled. Rejection releases the reservation; completion debits it.
  - `src/app/admin/finance/page.tsx` replaces the earlier `PendingSection` placeholder. `/admin/transactions` page updated to link to Wallet & Finance.
  - Icon registry gained `Copy`, `ArrowDownCircle`, `ArrowUpCircle`, `AlertTriangle`, `Loader2`, `CheckCircle2`, `XCircle`, `Filter`.
- **Configuration (env, no code change required):** `WALLET_CURRENCY`, `DEPOSIT_AGENT_NUMBER`, `DEPOSIT_MIN`/`DEPOSIT_MAX`, `WITHDRAWAL_MIN`/`WITHDRAWAL_MAX`. All default-sensible so the system runs without configuration.
- **Security & responsible-gaming guarantees enforced in code:**
  - User endpoints are wrapped in `JwtAuthGuard`; every write pulls `userId` from `@CurrentUser('id')` and never from the body.
  - Admin endpoints require `ADMIN` or `SUPER_ADMIN` via `RolesGuard`.
  - Idempotency: one deposit per (user, provider, TrxID). Second try → 409.
  - Reservation on withdrawal happens inside the same Prisma transaction as the row insert; failure rolls both back.
  - `updateMany` with a status predicate is the row-level lock for approve/reject/complete — a second concurrent admin loses the race and gets 409 instead of double-processing.
  - Rejection path releases the reservation (money returns to available). Completion path debits reservation (money leaves the business). Available balance never moves without an audit log + ledger write.
  - `AuditService.log()` is called on every admin decision with IP + user-agent, writing a row into `audit_logs`.
- **End-to-end verification (2026-11-11, live local backend + PostgreSQL):**
  - Backend `tsc --noEmit`: 0 errors. `nest build`: compiles.
  - Frontend `tsc --noEmit`: 0 errors. `next build`: 54 routes generated (10 new ones: 6 BFF routes + 4 admin pages/placeholders).
  - Prisma migrate deploy: migration applied cleanly; 4 providers seeded; wallets backfilled for all 9 existing users.
  - Automated E2E suite (`scratchpad/wallet-e2e.mjs`): **31/31 tests passed**. Covers: register, providers list, config, zero-balance wallet, below-minimum 400, unknown-provider 400, PENDING deposit create, duplicate-TrxID 409, no-credit-before-approval, non-admin 403 on admin endpoints, admin list, admin approve (wallet credited to 2000), re-approve 409, withdraw-above-balance 400, invalid-phone 400, withdrawal creates PENDING and reserves 1500, second-pending-withdrawal 409, reject releases reservation (back to 2000), fresh withdrawal + approve + complete debits reservation (wallet=1000), double-complete 409, unified transaction list length=3, type filter, status filter, cross-user isolation (other user sees 0 transactions), finance summary counts.
  - Audit trail verified in DB: 1 DEPOSIT_SUBMITTED, 1 DEPOSIT_APPROVED, 2 WITHDRAWAL_SUBMITTED, 1 WITHDRAWAL_APPROVED, 1 WITHDRAWAL_REJECTED, 1 WITHDRAWAL_COMPLETED rows written during the test run.
  - Ledger verified in DB: 5 wallet_transaction rows match the reserve → release → reserve → debit sequence with balance-after values that reconcile to the final state.
- **Known limitations (documented):**
  - Vendor logos not shipped — brand mark uses `ProviderLogo` initial on brand colour. Swap in licensed SVGs when available.
  - VIP tier progress and the Transactions screen's older mock data were removed; VIP card still reads static mock (`VIP_STATUS`) because no backend tier/progress endpoint exists yet.
  - Reservation stacking is blocked at "one pending withdrawal per user"; if partial withdrawals are needed later, either lift the lock and track total-reserved against available-only, or let the admin close pending items first.
  - No payment-gateway integration — deposit verification is strictly manual (admin eyeballs the agent app and the TrxID). No webhook ingestion exists.
  - Playwright visual verification for the new modals and the admin finance page was NOT re-run in this pass (production build passes, backend E2E passes). Run before user acceptance.

## 3. Pending tasks
- [ ] **User approval of Step 11** (Wallet & Finance workflow, modals, admin review) and of Step 10 (admin dashboard) before Production Deployment resumes.
- [ ] **Owner-executed browser steps blocking production deploy** (see `docs/DEPLOYMENT.md` §3): re-issue a fresh GitHub device code (three codes `2204-5EC5`, `45A1-CD82`, `3404-5815` all expired during build sessions) + authorize at https://github.com/login/device, sign up for Neon (§3.1) and copy the pooled + direct URLs, sign up for Railway (§3.2) and paste the Neon URLs plus the other env vars into the Railway dashboard, add `BACKEND_API_URL` to the Vercel project (§3.4).
- [x] **Production seed strategy chosen and built:** content-only seed (`server/prisma/seed.prod.ts`) + admin-bootstrap CLI (`server/prisma/admin-promote.ts`). No default passwords ever land in the DB.
- [x] **Playwright installed and configured.** Chromium only. 120 responsive tests across 5 widths; screenshots under `docs/screenshots/` (gitignored).
- [x] **Promotion CRUD forms built.** Game active-toggle built.
- [ ] **(Deferred)** proper `/health` + `/ready` endpoints after root-causing the Express 5 / Nest 11 routing issue; Railway healthcheck currently uses `GET /api/v1/promotions` (public, fast, exercises HTTP + Prisma).
- [ ] **(Deferred)** Game CRUD beyond on/off toggle (create new games, change title/thumbnail, swap provider); match-odds editing (sports data is adapter-sourced, provider needed first); password reset + email verification (no mail gateway configured).
- [ ] Decide the open questions in §5 (blocking items: market/currency, licensing, age gating).
- [ ] Obtain source assets (game tiles, provider/payment logos, badges) — see §6.

---

## 4. Project architecture
- **Frontend:** Next.js 16.4.5 (App Router) + React 19.3.1 + TypeScript 5.9.3 + Tailwind CSS v4.
- **Motion:** CSS-only animations (no Framer Motion used in production).
- **Carousels:** Swiper.js 14.
- **Icons:** Lucide React; brand logos as SVG.
- **Responsive:** separate desktop and mobile section variants, switched by CSS (`lg:` breakpoint).
- **Backend:** NestJS 11.x + TypeScript 5.9 in `server/`.
- **API:** REST (35+ endpoints) + WebSocket (Socket.IO).
- **Auth:** JWT (Passport) + bcrypt + RBAC (5 roles).
- **Database:** PostgreSQL 15+ via Prisma ORM 6.9 (17 models, 8 enums, all services integrated).
- **Cache/Pub-Sub:** Redis architecture designed, ioredis included (integration deferred).

---

## 5. Important file locations
| File | Purpose |
|---|---|
| `CLAUDE_PROJECT_STATE.md` | This file. Project continuity. |
| `docs/UI_REFERENCE_ANALYSIS.md` | Full reference analysis (desktop, mobile, visual system, assets, assumptions). |
| `docs/COMPONENT_ARCHITECTURE.md` | Proposed stack, responsive strategy, file tree, component hierarchy, data model, open decisions. |
| `server/docs/ARCHITECTURE.md` | Backend system architecture, module diagram, technology stack, WebSocket flow, Redis plan. |
| `server/docs/API_ENDPOINTS.md` | All 35+ REST endpoints with methods, auth levels, request/response examples. |
| `server/docs/SECURITY.md` | Authentication, password policy, RBAC matrix, API security, compliance roadmap. |
| `server/docs/DATABASE.md` | Database architecture, ER diagram, migration procedures, seed data inventory. |
| `server/prisma/schema.prisma` | Prisma schema: 17 models, 8 enums, all relations/indexes/constraints. |
| `server/prisma/seed.ts` | Development seed script (4 users, 14 games, 7 matches, 6 promotions, etc.). |
| `server/.env.example` | Environment variable template (never commit `.env`). |
| Reference image | Provided in chat only: `C:\Users\THISPC~1\AppData\Local\Temp\claude\9759fe959791bfc5\ca3eb1a8-c629-451b-b909-83832b70a36c\images\1.png`. Not yet copied into the project (Step 02 will copy it to `docs/reference/`). |

### Open questions (blocking)
1. **Mobile below the fold** — the mobile reference shows only the top screen. Live transactions, sports banner, payments, why-choose, and footer have no mobile design.
2. **Tablet breakpoint** (768–1023 px) — not in the reference.
3. **Responsive strategy** — approve Option A (CSS-only switch, separate variants) or choose another.
4. **Marquee** — static or scrolling?
5. **Hero text** — live HTML (recommended) or baked into artwork?
6. **Market and currency** — transactions show AUD; payment methods (bKash, Rocket, Upay) suggest a South Asian market. Which is the target?
7. **Third-party assets and licensing** — provider logos, payment logos, a footballer photo, and 18+/Gambling Aware badges. Will the client supply them, or use labelled placeholders?
8. **Regulation / age gating** — is the target jurisdiction licensed, and is an age gate needed before game content loads?
9. **Brand icons** — approve inline SVG for YouTube, Facebook, Telegram, Instagram, TikTok.
10. **Fonts** — approve testing Anton / Bebas Neue / Barlow Condensed for display type.

---

## 6. Existing errors
- None. No code exists yet.
- Reference inconsistencies noted (not errors in code):
  - VIP progress bar is ~25% filled but reads "0 Left To Upgrade".
  - Unidentified orange payment logo in the payment strip.
  - "DHF"-like mark on the desktop Live Chat icon is unclear.

---

## 7. Design decisions (locked for Step 01)
| Decision | Value | Source |
|---|---|---|
| Visual theme | Black base, bright red glowing borders, gold accents, white text, casino promo art | Roadmap + reference |
| Mobile vs desktop | Separate layouts; mobile is not scaled-down desktop | Roadmap rule 6 |
| Missing assets | Labelled neutral placeholder (`AssetPlaceholder`), never random or stock images | Roadmap rule 7 |
| Full screenshot as background | Forbidden | Roadmap rule 9 |
| Reuse of supplied assets | Required wherever possible | Roadmap rule 8 |
| Backend | Not started; Step 06 approval required first | Roadmap rules |
| Tokens | Defined as CSS variables from estimated palette (`UI_REFERENCE_ANALYSIS.md` §4.1) | This step |

---

## 8. Next development action
**Step 12 Full-project completion pass complete locally.**
- 59 Next.js routes build cleanly; 36/36 anonymous probes pass; 31/31 wallet E2E still green; backend builds clean.
- New: `/fishing` (playable virtual-points canvas game), `/responsible-gaming`, `/notifications` (live backend data), `/referral`, `/forgot-password`; admin `/admin/reports` replaced with a real live-data dashboard.
- Bangla UI applied across sidebar, topbar, public nav, mobile tabs, footer, profile tabs, wallet labels, and all new pages (~70 % Bangla / 30 % English).
- Next step: user visual approval of the Bangla layout and the Fishing Game. Then run Playwright visual verification across the 5 configured viewports. Production Deployment still queued.
