"use client";

import { FEATURED_GAMES, POPULAR_GAMES, SPORTS_PROMO, TRANSACTIONS, VIP_STATUS } from "@/data/mock";
import { GameCard } from "@/components/games/GameCard";
import { GameCarousel } from "@/components/games/GameCarousel";
import { GameGrid } from "@/components/games/GameGrid";
import { CategoryTabs } from "@/components/games/CategoryTabs";
import { PromotionBanner } from "@/components/promo/PromotionBanner";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { VIPProgressCard } from "@/components/vip/VIPProgressCard";
import { LiveTransactionTable } from "@/components/transactions/LiveTransactionTable";
import { WhyChooseGrid } from "@/components/home/WhyChooseGrid";
import { ShortcutGrid, SHORTCUTS } from "@/components/home/ShortcutGrid";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * HomeDesktop — desktop homepage body (lg and up).
 * Two columns as in the reference: main (2/3) and right rail (1/3).
 * Main: welcome banner, shortcuts, popular games, featured games.
 * Rail: VIP panel, live transactions, sports banner, why choose.
 */
export function HomeDesktop() {
  return (
    <div className="mx-auto hidden max-w-[1280px] gap-4 px-6 py-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <HeroCarousel variant="desktop" />

        <ShortcutGrid items={SHORTCUTS} variant="desktop" />

        <NeonCard as="section" aria-label="Popular games" className="space-y-3">
          <SectionHeading title="Popular Games" icon="Flame" viewAllHref="/casino" />
          <CategoryTabs />
          <GameCarousel
            items={POPULAR_GAMES}
            getKey={(g) => g.id}
            ariaLabel="Popular games"
            arrows
            renderItem={(game) => <GameCard game={game} variant="category" />}
          />
        </NeonCard>

        <NeonCard as="section" aria-label="Featured games" className="space-y-3">
          <SectionHeading title="Featured Games" icon="Gamepad2" viewAllHref="/casino" />
          <GameGrid
            items={FEATURED_GAMES}
            getKey={(g) => g.id}
            ariaLabel="Featured games"
            columns="grid-cols-5 gap-2.5"
            renderItem={(game) => <GameCard game={game} variant="featured" />}
          />
        </NeonCard>
      </div>

      <aside className="min-w-0 space-y-4">
        <VIPProgressCard status={VIP_STATUS} />
        <LiveTransactionTable transactions={TRANSACTIONS} />
        <PromotionBanner promo={SPORTS_PROMO} variant="compact" tone="gold-gold" artLabel="Sports betting artwork" />
        <WhyChooseGrid />
      </aside>
    </div>
  );
}
