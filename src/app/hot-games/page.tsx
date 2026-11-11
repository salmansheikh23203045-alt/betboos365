import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { GameGrid } from "@/components/games/GameGrid";
import { GameCard } from "@/components/games/GameCard";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { POPULAR_GAMES } from "@/data/mock";
import { BN } from "@/i18n/bn";

export const metadata: Metadata = { title: `${BN.nav.hotGames} | TCL11` };

export default function HotGamesPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner
        title={BN.nav.hotGames}
        subtitle="এই মুহূর্তে সবচেয়ে বেশি খেলা হচ্ছে যে গেমগুলি"
        icon="Flame"
      />
      <NeonCard as="section" className="space-y-4">
        <SectionHeading title={BN.home.popularGames} icon="Flame" size="lg" />
        <GameGrid
          items={POPULAR_GAMES}
          getKey={(g) => g.id}
          ariaLabel="Hot games"
          columns="grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3"
          renderItem={(game) => <GameCard game={game} variant="featured" />}
          stagger
        />
      </NeonCard>
    </div>
  );
}
