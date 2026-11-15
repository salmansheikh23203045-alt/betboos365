import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { GameGrid } from "@/components/games/GameGrid";
import { GameCard } from "@/components/games/GameCard";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ESPORTS_GAMES } from "@/data/pages";

export const metadata: Metadata = { title: "Esports | BetBoos365" };

export default function EsportsPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Esports" subtitle="Bet on competitive gaming tournaments worldwide" icon="Gamepad2" />

      <NeonCard as="section" className="space-y-4">
        <SectionHeading title="Esports Titles" icon="Gamepad2" size="lg" />
        <GameGrid
          items={ESPORTS_GAMES}
          getKey={(g) => g.id}
          ariaLabel="Esports games"
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          renderItem={(game) => <GameCard game={game} variant="category" />}
          stagger
        />
      </NeonCard>
    </div>
  );
}
