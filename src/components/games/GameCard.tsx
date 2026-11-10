import Image from "next/image";
import { AssetPlaceholder } from "@/components/ui/AssetPlaceholder";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import type { Game } from "@/types";

export type GameCardVariant = "featured" | "category";

export interface GameCardProps {
  game: Game;
  /** featured: landscape game tile (reference: 2 × 5 grid). category: wider tile (reference: SLOT / BONZA …). */
  variant?: GameCardVariant;
  className?: string;
}

const ASPECT: Record<GameCardVariant, string> = {
  featured: "aspect-[1.6/1]",
  category: "aspect-[1.35/1]",
};

/**
 * GameCard — artwork tile with red glowing border, optional FREE badge,
 * and a title / provider label along the bottom edge.
 * Hover: red glow intensifies and a light sheen sweeps across (transform only).
 */
export function GameCard({ game, variant = "featured", className }: GameCardProps) {
  return (
    <article
      className={cn(
        "group relative w-full overflow-hidden rounded-tile neon-border-red bg-card-dark",
        "hover-glow-red hover-sheen",
        ASPECT[variant],
        className,
      )}
    >
      {game.artSrc ? (
        <Image
          src={game.artSrc}
          alt={game.title}
          fill
          sizes="(min-width: 1024px) 140px, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 p-1.5 max-lg:hidden">
          <AssetPlaceholder label={`${game.title} artwork`} />
        </div>
      )}

      {game.isFree ? (
        <Pill variant="free" className="absolute right-1.5 top-1.5 z-10">
          Free
        </Pill>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-tcl-black/90 to-transparent px-2 pb-1.5 pt-6">
        {game.logoSrc ? (
          <div className="flex justify-center">
            <Image src={game.logoSrc} alt={game.provider} width={96} height={20} className="h-4 w-auto" />
          </div>
        ) : (
          <p
            className={cn(
              "truncate text-center font-display uppercase leading-none tracking-wide text-tcl-white text-outline-dark",
              variant === "category" ? "text-lg max-lg:text-[11px]" : "text-sm",
            )}
          >
            {game.title}
          </p>
        )}
        <p className="sr-only">{game.provider}</p>
      </div>
    </article>
  );
}
