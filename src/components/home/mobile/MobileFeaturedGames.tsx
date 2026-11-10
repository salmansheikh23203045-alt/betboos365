import { NeonCard } from "@/components/ui/NeonCard";
import type { MobileGameTile } from "@/data/mobileHome";
import { MobileSectionHeading } from "./MobileSectionHeading";
import { FeaturedTile } from "./MobileGameTiles";

/** Featured Games (mobile): 3-column grid of provider tiles inside a neon panel. */
export function MobileFeaturedGames({ games }: { games: MobileGameTile[] }) {
  return (
    <NeonCard as="section" aria-label="Featured games" padding="sm" className="space-y-3">
      <MobileSectionHeading
        title="Featured Games"
        icon="Gamepad2"
        iconClassName="fill-tcl-gold/25 text-tcl-gold"
        viewAllHref="/casino"
      />
      <ul aria-label="Featured games" className="grid grid-cols-3 gap-2">
        {games.map((game) => (
          <li key={game.id}>
            <FeaturedTile game={game} />
          </li>
        ))}
      </ul>
    </NeonCard>
  );
}
