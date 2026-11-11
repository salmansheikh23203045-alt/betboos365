// Centralised game-art resolver. ONE source of truth for every device. The
// mobile and desktop trees import from here so the same game shows the same
// artwork at every viewport. When a game has no explicit mapping the caller
// renders the BrandedTile fallback (procedurally generated SVG in brand
// colours — not a placeholder) so no card is ever empty.

const POPULAR_DIR = "/images/games/popular";
const FEATURED_DIR = "/images/games/featured";

// Keyed by game id. Covers every id used in mock.ts, mobileHome.ts and pages.ts.
const GAME_ART: Record<string, string> = {
  // --- POPULAR_GAMES / MOBILE_POPULAR_GAMES ---
  "p-slot": `${POPULAR_DIR}/slot.svg`,
  "p-bonza": `${POPULAR_DIR}/bonza.webp`,
  "p-aristocrat": `${POPULAR_DIR}/aristocrat.webp`,
  "p-live": `${POPULAR_DIR}/live.webp`,
  "mp-slot": `${POPULAR_DIR}/slot.svg`,
  "mp-bonza": `${POPULAR_DIR}/bonza.webp`,
  "mp-aristocrat": `${POPULAR_DIR}/aristocrat.webp`,
  "mp-live": `${POPULAR_DIR}/live.webp`,
  "mp-poker": `${POPULAR_DIR}/poker.webp`,
  "mp-baccarat": `${POPULAR_DIR}/baccarat.webp`,
  "mp-roulette": `${POPULAR_DIR}/roulette.webp`,
  "mp-lucky-wheel": `${POPULAR_DIR}/lucky-wheel.webp`,
  "mp-jackpot": `${POPULAR_DIR}/jackpot.webp`,
  "mp-blackjack": `${POPULAR_DIR}/blackjack.webp`,
  "mp-sicbo": `${POPULAR_DIR}/sicbo.webp`,

  // --- FEATURED_GAMES / MOBILE_FEATURED_GAMES (provider tiles) ---
  "f-megah5": `${FEATURED_DIR}/megah5.webp`,
  "f-bcoongo": `${FEATURED_DIR}/bcoongo.webp`,
  "f-uu": `${FEATURED_DIR}/uu-slots.webp`,
  "f-playtech": `${FEATURED_DIR}/playtech.webp`,
  "f-pragmatic": `${FEATURED_DIR}/pragmatic.webp`,
  "f-pg": `${FEATURED_DIR}/pg-soft.webp`,
  "f-jili": `${FEATURED_DIR}/jili.webp`,
  "f-joker": `${FEATURED_DIR}/joker.webp`,
  "f-hacksaw": `${FEATURED_DIR}/hacksaw.webp`,
  "f-evoplay": `${FEATURED_DIR}/pragmatic.webp`, // visual stand-in

  // --- CASINO_GAMES (pages.ts) — reuse closest tile per theme ---
  "c-blackjack": `${POPULAR_DIR}/blackjack.webp`,
  "c-roulette": `${POPULAR_DIR}/roulette.webp`,
  "c-baccarat": `${POPULAR_DIR}/baccarat.webp`,
  "c-poker": `${POPULAR_DIR}/poker.webp`,
  "c-sicbo": `${POPULAR_DIR}/sicbo.webp`,
  "c-wheel": `${POPULAR_DIR}/lucky-wheel.webp`,
  "c-jackpot": `${POPULAR_DIR}/jackpot.webp`,
  "c-slot": `${POPULAR_DIR}/slot.svg`,
  "c-bonza": `${POPULAR_DIR}/bonza.webp`,
  "c-aristocrat": `${POPULAR_DIR}/aristocrat.webp`,
  "c-live": `${POPULAR_DIR}/live.webp`,

  // --- SLOT_GAMES (pages.ts) — reuse by provider feel ---
  "s-fortune": `${FEATURED_DIR}/jili.webp`,
  "s-buffalo": `${FEATURED_DIR}/pragmatic.webp`,
  "s-gates": `${FEATURED_DIR}/pragmatic.webp`,
  "s-starlight": `${FEATURED_DIR}/pragmatic.webp`,
  "s-sweet": `${FEATURED_DIR}/pragmatic.webp`,
  "s-wolf": `${FEATURED_DIR}/pragmatic.webp`,
  "s-wild": `${FEATURED_DIR}/pragmatic.webp`,
  "s-aztec": `${FEATURED_DIR}/pragmatic.webp`,
  "s-golden": `${FEATURED_DIR}/jili.webp`,
  "s-mega": `${FEATURED_DIR}/megah5.webp`,
  "s-pharaoh": `${FEATURED_DIR}/playtech.webp`,
  "s-book": `${FEATURED_DIR}/hacksaw.webp`,
  "s-fire88": `${FEATURED_DIR}/pragmatic.webp`,
  "s-lucky7": `${FEATURED_DIR}/jili.webp`,
  "s-boxing": `${FEATURED_DIR}/jili.webp`,

  // --- LIVE_CASINO_GAMES ---
  "lc-bac": `${POPULAR_DIR}/baccarat.webp`,
  "lc-roul": `${POPULAR_DIR}/roulette.webp`,
  "lc-bj": `${POPULAR_DIR}/blackjack.webp`,
  "lc-crazy": `${POPULAR_DIR}/live.webp`,
  "lc-mono": `${POPULAR_DIR}/live.webp`,
  "lc-dream": `${POPULAR_DIR}/lucky-wheel.webp`,
  "lc-deal": `${POPULAR_DIR}/live.webp`,
  "lc-sic": `${POPULAR_DIR}/sicbo.webp`,
  "lc-teen": `${POPULAR_DIR}/poker.webp`,
  "lc-speed": `${POPULAR_DIR}/baccarat.webp`,
  "lc-light": `${POPULAR_DIR}/roulette.webp`,
  "lc-dragon": `${POPULAR_DIR}/live.webp`,

  // Esports has no themed stock yet — the BrandedTile handles it below.
};

/** Returns a public image path if we have specific art for this game, or null. */
export function resolveGameArt(gameId: string): string | null {
  return GAME_ART[gameId] ?? null;
}

/**
 * Produce a stable brand tint for a game id from its hash. This is what
 * drives BrandedTile when no image artwork exists — different games get
 * different gold/red hues so the tiles don't all look identical.
 */
export function gameAccent(gameId: string): { hue: number; from: string; to: string } {
  let h = 0;
  for (let i = 0; i < gameId.length; i++) h = (h * 31 + gameId.charCodeAt(i)) >>> 0;
  const hue = h % 60; // 0..60 = red → gold range
  const from = `hsl(${hue}, 85%, 55%)`;
  const to = `hsl(${(hue + 25) % 360}, 85%, 32%)`;
  return { hue, from, to };
}
