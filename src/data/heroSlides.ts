import type { HeroSlide } from "@/types";

/* Welcome Bonus hero slides and sports promotional banners. */
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "hero-football",
    src: "/images/banners/banner-04.png",
    alt: "Football Betting promotion banner with players and stadium",
    objectPosition: { desktop: "center center", mobile: "center center" },
    hideOverlay: true,
  },
  {
    id: "hero-cricket",
    src: "/images/banners/banner-05.png",
    alt: "Cricket Betting promotion banner with players, trophy and equipment",
    objectPosition: { desktop: "center center", mobile: "center center" },
    hideOverlay: true,
  },
  {
    id: "hero-1",
    src: "/images/banners/banner-01.png",
    alt: "Casino host beside a golden roulette wheel, playing cards, dice and red casino chips",
    objectPosition: { desktop: "center 18%", mobile: "90% 15%" },
  },
  {
    id: "hero-2",
    src: "/images/banners/banner-02.png",
    alt: "Gentleman in a tuxedo seated in a red armchair with a roulette wheel, aces and a crown casino chip",
    objectPosition: { desktop: "center 15%", mobile: "94% 15%" },
  },
  {
    id: "hero-3",
    src: "/images/banners/banner-03.png",
    alt: "Casino host at a gold-rimmed table with a crowned golden wheel, playing cards, dice and chips",
    objectPosition: { desktop: "center 15%", mobile: "92% 12%" },
  },
];

/** Milliseconds from the start of one slide change to the start of the next (the full cycle). */
export const HERO_AUTOPLAY_MS = 5000;

/** Duration of the slide animation itself. The hold time is HERO_AUTOPLAY_MS - HERO_TRANSITION_MS. */
export const HERO_TRANSITION_MS = 800;
