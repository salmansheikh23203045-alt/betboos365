import Image from "next/image";
import type { MobileGameTile } from "@/data/mobileHome";

/* The mobile tree is display:none on desktop; "1px" there keeps it from requesting a large candidate. */
const POPULAR_SIZES = "(min-width: 1024px) 1px, 22vw";
const FEATURED_SIZES = "(min-width: 1024px) 1px, 30vw";

/** Popular Games tile: artwork filling a red neon frame, game name along the bottom (reference: SLOT / BONZA …). */
export function PopularTile({ game }: { game: MobileGameTile }) {
  return (
    <article className="tile-neon group relative aspect-[0.92/1] overflow-hidden rounded-[9px]">
      <Image
        src={game.artSrc}
        alt=""
        fill
        sizes={POPULAR_SIZES}
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-tcl-black/90 via-tcl-black/50 to-transparent px-1 pb-1 pt-4">
        <p className="truncate text-center font-display text-[length:clamp(10px,3vw,13px)] uppercase leading-none tracking-wide text-tcl-white text-outline-dark">
          {game.title}
        </p>
      </div>
    </article>
  );
}

/** Featured Games tile: host / table artwork, red FREE tab, provider name with a coloured glow (reference: mobile Featured Games). */
export function FeaturedTile({ game }: { game: MobileGameTile }) {
  return (
    <article className="tile-neon group relative aspect-[1.2/1] overflow-hidden rounded-[9px]">
      <Image
        src={game.artSrc}
        alt=""
        fill
        sizes={FEATURED_SIZES}
        className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
      />
      {game.isFree ? (
        <span className="absolute right-0 top-0 z-10 rounded-bl-[7px] bg-gradient-to-b from-[#ff4a3a] to-[#c00000] px-1.5 pb-[3px] pt-[2px] text-[10px] font-extrabold uppercase italic leading-none tracking-wide text-tcl-white shadow-[0_2px_6px_rgb(0_0_0/0.5)]">
          Free
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-tcl-black/90 via-tcl-black/55 to-transparent px-1 pb-1.5 pt-6">
        <p
          className="truncate text-center font-display text-[length:clamp(11px,3.4vw,14px)] uppercase italic leading-none tracking-wide text-tcl-white"
          style={{ textShadow: `0 0 8px ${game.accent ?? "#ff3326"}, 0 1px 0 #000, 0 0 2px #000` }}
        >
          {game.title}
        </p>
        <p className="sr-only">{game.provider}</p>
      </div>
    </article>
  );
}
