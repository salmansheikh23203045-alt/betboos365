"use client";

import { SPORTS_PROMO, TRANSACTIONS } from "@/data/mock";
import { MOBILE_FEATURED_GAMES, MOBILE_POPULAR_GAMES } from "@/data/mobileHome";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { LiveTransactionTable } from "@/components/transactions/LiveTransactionTable";
import { WhyChooseGrid } from "@/components/home/WhyChooseGrid";
import { ShortcutGrid, SHORTCUTS } from "@/components/home/ShortcutGrid";
import { SportsCarousel } from "@/components/home/SportsCarousel";
import { MobilePopularGames } from "@/components/home/mobile/MobilePopularGames";
import { MobileFeaturedGames } from "@/components/home/mobile/MobileFeaturedGames";
import { MobileSportsBanner } from "@/components/home/mobile/MobileSportsBanner";

/**
 * HomeMobile — mobile homepage body (below lg).
 * Order: welcome banner, shortcuts, Sports Carousel, popular games, featured games, etc.
 */
export function HomeMobile() {
  return (
    <div className="space-y-3 px-4 py-3 lg:hidden">
      <HeroCarousel variant="mobile" />

      <ShortcutGrid items={SHORTCUTS} variant="mobile" />

      <SportsCarousel variant="mobile" />

      <MobilePopularGames games={MOBILE_POPULAR_GAMES} />

      <MobileFeaturedGames games={MOBILE_FEATURED_GAMES} />

      <LiveTransactionTable transactions={TRANSACTIONS} />
      <MobileSportsBanner promo={SPORTS_PROMO} />
      <WhyChooseGrid />
    </div>
  );
}
