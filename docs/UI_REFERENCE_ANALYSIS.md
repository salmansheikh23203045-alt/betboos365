# BetBoos365 — UI Reference Analysis

**Source:** single composite reference image (left: desktop, right: mobile).
**Status:** Step 01 analysis. Colors and sizes are estimated by eye from the image and must be verified with an eyedropper / original design files before Step 03 (styling).

---

## 1. Reference coverage (important)

| Area | Desktop reference | Mobile reference |
|---|---|---|
| Top nav / header | Full | Partial (logo, Log In, Sign Up, menu, support icon) |
| Promo marquee strip | Full | **Not visible** |
| Hero banner | Full | Full (smaller) |
| VIP panel | Full | Full |
| Live transaction table | Full | **Not visible** |
| Sports betting banner | Full | **Not visible** |
| Shortcut tiles | Full (6) | Full (6, smaller labels) |
| Popular games | Full (tabs + 4 tiles) | Partial (no tabs, 4th tile cut off) |
| Featured games | Full (2 × 5 grid) | Partial (3 visible, cut off) |
| Payment strip | Full | **Not visible** |
| Why Choose BetBoos365? | Full | **Not visible** |
| Footer | Full | **Not visible** |
| Bottom tab bar | — | Full (5 tabs) |

**Consequence:** the mobile design below the fold is unknown. It must not be invented silently. See *Open Questions* in `CLAUDE_PROJECT_STATE.md`.

---

## 2. Desktop layout (≈1536 px-wide frame)

Overall structure: a **header**, a full-width **gold marquee**, then a **two-column body**: a wide main column (~2/3) and a narrow right rail (~1/3). The footer spans full width. The payment strip sits between the body and the footer, spanning full width.

### 2.1 Header (top bar, ~62 px tall, black)
- **Left:** BetBoos365 logo (dice/cards/crown mark + wordmark, gold + white).
- **Center-left nav:** icon-over-label items: `Home` (active: red filled tile with gold text), `Casino`, `Slots`, `Live Casino`, `Sports`, `Esports`, `Promotion`.
- **Right:** search icon (ghost), `Log In` (gold 1 px outline, gold text), `Sign Up` (solid red, white bold text), language selector `EN` with UK flag and chevron.

### 2.2 Promo marquee (~28 px tall)
- Full-width gold (#F5B800-ish) strip, black uppercase bold text, single line, centered:
  `WELCOME TO BetBoos365, A PLACE WHERE THRILLING EXPERIENCES AND EVERYDAY ENJOYMENT COME TOGETHER AND TAKE PLEASURE IN THE ACTION AS YOU SEE IT!!`
- Reference shows it static; likely a scrolling marquee in production (decision needed, see Open Questions).

### 2.3 Hero banner (main column, ~770 × 220 px, rounded ~12 px, red glowing border)
- Background: dark red-to-black with fire/ember texture.
- Left text block: gold pill label `WELCOME BONUS` with crown icon; headline `GET 100%` (white + gold, heavy italic-style display type), subline `WELCOME BONUS` (white heavy), small caption `On Your First Deposit`; gold pill CTA `Claim Now →` (black text).
- Right: large red demon character, playing cards (A♠ A♦), red dice, gold coin/chip, floating gold coins.
- Carousel: left/right circular arrow buttons (vertically centered, dark with thin gold ring), pagination dots (4) bottom-center-left, active dot gold.

### 2.4 Right rail — top: VIP panel (~330 × 145 px, red glowing border, dark fill)
- Row 1: crown icon + `VIP Level: VIP 0` (left), `Next: VIP 1` (right, white).
- Progress bar: full width, dark track, gold fill (≈ 25% fill in reference, though the copy says 0 left).
- Caption: `0 Left To Upgrade` (gold small text).
- Full-width gold button with crown icon: `Login To View VIP Status` (black text).

**Note:** the fill (~25%) and "0 Left To Upgrade" disagree in the reference. Treat the fill as a placeholder driven by data.

### 2.5 Right rail — Live transaction (~330 × 180 px, red border)
- Header: `LIVE TRANSACTION` (LIVE in gold, TRANSACTION in white) with a red pill `LIVE ●` (right).
- Table columns: `User ID` · `Type` · `Amount` · `Status`.
- Rows (5 visible): masked IDs such as `G*****518`; Type `ADD`; Amount in gold `AUD 24.00`, `AUD 13.25`, `AUD 50.00`, `AUD 5.30`, `AUD 9.00`; Status pill: green `SUCCESS` or gold `WIN`.
- Table text is white; header row bold, lighter weight.

### 2.6 Right rail — Sports Betting banner (~330 × 165 px, red border, rounded)
- Background: red stadium-lights photo/graphic with footballer in light-blue/white kit (right side).
- Stylized gold display title `Sports` / `Betting` (italic, heavy, gold with black outline).
- Subline `Bet on Your Favorite Teams` (white).
- Gold pill button `Bet Now →`.

### 2.7 Right rail — Why Choose BetBoos365? (~330 × 150 px, dark, red border)
- Heading `Why Choose BetBoos365?` (white, bold).
- 4 columns, each: square red-glow icon tile (gold icon) + 2-line label:
  - Shield-check icon — `Safe & Secure`
  - Zap icon — `Fast Deposit & Withdraw`
  - Headset icon — `24/7 Support`
  - Gift icon — `Daily Bonus`

### 2.8 Shortcut row (main column, full width of main, ~770 × 70 px)
- 6 equal red-glow tiles, each icon over label (white, uppercase, bold):
  `HOME`, `HISTORY`, `BONUS`, `LIVE CHAT` (small notification dot on icon), `VIP`, `SETTING`.
- Tile: red gradient fill, bright red glowing border, rounded ~8 px.
- Note: `HOME` tile appears brighter/highlighted (active state).

### 2.9 Popular Games (main column, ~770 × 170 px, red-bordered panel)
- Header: flame icon + `Popular Games` (white, bold). Right side: category tabs as pill buttons:
  `All Games` (active: gold fill, black text), `Slots`, `Table`, `Live Casino`, `Fishing`, `Arcade` (inactive: white/gray text, no fill).
- Carousel: left/right arrows on the sides.
- 4 large tiles (~150 × 110 px each): `SLOT`, `BONZA`, `ARISTOCRAT`, `LIVE` — these are **stylized category tiles** with big gold/red 3D-style illustrations (slot machine, dice, crown, roulette/live icon) and a bold label.

### 2.10 Featured Games (main column, ~770 × 230 px, red-bordered panel)
- Header: gamepad icon (gold) + `Featured Games` (white, bold) + `View All →` (white, right).
- Grid: **2 rows × 5 columns**, each tile ~140 × 85 px, rounded ~8 px, red glowing border.
- Each tile:
  - Background: a woman-character illustration over a casino-style scene (warm/red tones).
  - Top-right red badge `FREE`.
  - Bottom-center: provider logo.
- Tiles, row 1: `MEGAH5`, `bcoongo`, `UU SLOTS`, `PLAYTECH`, `PRAGMATIC PLAY`.
- Tiles, row 2: `PG POCKET GAMES SOFT`, `JILI`, `JOKER`, `HACKSAW GAMING`, `EVOPLAY`.

### 2.11 Accepted Payment Method strip (full width, ~1150 × 35 px, dark pill with red border)
- Label `Accepted Payment Method` (white, left) followed by logos: `VISA`, `Mastercard`, `bKash` (pink/magenta), an **unidentified orange logo**, `Rocket`(?) (red/pink), `Upay` (blue/white), `Skrill` (magenta), `NETELLER` (green), `PayPal` (blue), `USDT` (green + teal icon).
- Logos are third-party marks; they must be supplied as official assets.

### 2.12 Footer (full width, black/dark-red gradient, ~1150 × 150 px)
- **Brand column:** BetBoos365 logo; paragraph: `BetBoos365 is a trusted online entertainment platform with a wide range of casino, slots, live casino, sports and more. Play safely and enjoy exciting rewards.`
- **Quick Links** (gold section title): Home, About Us, Blog, FAQ — each with a small gold arrow icon.
- **Games:** Casino, Slots, Live Casino, Sports.
- **Help & Support:** Contact Us, Live Chat, Terms & Conditions, Privacy Policy.
- **Get The App:** text `Download our mobile app for a better experience`; two black badges: `Download for Android` (Google Play style), `Download for iOS` (App Store style).
- **Follow Us:** circular red icon buttons: YouTube, Facebook, Telegram, Instagram, TikTok.
- **Bottom bar:** `© 2026 BetBoos365. All Rights Reserved.` (centered) · right side `18+ Play Responsibly` badge · `Gambling Aware` badge.

---

## 3. Mobile layout (≈390 px-wide phone frame, status bar `9:41`)

Mobile is **not** a scaled desktop. It has its own header, its own shortcut treatment, and a bottom tab bar.

### 3.1 Mobile header (sticky top, ~60 px)
- Left: gold hamburger icon.
- Center: BetBoos365 logo.
- Right: gold headset icon (support).
- Below: two equal full-width buttons in a row: `Log In` (gold outline), `Sign Up` (solid red).

### 3.2 Hero (mobile, full width, ~330 × 140 px)
- Same artwork and copy as desktop, cropped and scaled: `WELCOME BONUS` pill, `GET 100%` headline, `WELCOME BONUS`, `On Your First Deposit`, `Claim Now →`.
- Carousel dots and arrows at edges.

### 3.3 Shortcut row (mobile)
- 6 equal columns (not a row of wide tiles): icon over tiny label: `Home`, `History`, `Bonus`, `Live Chat`, `VIP`, `Setting`.
- Icon tiles are small red-glow squares; labels are sentence case, not uppercase (differs from desktop).

### 3.4 VIP panel (mobile)
- Same content as desktop: `VIP Level: VIP 0`, `Next: VIP 1`, progress bar, `0 Left To Upgrade`, `Login To View VIP Status` (gold button).
- Card is a full-width red-outlined dark card with ~16 px inner padding.

### 3.5 Popular Games (mobile)
- Header: flame icon + `Popular Games` (left), `View All →` (right). **No category tabs.**
- Horizontal carousel of tiles (~100 × 75 px), 4th tile cut off at the right edge → horizontal scroll.
- Tiles: `SLOT`, `BONZA`, `ARISTOCRAT`, `LIVE`.

### 3.6 Featured Games (mobile)
- Header: gamepad icon + `Featured Games` (left), `View All →` (right).
- Horizontal carousel, ~3 tiles visible (`MEGAH5`, `bcoongo`, `UU SLOTS`) with `FREE` badges.

### 3.7 Bottom tab bar (mobile, fixed, ~64 px, black with red top border)
Five tabs, icon over label:
1. `Home` — **active**: red filled pill behind the item.
2. `Casino`
3. `Sports`
4. `Promotion`
5. `Profile`

---

## 4. Visual system (estimated)

### 4.1 Color palette (estimated — verify with eyedropper)
| Token (proposed) | Estimate | Usage |
|---|---|---|
| `--tcl-bg` | `#0A0A0A` | page background, header |
| `--tcl-surface` | `#140606` | card fill, panels (very dark red-black) |
| `--tcl-surface-2` | `#1E0A0A` | table rows, inactive tabs |
| `--tcl-red` | `#E10F0F` (range `#D0101A`–`#E8201A`) | glowing borders, Sign Up, FREE badge |
| `--tcl-red-deep` | `#7A0000` | tile gradients, glow base |
| `--tcl-gold` | `#FFC21A` (range `#F5B800`–`#FFD040`) | accents, CTAs, active tabs, progress fill |
| `--tcl-gold-deep` | `#C98A00` | gold gradient bottom |
| `--tcl-success` | `#1F9D3A` | `SUCCESS` pill |
| `--tcl-text` | `#FFFFFF` | primary text |
| `--tcl-text-muted` | `#B8B8B8` | captions, secondary labels |
| `--tcl-live` | `#E10F0F` | LIVE pill |

### 4.2 Typography (estimated)
- **Display / hero / section titles:** heavy condensed-to-normal sans, very bold, often italic and gold-to-white gradient with dark outline. Closest free candidates to test in Step 03: *Anton*, *Bebas Neue* (condensed), *Montserrat Black* / *Barlow Condensed ExtraBold* (wide). Final choice needs a side-by-side check.
- **UI labels / nav / buttons:** bold uppercase sans (Inter / Roboto-like).
- **Body / footer copy:** regular sans, 12–14 px desktop, 13–14 px mobile.
- **Scale (desktop, approx):** hero display ~44–56 px; section titles ~18–20 px; card titles ~14–16 px; labels ~11–12 px uppercase; footer body ~12 px.

### 4.3 Spacing and layout
- Desktop: outer gutter ~24 px; body gap between columns ~16 px; panel internal padding ~14–16 px; section vertical gap ~12–14 px.
- Desktop body grid: main ≈ 2/3, rail ≈ 1/3, using a 12-col grid internally.
- Mobile: side gutter 16 px (per roadmap); card gap ~12 px.

### 4.4 Borders, glow, shadows
- Most panels: 1–2 px bright red border + outer red glow (box-shadow, blur ~12–18 px, red at ~50% opacity).
- Buttons: solid gold or solid red with inner highlight; hover/glow intensified.
- Radius: panels ~12 px, tiles ~8 px, pills fully rounded, bottom nav top corners square.
- Shadows: deep black drop shadow under panels; glow is red, not white.

### 4.5 Gradients
- Hero background: radial red/orange fire behind demon → black edges.
- Shortcut tiles: vertical red gradient (lighter top, darker bottom).
- Gold buttons: vertical gold gradient (light top → deeper bottom).
- Footer: black with subtle red glow along the top edge.

### 4.6 Image proportions (approx)
- Hero: ~3.5 : 1 desktop, ~2.4 : 1 mobile (needs a crop-specific asset, not a scaled one).
- Popular game tiles: ~1.3 : 1 (landscape).
- Featured game tiles: ~1.6 : 1 (landscape).
- Sports banner: ~2 : 1.
- Logo: roughly 3 : 1 (horizontal lockup).

---

## 5. Iconography
- Icons are line/solid mix, gold on red or red on black.
- Required icons available in Lucide (to be confirmed at Step 03): `Home`, `History`, `Gift`, `Crown`, `Settings`, `Search`, `Menu`, `Headphones`, `Flame`, `Gamepad2`, `ShieldCheck`, `Zap`, `Headset`, `ChevronLeft`, `ChevronRight`, `ArrowRight`, `Globe`, `Trophy`, `User`, `MessageCircle`, `Dices`/`Spade`.
- Brand icons (YouTube, Facebook, Telegram, Instagram, TikTok) are **not** reliable in Lucide. Use official SVGs or a separate brand-icon set.
- Casino category art (`SLOT`, `BONZA`, `ARISTOCRAT`, `LIVE`) is custom illustration, not icon font.

---

## 6. Interaction states observed or implied
- Carousel arrows (hero, popular games, featured games): circular, dark with gold ring.
- Active nav tab: red tile (desktop), red pill (mobile bottom bar).
- Active category tab: gold fill.
- Pagination dots: active gold, inactive dark gray.
- LIVE pill: red fill, white text.
- Status pills: `SUCCESS` green, `WIN` gold.
- Buttons: gold (primary secondary CTA), red (primary CTA: Sign Up), outline gold (Log In).

Motion (to be specified in Step 03/Framer Motion): hero carousel auto-advance, marquee scroll, live transaction rows updating, glow pulse on red borders (subtle), tile hover lift.

---

## 7. Assets required (inventory)

**Status key:** ✅ in reference only (low-res, must be replaced by source) · ❌ not provided · ⚠ needs licensing check

| # | Asset | Where used | Status |
|---|---|---|---|
| A1 | BetBoos365 logo (horizontal, full color, and white/mono variant) | Header, footer, mobile header | ✅ reference only — need SVG/PNG master |
| A2 | Hero banner artwork — desktop (~1920 px) | Hero | ❌ need master; text should be live HTML, not baked in |
| A3 | Hero banner artwork — mobile crop | Hero (mobile) | ❌ |
| A4 | Popular game category tiles: SLOT, BONZA, ARISTOCRAT, LIVE (4) | Popular games | ❌ |
| A5 | Featured game tiles (10 character/scene images) | Featured games | ❌ — ⚠ character art may be AI-generated; confirm rights |
| A6 | Provider logos: MEGAH5, bcoongo, UU Slots, Playtech, Pragmatic Play, PG Soft, JILI, Joker, Hacksaw Gaming, Evoplay (10) | Featured tiles | ❌ — ⚠ trademarks, need official files |
| A7 | Sports banner image (player + stadium background) | Sports banner | ❌ — ⚠ identifiable person; need licensed image |
| A8 | Payment logos: VISA, Mastercard, bKash, orange logo (unidentified), Rocket, Upay, Skrill, NETELLER, PayPal, USDT | Payment strip | ❌ — ⚠ trademarks; orange logo needs identifying |
| A9 | App store badges: Google Play, App Store | Footer | ❌ — use official badge files |
| A10 | Gambling Aware badge, 18+ badge | Footer | ❌ — use official badge files |
| A11 | UK flag (EN language) | Header | ❌ — use an SVG flag set |
| A12 | Social icons (YouTube, Facebook, Telegram, Instagram, TikTok) | Footer | ❌ — brand SVGs |
| A13 | Decorative: coins, dice, cards, chips, fire particles | Hero, backgrounds | ❌ — can be part of A2 or separate PNG/SVG |
| A14 | Icon set: see §5 | Everywhere | ✅ via Lucide (brand icons excluded) |

**Rule from roadmap:** no random placeholder imagery. Missing assets get a clearly-labelled neutral placeholder component (e.g. a dark card with the asset name), never a stock photo.

---

## 8. Assumptions (must be confirmed)
1. The mobile frame shows only the top screen; bottom sections on mobile are **not** designed in the reference.
2. Currency displayed is AUD; language is English (`EN`). Payment methods (bKash, Rocket, Upay) suggest a South Asian audience. These two facts conflict and need an owner decision.
3. The VIP progress fill (~25%) is decorative; real value comes from data later.
4. Hero headline text is live HTML (for localization and A/B tests), not image text.
5. The "Home" active state appears on both desktop nav and shortcut row. Shortcut row highlight is decorative.
6. Desktop and mobile share the same data (games, transactions, VIP status) but not the same component tree.
