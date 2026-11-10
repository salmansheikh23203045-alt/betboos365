"use client";

import { useCallback, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { MobileGameTile } from "@/data/mobileHome";
import { MobileSectionHeading } from "./MobileSectionHeading";
import { PopularTile } from "./MobileGameTiles";

import "swiper/css";

const ARROW =
  "absolute top-1/2 z-20 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill " +
  "border border-tcl-white/35 bg-tcl-black/85 text-tcl-white shadow-[0_0_8px_rgb(0_0_0/0.8)] " +
  "transition-[opacity,transform] active:scale-90 disabled:cursor-default disabled:opacity-35 " +
  // 44px hit area around the 28px button.
  "before:absolute before:-inset-2 before:content-['']";

/**
 * Popular Games (mobile): 4 tiles in view, swipe or use the arrows to move one tile at a time.
 * Slide widths are plain CSS (no Swiper spaceBetween), so the row is laid out correctly before
 * hydration and does not shift when Swiper starts. Arrows dim at either end of the row.
 */
export function MobilePopularGames({ games }: { games: MobileGameTile[] }) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [edges, setEdges] = useState({ start: true, end: games.length <= 4 });

  const sync = useCallback((swiper: SwiperType) => {
    setEdges((prev) =>
      prev.start === swiper.isBeginning && prev.end === swiper.isEnd ? prev : { start: swiper.isBeginning, end: swiper.isEnd },
    );
  }, []);

  return (
    <NeonCard as="section" aria-label="Popular games" padding="sm" className="space-y-3">
      <MobileSectionHeading
        title="Popular Games"
        icon="Flame"
        iconClassName="fill-[#ff6a1a] text-[#ffb020]"
        viewAllHref="/casino"
      />
      <div className="relative" role="region" aria-roledescription="carousel" aria-label="Popular games">
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
          {games.map((game) => (
            <SwiperSlide
              key={game.id}
              className="w-[calc((100%-24px)/4+8px)]! pl-2 first:w-[calc((100%-24px)/4)]! first:pl-0"
            >
              <PopularTile game={game} />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          aria-label="Previous games"
          disabled={edges.start}
          onClick={() => swiperRef.current?.slidePrev()}
          className={cn(ARROW, "-left-3.5")}
        >
          <ICONS.ChevronLeft aria-hidden="true" className="size-4" strokeWidth={2.6} />
        </button>
        <button
          type="button"
          aria-label="Next games"
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
