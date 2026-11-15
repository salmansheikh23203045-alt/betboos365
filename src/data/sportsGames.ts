/* Homepage Sports Games tiles. Every tile opens the sports book (/sports).
 * Artwork: hand-built SVGs in public/images/sports, drawn in the same style as the Popular Games art
 * (public/images/games/popular/slot.svg). No odds, fixtures or scores are shown on the homepage. */

export interface SportTileItem {
  id: string;
  name: string;
  href: string;
  artSrc: string;
}

const ART = "/images/sports";

export const SPORTS_GAMES: SportTileItem[] = [
  { id: "cricket", name: "Cricket", href: "/sports", artSrc: `${ART}/cricket.svg` },
  { id: "football", name: "Football", href: "/sports", artSrc: `${ART}/football.svg` },
  { id: "tennis", name: "Tennis", href: "/sports", artSrc: `${ART}/tennis.svg` },
  { id: "basketball", name: "Basketball", href: "/sports", artSrc: `${ART}/basketball.svg` },
  { id: "volleyball", name: "Volleyball", href: "/sports", artSrc: `${ART}/volleyball.svg` },
  { id: "badminton", name: "Badminton", href: "/sports", artSrc: `${ART}/badminton.svg` },
];
