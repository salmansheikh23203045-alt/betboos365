import Image from "next/image";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { PromotionContent } from "@/types";

export interface PromotionBannerProps {
  promo: PromotionContent;
  /** hero: large welcome banner with eyebrow pill. compact: sports-style side banner. */
  variant?: "hero" | "compact";
  /** "gold-white": gold title + white highlight. "gold-gold": both gold (reference: "Sports Betting"). */
  tone?: "gold-white" | "gold-gold";
  /** Artwork path. Falls back to an intentional branded SVG when absent. */
  artSrc?: string;
  /** Accessibility hint describing the artwork slot. */
  artLabel: string;
  className?: string;
}

/**
 * PromotionBanner — red neon banner: display-type copy, gold CTA, and an art slot on the right.
 * Reference: "GET 100% WELCOME BONUS" hero and the "Sports Betting" side banner.
 * Text is live HTML, not baked into the artwork (approved assumption, UI_REFERENCE_ANALYSIS.md §8).
 */
export function PromotionBanner({
  promo,
  variant = "hero",
  tone = "gold-white",
  artSrc,
  artLabel,
  className,
}: PromotionBannerProps) {
  const isHero = variant === "hero";
  const highlightClass = tone === "gold-gold" ? "text-gold-gradient" : "text-tcl-white";
  const titleSize = isHero ? "text-display-hero" : "text-display-xl";
  // Gradient-clipped text cannot take text-shadow (the shadow shows through), so use drop-shadow.
  const displayBase = "font-display uppercase leading-none drop-shadow-[0_3px_0_rgb(0_0_0/0.9)]";

  return (
    <NeonCard
      as="section"
      padding="none"
      className={cn(
        "relative isolate overflow-hidden bg-fire-glow",
        isHero ? "min-h-[200px] lg:min-h-[230px]" : "min-h-[170px]",
        className,
      )}
    >
      <div className="relative z-10 flex h-full max-w-[60%] flex-col justify-center gap-2 p-4 md:p-6">
        {isHero ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-pill border border-tcl-gold bg-tcl-black/60 px-3 py-1 text-label font-bold uppercase tracking-wider text-tcl-gold">
            <ICONS.Crown aria-hidden="true" className="size-3.5" />
            {promo.eyebrow}
          </span>
        ) : null}

        <p className={cn(displayBase, titleSize, "text-gold-gradient")}>{promo.title}</p>
        <p className={cn(displayBase, "text-display-xl", highlightClass)}>{promo.highlight}</p>

        <p className="text-caption font-semibold text-tcl-white md:text-body">{promo.subtitle}</p>

        <div className="pt-1">
          <SecondaryButton href={promo.ctaHref} size={isHero ? "md" : "sm"} arrow>
            {promo.ctaLabel}
          </SecondaryButton>
        </div>
      </div>

      <div className="absolute inset-y-0 right-0 w-[45%] p-2">
        {artSrc ? (
          // Artwork is decorative: the banner copy carries the meaning.
          <Image
            src={artSrc}
            alt=""
            fill
            sizes="(min-width: 1024px) 330px, 45vw"
            className="object-contain object-right"
          />
        ) : (
          // Intentional branded SVG — never a labelled placeholder.
          <BannerArt label={artLabel} />
        )}
      </div>
    </NeonCard>
  );
}

function BannerArt({ label }: { label: string }) {
  return (
    <div className="relative size-full" aria-label={label} role="img">
      <svg
        viewBox="0 0 200 140"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id="pb-rad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#f1bf3d" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#c21e1e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#1a0505" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pb-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6d968" />
            <stop offset="0.5" stopColor="#f1bf3d" />
            <stop offset="1" stopColor="#b7892a" />
          </linearGradient>
        </defs>
        <rect width="200" height="140" fill="url(#pb-rad)" />
        <g opacity="0.35" stroke="url(#pb-gold)" strokeWidth="0.6">
          {Array.from({ length: 14 }).map((_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return (
              <line
                key={i}
                x1="130"
                y1="70"
                x2={130 + Math.cos(a) * 90}
                y2={70 + Math.sin(a) * 90}
              />
            );
          })}
        </g>
        <circle cx="130" cy="70" r="30" fill="#0a0a0a" stroke="url(#pb-gold)" strokeWidth="2" />
        <text
          x="130"
          y="80"
          textAnchor="middle"
          fontSize="30"
          fontFamily="var(--font-anton, sans-serif)"
          fontWeight="700"
          fill="url(#pb-gold)"
        >
          ★
        </text>
      </svg>
    </div>
  );
}
