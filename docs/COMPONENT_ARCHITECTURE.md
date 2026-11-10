# TCL11 — Component Architecture (proposed)

**Status:** proposal only. Nothing in this document is implemented yet. It becomes binding after Step 01 approval.
**Based on:** `docs/UI_REFERENCE_ANALYSIS.md`.

---

## 1. Stack (Step 02 will scaffold this)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router), TypeScript, `src/` directory | Latest stable at scaffold time |
| Styling | Tailwind CSS, design tokens as CSS variables in `globals.css` | Tokens from `UI_REFERENCE_ANALYSIS.md` §4.1 |
| Motion | Framer Motion (UI transitions), GSAP only if a timeline is needed (e.g. marquee) | GSAP not installed until needed |
| Carousels | Swiper.js (hero, popular games, featured games, mobile tiles) | One shared wrapper component |
| Icons | Lucide React for UI icons; brand logos as SVG files | Lucide has no reliable brand icons |
| Backend | **Not in scope** until Step 06 is approved | No NestJS, Prisma, Redis, Socket.IO now |

---

## 2. Responsive strategy (decision needed — see §9)

Three options were considered:

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. CSS-only switch** (recommended) | Render desktop and mobile variants of each section; hide with `hidden lg:block` / `lg:hidden` | No hydration mismatch; no JS breakpoint state; SSR-safe | Duplicated DOM for sections; two Swiper instances per carousel |
| B. JS `useMediaQuery` | One tree, JS picks the layout | Less DOM | Hydration mismatch risk; flicker on first paint |
| C. One responsive tree | Single component with Tailwind responsive classes | Least code | Roadmap forbids "scaled-down desktop" mobile; hard to match both references |

**Recommendation: A.** Shared data and primitives, separate layout components for the sections that differ. Header and bottom tab bar are the only truly separate chrome.

Breakpoints (proposed):
- Mobile: `< 768 px` (reference: ~390 px frame, 16 px gutter)
- Tablet: `768 px – 1023 px` (not in reference — see §9)
- Desktop: `≥ 1024 px` (reference: ~1536 px frame; content max-width TBD)

---

## 3. Proposed file structure

```
TCL betting website/
├── CLAUDE_PROJECT_STATE.md
├── docs/
│   ├── UI_REFERENCE_ANALYSIS.md
│   ├── COMPONENT_ARCHITECTURE.md
│   └── reference/                    # (Step 02) copy of reference image, kept for diffing
├── public/
│   ├── brand/                        # logo (svg + variants), favicon
│   ├── games/
│   │   ├── categories/               # SLOT, BONZA, ARISTOCRAT, LIVE
│   │   ├── featured/                 # 10 featured tiles
│   │   └── providers/                # provider logos (licensed)
│   ├── payments/                     # payment logos
│   ├── badges/                       # app store, 18+, gambling aware
│   ├── social/                       # social icons
│   ├── hero/                         # hero artwork (desktop + mobile crops)
│   └── sports/                       # sports banner art
├── src/
│   ├── app/
│   │   ├── layout.tsx                # root layout: fonts, globals, header/footer shell
│   │   ├── page.tsx                  # home page: composes desktop + mobile sections
│   │   ├── globals.css               # tokens, base styles, glow utilities
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SiteHeader.tsx        # desktop top bar (lg+)
│   │   │   ├── MobileTopBar.tsx      # mobile header (< lg)
│   │   │   ├── MobileBottomNav.tsx   # mobile fixed tab bar (< lg)
│   │   │   ├── PromoMarquee.tsx      # gold strip
│   │   │   ├── LanguageSelect.tsx
│   │   │   ├── SiteFooter.tsx
│   │   │   └── NavItem.tsx
│   │   ├── home/
│   │   │   ├── hero/
│   │   │   │   ├── HeroCarousel.tsx        # shared Swiper wrapper, both breakpoints
│   │   │   │   ├── HeroSlideDesktop.tsx
│   │   │   │   └── HeroSlideMobile.tsx
│   │   │   ├── VipPanel.tsx                # shared content, two layout variants via prop
│   │   │   ├── LiveTransactionTable.tsx    # desktop only (mobile TBD)
│   │   │   ├── SportsBettingBanner.tsx     # desktop only (mobile TBD)
│   │   │   ├── ShortcutGrid.tsx            # desktop: 6 wide tiles; mobile: 6 compact columns
│   │   │   ├── PopularGames/
│   │   │   │   ├── PopularGamesDesktop.tsx # with category tabs
│   │   │   │   └── PopularGamesMobile.tsx  # no tabs, horizontal scroll
│   │   │   ├── FeaturedGames/
│   │   │   │   ├── FeaturedGamesDesktop.tsx # 2 × 5 grid
│   │   │   │   └── FeaturedGamesMobile.tsx  # horizontal scroll
│   │   │   ├── PaymentMethodStrip.tsx      # desktop only (mobile TBD)
│   │   │   └── WhyChooseGrid.tsx           # desktop only (mobile TBD)
│   │   ├── games/
│   │   │   ├── GameTile.tsx                # FREE badge, art, provider logo overlay
│   │   │   ├── CategoryTile.tsx            # SLOT / BONZA / ARISTOCRAT / LIVE
│   │   │   └── GameTileSkeleton.tsx
│   │   └── ui/
│   │       ├── Button.tsx                  # variants: gold, red, outline-gold
│   │       ├── Pill.tsx                    # SUCCESS / WIN / LIVE / FREE
│   │       ├── Card.tsx                    # red-glow panel shell
│   │       ├── ProgressBar.tsx
│   │       ├── SectionHeader.tsx           # icon + title + "View All →"
│   │       ├── Tabs.tsx                    # pill tabs (desktop popular games)
│   │       ├── CarouselArrow.tsx
│   │       ├── IconTile.tsx                # red-glow square with icon
│   │       ├── AssetPlaceholder.tsx        # labelled neutral placeholder for missing assets
│   │       └── Logo.tsx                    # TCL11 logo, variant prop
│   ├── data/                               # mock data only, typed (until Step 06)
│   │   ├── navigation.ts
│   │   ├── heroSlides.ts
│   │   ├── vipLevels.ts
│   │   ├── transactions.ts
│   │   ├── games.ts
│   │   ├── categories.ts
│   │   ├── paymentMethods.ts
│   │   ├── features.ts
│   │   └── footerLinks.ts
│   ├── types/
│   │   ├── game.ts
│   │   ├── transaction.ts
│   │   ├── vip.ts
│   │   └── navigation.ts
│   ├── lib/
│   │   ├── cn.ts                           # class name helper
│   │   └── format.ts                       # currency (AUD), masked IDs
│   └── hooks/                              # only if needed (e.g. useReducedMotion)
└── package.json, tsconfig.json, tailwind.config.ts, next.config.ts  # created at Step 02
```

### Naming rules
- Components: PascalCase, one component per file.
- Desktop/mobile variants: suffix `Desktop` / `Mobile`. Shared content in a neutral name.
- Data files: camelCase, export typed constants. No data inside components.
- Assets: kebab-case filenames, grouped by domain as shown above.

---

## 4. Component hierarchy (home page)

```
RootLayout
├── PromoMarquee                       (desktop + mobile? → desktop only in reference)
├── SiteHeader                         (lg+)
│   ├── Logo
│   ├── nav: NavItem × 7
│   ├── SearchButton
│   ├── Button (outline-gold) "Log In"
│   ├── Button (red) "Sign Up"
│   └── LanguageSelect
├── MobileTopBar                       (< lg)
│   ├── IconButton (menu)
│   ├── Logo
│   ├── IconButton (support)
│   └── Auth buttons row
├── <main> HomePage
│   ├── Desktop body (lg+)
│   │   ├── Column: main (2/3)
│   │   │   ├── HeroCarousel (desktop slide)
│   │   │   ├── ShortcutGrid (desktop)
│   │   │   ├── PopularGamesDesktop
│   │   │   │   ├── SectionHeader
│   │   │   │   ├── Tabs
│   │   │   │   ├── CarouselArrow × 2
│   │   │   │   └── CategoryTile × 4
│   │   │   └── FeaturedGamesDesktop
│   │   │       ├── SectionHeader
│   │   │       └── GameTile × 10
│   │   └── Column: rail (1/3)
│   │       ├── VipPanel (desktop)
│   │       ├── LiveTransactionTable
│   │       ├── SportsBettingBanner
│   │       └── WhyChooseGrid
│   │       └── IconTile × 4
│   ├── Mobile body (< lg)
│   │   ├── HeroCarousel (mobile slide)
│   │   ├── VipPanel (mobile)
│   │   ├── ShortcutGrid (mobile)
│   │   ├── PopularGamesMobile
│   │   └── FeaturedGamesMobile
│   │       (further sections: TBD — see §9)
├── PaymentMethodStrip                 (lg+ in reference)
├── SiteFooter                         (lg+ in reference; mobile TBD)
└── MobileBottomNav                    (< lg, fixed)
```

---

## 5. Data model (mock, typed)

```ts
// types/game.ts
export type GameCategory = 'slots' | 'table' | 'live-casino' | 'fishing' | 'arcade';

export interface Game {
  id: string;
  title: string;           // e.g. 'MEGAH5'
  provider: string;        // e.g. 'Pragmatic Play'
  category: GameCategory;
  artSrc: string;          // /games/featured/...
  logoSrc?: string;        // provider logo
  isFree: boolean;         // FREE badge
  featured: boolean;
}

// types/transaction.ts
export type TransactionType = 'ADD' | 'WITHDRAW';
export type TransactionStatus = 'SUCCESS' | 'WIN';

export interface Transaction {
  id: string;
  userId: string;          // already masked: 'G*****518'
  type: TransactionType;
  amount: number;          // minor-unit safe later; plain number for mock
  currency: 'AUD';         // see §9 open question
  status: TransactionStatus;
}

// types/vip.ts
export interface VipStatus {
  level: number;           // 0 for guests
  nextLevel: number;
  progress: number;        // 0..1
  remainingToUpgrade: number;
  locked: boolean;         // true until login (Login To View VIP Status)
}
```

Mock data is for Step 03–05 only. Real auth and data come with Step 06+.

---

## 6. Shared primitives (token usage)

| Primitive | Visual rules (from reference) |
|---|---|
| `Card` | Dark fill `--tcl-surface`, 1–2 px `--tcl-red` border, red glow, radius 12 px |
| `Button` gold | Gold vertical gradient, black bold uppercase text, radius pill, optional leading icon |
| `Button` red | Solid red, white bold text, glow on hover |
| `Button` outline-gold | 1 px gold border, gold text, transparent fill |
| `Pill` | Radius full, 11–12 px uppercase bold. Variants: `live` (red), `success` (green), `win` (gold), `free` (red badge) |
| `IconTile` | Red gradient square, red glow, gold icon, radius 8 px |
| `CarouselArrow` | 32–36 px circle, dark fill, gold ring |
| `ProgressBar` | Dark track, gold fill, radius full, height ~8 px |
| `SectionHeader` | Icon (gold) + title (white bold) + optional right link |

---

## 7. Layout primitives

- `Container`: desktop max width matches reference frame; side padding 24 px desktop, 16 px mobile.
- `TwoColumnBody`: `grid-cols-[2fr_1fr]` with 16 px gap, desktop only.
- `MobileStack`: single column, 12 px vertical gap.
- `HorizontalScroller`: Swiper with `slidesPerView: 'auto'`, no pagination, snap enabled.

---

## 8. Build order (Step 02 onward — pending approval)

1. Scaffold Next.js + TypeScript + Tailwind + Lucide + Framer Motion + Swiper (`docs/` untouched).
2. Global tokens (`globals.css`) and base layout shell.
3. Shared `ui/` primitives.
4. Header + mobile top bar + bottom nav (chrome first, since it appears on every page).
5. Hero (desktop + mobile) with placeholder artwork.
6. VIP panel, shortcut grid.
7. Popular + featured games with placeholder tiles.
8. Rail components (transactions, sports, why-choose).
9. Payment strip, footer.
10. Asset swap-in as assets arrive; visual QA against reference.

*(Step numbering matches the master roadmap; Steps 02–10 will be confirmed when the roadmap is approved.)*

---

## 9. Decisions needed (blocking for Step 02 or later)

1. **Mobile below the fold:** the reference does not show mobile sections for Live Transactions, Sports, Payments, Why Choose, or the footer. Options: (a) provide a mobile design; (b) let me derive them from desktop with mobile-specific layout, marked as "inferred" in the docs.
2. **Tablet breakpoint** (768–1023 px) is not in the reference. Proposed: use the mobile layout up to 1023 px, or the desktop layout with a narrower rail. Confirm.
3. **Responsive strategy:** approve Option A (CSS-only switch, duplicated section variants) or choose B/C.
4. **Marquee:** static or scrolling?
5. **Hero text:** live HTML (recommended) or baked into artwork?
6. **Market and currency:** AUD in the transaction table vs bKash/Rocket/Upay payment methods. Which market and currency should the first build use? This also decides language and legal copy.
7. **Licensed assets:** provider logos, payment logos, footballer photo, and the 18+ / Gambling Aware badges are third-party. Are assets supplied by the client, or should the build use labelled placeholders until then?
8. **Regulatory and age gating:** the footer shows 18+ and Gambling Aware. Is the target jurisdiction licensed, and is an age gate required before any game content loads? This is outside pure design but affects the Step 02 layout.
9. **Brand icons:** approve inline SVG for YouTube, Facebook, Telegram, Instagram, TikTok (Lucide does not provide them).
10. **Fonts:** approve the display font candidate test (Anton / Bebas Neue / Barlow Condensed) in Step 03.

---

## 10. Out of scope for Steps 01–05
- Backend, database, auth, real transactions, real VIP logic, payment processing.
- Any Socket.IO or live data feed (mock only).
- Deployment (GitHub, Docker, Vercel).
