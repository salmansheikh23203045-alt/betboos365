import Image from "next/image";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import type { PromotionContent } from "@/types";

/**
 * Sports Betting banner (mobile). Artwork is a hand-built SVG (flaming ball, trophy, floodlights),
 * not a photo: the reference's footballer is a real person and cannot be used.
 */
export function MobileSportsBanner({ promo }: { promo: PromotionContent }) {
  return (
    <NeonCard
      as="section"
      aria-label="Sports betting"
      padding="none"
      className="relative isolate aspect-[2.1/1] overflow-hidden bg-[radial-gradient(circle_at_72%_55%,rgb(200_20_10/0.55),rgb(60_4_4/0.6)_55%,transparent_80%)]"
    >
      <div className="absolute inset-y-0 right-0 w-[64%]">
        <Image src="/images/sports/sports-art.svg" alt="" fill unoptimized className="pointer-events-none object-contain object-right" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-tcl-black/75 via-tcl-black/40 to-transparent"
      />

      <div className="relative z-10 flex h-full w-[52%] flex-col justify-center gap-1.5 pl-4">
        <p className="font-display text-[length:clamp(26px,8.4vw,36px)] italic leading-[0.92] text-gold-gradient drop-shadow-[0_2px_0_rgb(0_0_0/0.9)]">
          {promo.title}
          <br />
          {promo.highlight}
        </p>
        <p className="text-[12px] font-semibold leading-tight text-tcl-white">{promo.subtitle}</p>
        <SecondaryButton href={promo.ctaHref} size="sm" arrow className="mt-1 w-fit normal-case! text-[13px]! tracking-normal!">
          {promo.ctaLabel}
        </SecondaryButton>
      </div>
    </NeonCard>
  );
}
