import Image from "next/image";
import { AssetPlaceholder } from "@/components/ui/AssetPlaceholder";
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
  /** Artwork path. Until supplied, a labelled placeholder is shown. */
  artSrc?: string;
  /** Name of the missing artwork, shown in the placeholder. */
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
          <Image src={artSrc} alt="" fill sizes="(min-width: 1024px) 330px, 45vw" className="object-contain object-right" />
        ) : (
          <AssetPlaceholder label={artLabel} />
        )}
      </div>
    </NeonCard>
  );
}
