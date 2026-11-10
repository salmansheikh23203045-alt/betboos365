"use client";

import { SPORTS_PROMO, TRANSACTIONS, VIP_STATUS } from "@/data/mock";
import { MOBILE_FEATURED_GAMES, MOBILE_POPULAR_GAMES } from "@/data/mobileHome";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { LiveTransactionTable } from "@/components/transactions/LiveTransactionTable";
import { WhyChooseGrid } from "@/components/home/WhyChooseGrid";
import { ShortcutGrid, SHORTCUTS } from "@/components/home/ShortcutGrid";
import { MobileVipCard } from "@/components/home/mobile/MobileVipCard";
import { MobilePopularGames } from "@/components/home/mobile/MobilePopularGames";
import { MobileFeaturedGames } from "@/components/home/mobile/MobileFeaturedGames";
import { MobileSportsBanner } from "@/components/home/mobile/MobileSportsBanner";

/**
 * HomeMobile — mobile homepage body (below lg).
 * Order follows the mobile reference: welcome banner, shortcuts, VIP, popular games (4 across, arrows),
 * featured games (3 across). Game sections, VIP and the sports banner use mobile-only components in
 * home/mobile/, so the desktop homepage is not affected by mobile changes.
 * Sections below Featured Games are NOT in the mobile reference. They are inferred from the desktop
 * rail and marked here so they can be replaced once the mobile design exists (open question).
 */
export function HomeMobile() {
  return (
    <div className="space-y-3 px-4 py-3 lg:hidden">
      <HeroCarousel variant="mobile" />

      <ShortcutGrid items={SHORTCUTS} variant="mobile" />

      <MobileVipCard status={VIP_STATUS} />

      <MobilePopularGames games={MOBILE_POPULAR_GAMES} />

      <MobileFeaturedGames games={MOBILE_FEATURED_GAMES} />

      {/* INFERRED — not in the mobile reference. Replace when the mobile design is supplied. */}
      <LiveTransactionTable transactions={TRANSACTIONS} />
      <MobileSportsBanner promo={SPORTS_PROMO} />
      <WhyChooseGrid />
    </div>
  );
}
