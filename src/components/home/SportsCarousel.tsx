"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType, SwiperOptions } from "swiper/types";
import { GameCarousel } from "@/components/games/GameCarousel";
import { MobileSectionHeading } from "@/components/home/mobile/MobileSectionHeading";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SPORTS_GAMES, type SportTileItem } from "@/data/sportsGames";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";

import "swiper/css";

/*
 * Sports Games uses the Popular Games design system on purpose. Panels, headings, carousels and arrows
 * are the same components. The tiles copy the Popular Games tile classes one-for-one. Sports cannot
 * reuse <GameCard> / <PopularTile> directly because those take a casino `Game`.
 *   desktop tile = components/games/GameCard.tsx (variant "category")
 *   mobile tile  = components/home/mobile/MobileGameTiles.tsx (PopularTile)
 *   mobile row   = components/home/mobile/MobilePopularGames.tsx
 * If those change, change the copies below with them.
 */

/* Keyboard focus: the project's 2px gold ring (ui/button-styles.ts), drawn as a top layer inside the tile.
 * A plain outline on the link would be painted under the positioned tile or clipped by Swiper's overflow:hidden. */
const LINK = "group/sport block outline-hidden";

function FocusRing() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 ring-2 ring-inset ring-tcl-gold group-focus-visible/sport:opacity-100"
    />
  );
}

/* Desktop: the section lives in the 1/3 right rail, which is half the width of the Popular Games column.
 * Two tiles per view at Popular's 14px gap keeps each tile within a few px of a Popular Games tile. */
const RAIL_BREAKPOINTS: SwiperOptions["breakpoints"] = {
  0: { slidesPerView: 2, spaceBetween: 14 },
};

/** Same markup as GameCard variant="category", wrapped in a link to the sports book. */
function SportTileDesktop({ sport }: { sport: SportTileItem }) {
  return (
    <Link href={sport.href} prefetch={false} className={LINK}>
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-tile neon-border-red bg-card-dark",
          "hover-glow-red hover-sheen aspect-[1.35/1]",
        )}
      >
        <Image
          src={sport.artSrc}
          alt=""
          fill
          sizes="(min-width: 1024px) 180px, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-tcl-black/90 to-transparent px-2 pb-1.5 pt-6">
          <p className="truncate text-center font-display text-lg uppercase leading-none tracking-wide text-tcl-white text-outline-dark max-lg:text-[11px]">
            {sport.name}
          </p>
        </div>
        <FocusRing />
      </div>
    </Link>
  );
}

/** Same markup as PopularTile, wrapped in a link to the sports book. */
function SportTileMobile({ sport }: { sport: SportTileItem }) {
  return (
    <Link href={sport.href} prefetch={false} className={LINK}>
      <div className="tile-neon group relative aspect-[0.92/1] overflow-hidden rounded-[9px]">
        <Image
          src={sport.artSrc}
          alt=""
          fill
          sizes="(min-width: 1024px) 1px, 22vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-tcl-black/90 via-tcl-black/50 to-transparent px-1 pb-1 pt-4">
          <p className="truncate text-center font-display text-[length:clamp(10px,3vw,13px)] uppercase leading-none tracking-wide text-tcl-white text-outline-dark">
            {sport.name}
          </p>
        </div>
        <FocusRing />
      </div>
    </Link>
  );
}

function SportsGamesDesktop() {
  return (
    <NeonCard as="section" aria-label="Sports games" className="space-y-3">
      <SectionHeading title="Sports Games" icon="Trophy" viewAllHref="/sports" />
      <GameCarousel
        items={SPORTS_GAMES}
        getKey={(sport) => sport.id}
        ariaLabel="Sports games"
        arrows
        breakpoints={RAIL_BREAKPOINTS}
        renderItem={(sport) => <SportTileDesktop sport={sport} />}
      />
    </NeonCard>
  );
}

/* Same arrow as the mobile Popular Games row. */
const ARROW =
  "absolute top-1/2 z-20 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill " +
  "border border-tcl-white/35 bg-tcl-black/85 text-tcl-white shadow-[0_0_8px_rgb(0_0_0/0.8)] " +
  "transition-[opacity,transform] active:scale-90 disabled:cursor-default disabled:opacity-35 " +
  // 44px hit area around the 28px button.
  "before:absolute before:-inset-2 before:content-['']";

/** Mobile/tablet: 4 tiles in view, swipe or use the arrows to move one tile at a time (as Popular Games). */
function SportsGamesMobile() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [edges, setEdges] = useState({ start: true, end: SPORTS_GAMES.length <= 4 });

  const sync = useCallback((swiper: SwiperType) => {
    setEdges((prev) =>
      prev.start === swiper.isBeginning && prev.end === swiper.isEnd ? prev : { start: swiper.isBeginning, end: swiper.isEnd },
    );
  }, []);

  return (
    <NeonCard as="section" aria-label="Sports games" padding="sm" className="space-y-3">
      <MobileSectionHeading
        title="Sports Games"
        icon="Trophy"
        iconClassName="fill-[#ff6a1a] text-[#ffb020]"
        viewAllHref="/sports"
      />
      <div className="relative" role="region" aria-roledescription="carousel" aria-label="Sports games">
        <Swiper
          slidesPerView="auto"
          speed={420}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            sync(swiper);
          }}
          onSlideChange={sync}
          onProgress={sync}
          onResize={sync}
          className="-my-2 py-2!"
        >
          {SPORTS_GAMES.map((sport) => (
            <SwiperSlide
              key={sport.id}
              className="w-[calc((100%-24px)/4+8px)]! pl-2 first:w-[calc((100%-24px)/4)]! first:pl-0"
            >
              <SportTileMobile sport={sport} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          aria-label="Previous sports"
          disabled={edges.start}
          onClick={() => swiperRef.current?.slidePrev()}
          className={cn(ARROW, "-left-3.5")}
        >
          <ICONS.ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.6} />
        </button>
        <button
          type="button"
          aria-label="Next sports"
          disabled={edges.end}
          onClick={() => swiperRef.current?.slideNext()}
          className={cn(ARROW, "-right-3.5")}
        >
          <ICONS.ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.6} />
        </button>
      </div>
    </NeonCard>
  );
}

/**
 * SportsCarousel — homepage Sports Games row: Cricket, Football, Tennis, Basketball, Volleyball,
 * Badminton in a single horizontal row (never wraps). "desktop" renders in the HomeDesktop right
 * rail and "mobile" renders in HomeMobile, each matching that tree's Popular Games section.
 */
export function SportsCarousel({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  return variant === "mobile" ? <SportsGamesMobile /> : <SportsGamesDesktop />;
}
