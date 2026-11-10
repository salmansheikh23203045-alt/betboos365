"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";
import { CarouselArrow } from "@/components/ui/CarouselArrow";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { HERO_AUTOPLAY_MS, HERO_SLIDES, HERO_TRANSITION_MS } from "@/data/heroSlides";
import { WELCOME_PROMO } from "@/data/mock";

import "swiper/css";

export interface HeroCarouselProps {
  /** desktop: 3.5:1 banner in the main column. mobile: 2:1 banner with smaller type. */
  variant: "desktop" | "mobile";
}

/* Per-variant sizing. Type scales with the banner width (cqw = container-query width), so the
 * text keeps its proportions without media queries. Full class strings so Tailwind can see them. */
const VARIANT = {
  desktop: {
    aspect: "aspect-[3.5/1]",
    textWrap: "w-[56%] pl-[8cqw]",
    dots: "justify-center",
    pill: "text-[length:clamp(9px,1.25cqw,11px)]",
    title: "text-[length:clamp(2rem,5.8cqw,3.4rem)]",
    highlight: "text-[length:clamp(1.25rem,3.9cqw,2.3rem)]",
    subtitle: "text-[length:clamp(11px,1.7cqw,14px)]",
    button: "md",
    arrow: "",
    // The hidden tree resolves to the smallest candidate, so it does not download a large image.
    sizes: "(min-width: 1024px) 810px, 1px",
  },
  mobile: {
    aspect: "aspect-[7/3]",
    textWrap: "w-[62%] pl-[11cqw]",
    dots: "justify-end pr-[5cqw]",
    pill: "text-[length:9px]",
    title: "text-[length:clamp(1.5rem,8.2cqw,3rem)]",
    highlight: "text-[length:clamp(0.95rem,5.2cqw,1.9rem)]",
    subtitle: "text-[length:clamp(11px,1.8cqw,14px)]",
    button: "sm",
    arrow: "size-7! [&_svg]:size-4",
    sizes: "(min-width: 1024px) 1px, 100vw",
  },
} as const;

/** Gradient-clipped text cannot take text-shadow, so display lines use drop-shadow. */
const DISPLAY = "font-display uppercase leading-[0.95] drop-shadow-[0_2px_0_rgb(0_0_0/0.9)]";

/**
 * HeroCarousel — Welcome Bonus banner: 3 artwork slides that slide left continuously in an infinite loop,
 * one change every 5 seconds, starting as soon as the page loads (1 → 2 → 3 → 1 …).
 * Autoplay is a plain timer with NO conditions: it is not paused by hover, focus, clicks, scrolling,
 * visibility or the OS "reduce motion" setting. The only thing it waits for is a finger or mouse
 * currently dragging the banner, and it never fires while a slide is already animating.
 * Every slide change (automatic, arrow, dot or swipe) restarts the 5 s countdown, so the next
 * automatic change always comes exactly 5 s after the previous slide appeared.
 * The copy and CTA are live HTML in one static layer above the artwork, so they never duplicate or move.
 * The container has a fixed aspect ratio, so slide changes never shift the layout.
 */
export function HeroCarousel({ variant }: HeroCarouselProps) {
  const v = VARIANT[variant];
  const swiperRef = useRef<SwiperType | null>(null);
  const lastChangeRef = useRef(0); // timestamp of the most recent slide change
  const draggingRef = useRef(false); // true while a finger / mouse is dragging the banner
  const [active, setActive] = useState(0);

  useEffect(() => {
    lastChangeRef.current = Date.now();
    let timer: number;

    const tick = () => {
      const swiper = swiperRef.current;
      const elapsed = Date.now() - lastChangeRef.current;
      if (swiper && !swiper.destroyed && !draggingRef.current && !swiper.animating && elapsed >= HERO_AUTOPLAY_MS - 20) {
        lastChangeRef.current = Date.now();
        swiper.slideNext(HERO_TRANSITION_MS);
      }
      // Sleep exactly until the next change is due (never less than 50 ms, so a blocked tick cannot spin).
      const remaining = HERO_AUTOPLAY_MS - (Date.now() - lastChangeRef.current);
      timer = window.setTimeout(tick, Math.max(remaining, 50));
    };

    timer = window.setTimeout(tick, HERO_AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const goTo = useCallback((index: number) => swiperRef.current?.slideToLoop(index), []);

  return (
    <NeonCard
      as="section"
      padding="none"
      aria-roledescription="carousel"
      aria-label="Welcome bonus promotions"
      className={cn("@container relative isolate overflow-hidden", v.aspect)}
    >
      <Swiper
        loop
        speed={HERO_TRANSITION_MS}
        grabCursor
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          lastChangeRef.current = Date.now();
          setActive(swiper.realIndex);
        }}
        onTouchStart={() => {
          draggingRef.current = true;
        }}
        onTouchEnd={() => {
          draggingRef.current = false;
          lastChangeRef.current = Date.now();
        }}
        className="absolute inset-0 size-full"
      >
        {HERO_SLIDES.map((slide, index) => (
          <SwiperSlide
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${HERO_SLIDES.length}`}
            className="relative"
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes={v.sizes}
              className="object-cover"
              style={{ objectPosition: slide.objectPosition[variant] }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Left scrim keeps the copy readable over any artwork crop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[75%] bg-gradient-to-r from-tcl-black/80 via-tcl-black/45 to-transparent"
      />

      {/* Static copy layer: same text on every slide, so it never moves during a transition. */}
      <div className={cn("pointer-events-none absolute inset-y-0 left-0 z-20 flex flex-col justify-center gap-[clamp(3px,1cqw,8px)]", v.textWrap)}>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-pill border border-tcl-gold bg-tcl-black/60 px-3 py-1 font-bold uppercase tracking-wider text-tcl-gold",
            v.pill,
          )}
        >
          <ICONS.Crown aria-hidden="true" className="size-3.5" />
          {WELCOME_PROMO.eyebrow}
        </span>
        <p className={cn(DISPLAY, "text-gold-gradient", v.title)}>{WELCOME_PROMO.title}</p>
        <p className={cn(DISPLAY, "text-tcl-white", v.highlight)}>{WELCOME_PROMO.highlight}</p>
        <p className={cn("font-semibold text-tcl-white", v.subtitle)}>{WELCOME_PROMO.subtitle}</p>
        <div className="pointer-events-auto pt-[clamp(2px,0.6cqw,6px)]">
          <SecondaryButton href={WELCOME_PROMO.ctaHref} size={v.button} arrow>
            {WELCOME_PROMO.ctaLabel}
          </SecondaryButton>
        </div>
      </div>

      <CarouselArrow
        direction="prev"
        onClick={() => swiperRef.current?.slidePrev()}
        className={cn("absolute left-[1.5cqw] top-1/2 z-30 -translate-y-1/2", v.arrow)}
      />
      <CarouselArrow
        direction="next"
        onClick={() => swiperRef.current?.slideNext()}
        className={cn("absolute right-[1.5cqw] top-1/2 z-30 -translate-y-1/2", v.arrow)}
      />

      <div className={cn("absolute inset-x-0 bottom-1 z-30 flex", v.dots)}>
        <div role="group" aria-label="Choose slide" className="flex items-center">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => goTo(index)}
              className="group flex h-6 min-w-6 cursor-pointer items-center justify-center px-1"
            >
              <span
                className={cn(
                  "h-2 rounded-pill transition-[width,background-color] duration-300",
                  "shadow-[0_0_0_1px_rgb(0_0_0/0.45)]",
                  index === active ? "w-5 bg-gold-gradient" : "w-2 bg-tcl-white/55 group-hover:bg-tcl-white/80",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </NeonCard>
  );
}
