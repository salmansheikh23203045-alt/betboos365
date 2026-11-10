"use client";

import { useRef, type ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType, SwiperOptions } from "swiper/types";
import { CarouselArrow } from "@/components/ui/CarouselArrow";
import { cn } from "@/lib/cn";

import "swiper/css";
import "swiper/css/navigation";

export interface GameCarouselProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Accessible name for the carousel region. */
  ariaLabel: string;
  /** Show prev/next arrows on every breakpoint (reference: desktop and mobile Popular Games). */
  arrows?: boolean;
  /** Swiper breakpoints. Default: 2.5 slides on phones so the next tile peeks. */
  breakpoints?: SwiperOptions["breakpoints"];
  className?: string;
}

/* Mobile shows ~3.3 tiles so the next one peeks (reference: 4th popular tile is cut off).
 * Desktop shows 4 tiles beside the gold arrows (reference: Popular Games). Tiles size to the slide. */
const DEFAULT_BREAKPOINTS: SwiperOptions["breakpoints"] = {
  0: { slidesPerView: 3.3, spaceBetween: 10 },
  1024: { slidesPerView: 4, spaceBetween: 14 },
};

/**
 * GameCarousel — Swiper horizontal scroller with optional gold arrows.
 * Used for Popular Games (desktop + mobile) and Featured Games (mobile).
 * Free-drag, snap-to-slide, and no scrollbar.
 */
export function GameCarousel<T>({
  items,
  getKey,
  renderItem,
  ariaLabel,
  arrows = false,
  breakpoints = DEFAULT_BREAKPOINTS,
  className,
}: GameCarouselProps<T>) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={cn("relative", className)} role="region" aria-label={ariaLabel}>
      {arrows ? (
        <>
          <CarouselArrow
            direction="prev"
            ref={prevRef}
            className="absolute left-1 top-1/2 z-20 -translate-y-1/2"
          />
          <CarouselArrow
            direction="next"
            ref={nextRef}
            className="absolute right-1 top-1/2 z-20 -translate-y-1/2"
          />
        </>
      ) : null}

      <Swiper
        modules={[Navigation]}
        navigation={arrows ? { prevEl: prevRef.current, nextEl: nextRef.current } : false}
        breakpoints={breakpoints}
        className="no-scrollbar py-2 -my-2"
        onBeforeInit={(swiper: SwiperType) => {
          // Refs are not set on first render, so bind the arrow elements before Swiper initialises.
          const nav = swiper.params.navigation;
          if (arrows && nav && typeof nav === "object") {
            nav.prevEl = prevRef.current;
            nav.nextEl = nextRef.current;
          }
        }}
      >
        {items.map((item) => (
          <SwiperSlide key={getKey(item)} className="!h-auto">
            {/* Slide width comes from breakpoints; the card fills it. */}
            {renderItem(item)}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
