import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { GameGrid } from "@/components/games/GameGrid";
import { GameCard } from "@/components/games/GameCard";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CASINO_GAMES, SLOT_GAMES, LIVE_CASINO_GAMES } from "@/data/pages";
import { POPULAR_GAMES, FEATURED_GAMES } from "@/data/mock";

export const metadata: Metadata = { title: "Casino | BetBoos365" };

const ALL_GAMES = [...POPULAR_GAMES, ...FEATURED_GAMES, ...CASINO_GAMES, ...SLOT_GAMES, ...LIVE_CASINO_GAMES];
const uniqueGames = ALL_GAMES.filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i);

export default function CasinoPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Casino" subtitle="Play the best casino games from top providers" icon="Dices" />

      <NeonCard as="section" className="space-y-4">
        <SectionHeading title="All Games" icon="Flame" size="lg" />
        <GameGrid
          items={uniqueGames.slice(0, 20)}
          getKey={(g) => g.id}
          ariaLabel="Casino games"
          columns="grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3"
          renderItem={(game) => <GameCard game={game} variant="featured" />}
          stagger
        />
      </NeonCard>

      <NeonCard as="section" className="space-y-4">
        <SectionHeading title="Table Games" icon="Layers" size="lg" />
        <GameGrid
          items={CASINO_GAMES}
          getKey={(g) => g.id}
          ariaLabel="Table games"
          columns="grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3"
          renderItem={(game) => <GameCard game={game} variant="featured" />}
          stagger
        />
      </NeonCard>
    </div>
  );
}
