import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { GameGrid } from "@/components/games/GameGrid";
import { GameCard } from "@/components/games/GameCard";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LIVE_CASINO_GAMES } from "@/data/pages";

export const metadata: Metadata = { title: "Live Casino | TCL11" };

export default function LiveCasinoPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Live Casino" subtitle="Play with real dealers in real time" icon="Tv" />

      <NeonCard as="section" className="space-y-4">
        <SectionHeading title="Live Tables" icon="Tv" size="lg" />
        <GameGrid
          items={LIVE_CASINO_GAMES}
          getKey={(g) => g.id}
          ariaLabel="Live casino games"
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          renderItem={(game) => <GameCard game={game} variant="category" />}
          stagger
        />
      </NeonCard>
    </div>
  );
}
