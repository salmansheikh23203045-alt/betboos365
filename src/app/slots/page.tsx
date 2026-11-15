import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { GameGrid } from "@/components/games/GameGrid";
import { GameCard } from "@/components/games/GameCard";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SLOT_GAMES } from "@/data/pages";

export const metadata: Metadata = { title: "Slots | BetBoos365" };

export default function SlotsPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Slots" subtitle="Spin the reels on hundreds of slot games" icon="Gift" />

      <NeonCard as="section" className="space-y-4">
        <SectionHeading title="Popular Slots" icon="Flame" size="lg" />
        <GameGrid
          items={SLOT_GAMES}
          getKey={(g) => g.id}
          ariaLabel="Slot games"
          columns="grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3"
          renderItem={(game) => <GameCard game={game} variant="featured" />}
          stagger
        />
      </NeonCard>
    </div>
  );
}
