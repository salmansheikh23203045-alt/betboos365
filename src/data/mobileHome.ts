/* Mobile homepage tiles (Step 04). Desktop keeps using POPULAR_GAMES / FEATURED_GAMES unchanged.
 * Artwork: WebP crops of the user-supplied hero banners (public/images/banners) plus one hand-built SVG
 * (slot machine). They stand in until licensed game artwork arrives. Provider names render as text,
 * not as copies of the providers' logos. */

import { FEATURED_GAMES } from "@/data/mock";
import type { Game } from "@/types";

export interface MobileGameTile extends Game {
  artSrc: string;
  /** Glow colour behind the provider name on Featured tiles. */
  accent?: string;
}

const POPULAR = "/images/games/popular";
const FEATURED = "/images/games/featured";

export const MOBILE_POPULAR_GAMES: MobileGameTile[] = [
  { id: "mp-slot", title: "SLOT", provider: "TCL11", category: "slots", isFree: false, artSrc: `${POPULAR}/slot.svg` },
  { id: "mp-bonza", title: "BONZA", provider: "TCL11", category: "slots", isFree: false, artSrc: `${POPULAR}/bonza.webp` },
  { id: "mp-aristocrat", title: "ARISTOCRAT", provider: "TCL11", category: "slots", isFree: false, artSrc: `${POPULAR}/aristocrat.webp` },
  { id: "mp-live", title: "LIVE", provider: "TCL11", category: "live-casino", isFree: false, artSrc: `${POPULAR}/live.webp` },
  { id: "mp-poker", title: "POKER", provider: "TCL11", category: "table", isFree: false, artSrc: `${POPULAR}/poker.webp` },
  { id: "mp-baccarat", title: "BACCARAT", provider: "TCL11", category: "table", isFree: false, artSrc: `${POPULAR}/baccarat.webp` },
  { id: "mp-roulette", title: "ROULETTE", provider: "TCL11", category: "table", isFree: false, artSrc: `${POPULAR}/roulette.webp` },
  { id: "mp-lucky-wheel", title: "LUCKY WHEEL", provider: "TCL11", category: "arcade", isFree: false, artSrc: `${POPULAR}/lucky-wheel.webp` },
  { id: "mp-jackpot", title: "JACKPOT", provider: "TCL11", category: "slots", isFree: false, artSrc: `${POPULAR}/jackpot.webp` },
  { id: "mp-blackjack", title: "BLACKJACK", provider: "TCL11", category: "table", isFree: false, artSrc: `${POPULAR}/blackjack.webp` },
  { id: "mp-sicbo", title: "SIC BO", provider: "TCL11", category: "table", isFree: false, artSrc: `${POPULAR}/sicbo.webp` },
];

/* 3 × 3 grid on mobile. Names shortened where the full provider name cannot fit a ~105px tile. */
const FEATURED_ART: Record<string, { file: string; accent: string; title?: string }> = {
  "f-megah5": { file: "megah5", accent: "#38bdf8" },
  "f-bcoongo": { file: "bcoongo", accent: "#4ade80", title: "BCOONGO" },
  "f-uu": { file: "uu-slots", accent: "#a78bfa" },
  "f-playtech": { file: "playtech", accent: "#f8fafc" },
  "f-pragmatic": { file: "pragmatic", accent: "#fb923c", title: "PRAGMATIC" },
  "f-pg": { file: "pg-soft", accent: "#e5e7eb", title: "PG SOFT" },
  "f-jili": { file: "jili", accent: "#facc15" },
  "f-joker": { file: "joker", accent: "#c084fc" },
  "f-hacksaw": { file: "hacksaw", accent: "#f1f5f9", title: "HACKSAW" },
};

export const MOBILE_FEATURED_GAMES: MobileGameTile[] = FEATURED_GAMES.flatMap((game) => {
  const art = FEATURED_ART[game.id];
  return art
    ? [{ ...game, title: art.title ?? game.title, artSrc: `${FEATURED}/${art.file}.webp`, accent: art.accent }]
    : [];
});
