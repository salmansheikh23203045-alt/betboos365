"use client";

/* Step 02 design-system showcase. Renders every reusable component with mock data so the
 * system can be checked against the reference. Home page composition is Step 03. */

import { AssetPlaceholder } from "@/components/ui/AssetPlaceholder";
import { Logo } from "@/components/ui/Logo";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Pill } from "@/components/ui/Pill";
import { GameCard } from "@/components/games/GameCard";
import { GameCarousel } from "@/components/games/GameCarousel";
import { GameGrid } from "@/components/games/GameGrid";
import { PromotionBanner } from "@/components/promo/PromotionBanner";
import { VIPProgressCard } from "@/components/vip/VIPProgressCard";
import { LiveTransactionTable } from "@/components/transactions/LiveTransactionTable";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import {
  FEATURED_GAMES,
  PAYMENT_METHODS,
  POPULAR_GAMES,
  SPORTS_PROMO,
  TRANSACTIONS,
  VIP_STATUS,
  WELCOME_PROMO,
} from "@/data/mock";

const SWATCHES: { name: string; token: string; hex: string }[] = [
  { name: "Primary background", token: "tcl-black", hex: "#0a0a0a" },
  { name: "Secondary background", token: "tcl-charcoal", hex: "#161616" },
  { name: "Card surface", token: "tcl-surface", hex: "#1a0808" },
  { name: "Primary accent (red)", token: "tcl-red", hex: "#e10f0f" },
  { name: "Red highlight", token: "tcl-red-bright", hex: "#ff2a2a" },
  { name: "Secondary accent (gold)", token: "tcl-gold", hex: "#ffc21a" },
  { name: "Gold highlight", token: "tcl-gold-light", hex: "#ffe27a" },
  { name: "Text", token: "tcl-white", hex: "#ffffff" },
  { name: "Muted text", token: "tcl-muted", hex: "#9a9a9a" },
  { name: "Success", token: "tcl-success", hex: "#1f9d3a" },
];

function ShowcaseSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto max-w-[1280px] space-y-4 px-4 py-6 lg:px-6">
      <h2 id={`${id}-title`} className="border-b border-tcl-red/40 pb-2 text-heading-lg font-extrabold uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DesignSystemShowcase() {
  return (
    <div className="pb-6">
      <header className="mx-auto max-w-[1280px] px-4 pt-6 lg:px-6">
        <p className="text-label font-bold uppercase tracking-wider text-tcl-gold">Step 02 · Design system</p>
        <h1 className="text-display-xl font-display uppercase text-gold-gradient">Component showcase</h1>
        <p className="mt-2 max-w-2xl text-body text-tcl-muted">
          Every reusable component, rendered with mock data. Used to check the system against the reference image.
        </p>
      </header>

      <ShowcaseSection id="colors" title="Colour tokens">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {SWATCHES.map((s) => (
            <li key={s.token} className="space-y-1">
              <div
                className="h-14 rounded-tile border border-tcl-white/20"
                style={{ background: s.hex }}
                aria-hidden="true"
              />
              <p className="text-caption font-semibold">{s.name}</p>
              <p className="text-label text-tcl-muted">
                --color-{s.token} · {s.hex}
              </p>
            </li>
          ))}
        </ul>
      </ShowcaseSection>

      <ShowcaseSection id="effects" title="Visual effects">
        <div className="grid gap-4 md:grid-cols-3">
          <NeonCard className="space-y-1">
            <p className="font-bold">Red neon border + glow</p>
            <p className="text-caption text-tcl-muted">`neon-border-red`</p>
          </NeonCard>
          <NeonCard tone="gold" className="space-y-1">
            <p className="font-bold">Gold neon border + glow</p>
            <p className="text-caption text-tcl-muted">`neon-border-gold`</p>
          </NeonCard>
          <NeonCard hoverGlow className="space-y-1">
            <p className="font-bold">Hover: brighter red glow</p>
            <p className="text-caption text-tcl-muted">`hover-glow-red`</p>
          </NeonCard>
          <div className="rounded-card bg-gold-gradient p-4 text-tcl-black">
            <p className="font-bold">Golden gradient</p>
            <p className="text-caption">`bg-gold-gradient`</p>
          </div>
          <div className="rounded-card bg-red-gradient p-4">
            <p className="font-bold">Red gradient</p>
            <p className="text-caption">`bg-red-gradient`</p>
          </div>
          <div className="rounded-card bg-fire-glow border border-tcl-red p-4">
            <p className="font-bold">Casino fire glow</p>
            <p className="text-caption">`bg-fire-glow`</p>
          </div>
          <div className="hover-sheen rounded-card border border-tcl-white/20 bg-tcl-charcoal p-4">
            <p className="font-bold">Hover sheen (hover me)</p>
            <p className="text-caption text-tcl-muted">`hover-sheen`, transform only</p>
          </div>
          <div className="rounded-card bg-tcl-charcoal p-4">
            <p className="text-gold-gradient font-display text-3xl uppercase">Gold gradient text</p>
            <p className="text-caption text-tcl-muted">`text-gold-gradient`</p>
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="typography" title="Typography">
        <div className="space-y-3">
          <p className="font-display text-display-hero uppercase leading-none text-gold-gradient">Get 100%</p>
          <p className="font-display text-display-xl uppercase leading-none">Welcome Bonus</p>
          <p className="text-heading-lg font-extrabold uppercase">Section heading (lg)</p>
          <p className="text-heading-md font-bold uppercase">Card heading (md)</p>
          <p className="text-heading-sm font-bold uppercase text-tcl-gold">Panel label (sm)</p>
          <p className="text-body">Body text, 14px, for descriptions and copy.</p>
          <p className="text-caption text-tcl-muted">Caption and footer text, 12px, muted gray.</p>
          <p className="text-label font-bold uppercase tracking-wider">Nav and table label, 11px uppercase</p>
          <p className="font-display text-lg uppercase">Game title (display face)</p>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="buttons" title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton>Sign Up</PrimaryButton>
          <SecondaryButton>Claim Now</SecondaryButton>
          <SecondaryButton arrow>Bet Now</SecondaryButton>
          <SecondaryButton variant="outline">Log In</SecondaryButton>
          <SecondaryButton icon="Crown">Login To View VIP Status</SecondaryButton>
          <SecondaryButton size="sm" shape="rect">Small</SecondaryButton>
          <PrimaryButton size="lg" shape="rect">Large</PrimaryButton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Pill variant="live" dot>Live</Pill>
          <Pill variant="success">Success</Pill>
          <Pill variant="win">Win</Pill>
          <Pill variant="free">Free</Pill>
          <Pill variant="neutral">Pending</Pill>
          <Pill variant="gold">Gold outline</Pill>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
          <p className="text-caption text-tcl-muted">Logo sizes: sm (mobile header), md (desktop header, footer), lg.</p>
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="promos" title="Promotion banners">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <PromotionBanner promo={WELCOME_PROMO} variant="hero" artLabel="Hero artwork (desktop)" />
          <PromotionBanner promo={SPORTS_PROMO} variant="compact" tone="gold-gold" artLabel="Sports artwork" />
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="rail" title="VIP and live transactions">
        <div className="grid gap-4 lg:grid-cols-2">
          <VIPProgressCard status={VIP_STATUS} />
          <LiveTransactionTable transactions={TRANSACTIONS} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection id="games" title="Game cards and carousels">
        <SectionHeading title="Popular Games" icon="Flame" viewAllHref="/casino" />
        <GameCarousel
          items={POPULAR_GAMES}
          getKey={(g) => g.id}
          ariaLabel="Popular games"
          arrows
          renderItem={(game) => <GameCard game={game} variant="category" />}
        />

        <SectionHeading title="Featured Games" icon="Gamepad2" viewAllHref="/casino" className="pt-4" />
        <GameGrid
          items={FEATURED_GAMES}
          getKey={(g) => g.id}
          ariaLabel="Featured games grid (desktop)"
          columns="grid-cols-2 md:grid-cols-4 lg:grid-cols-5"
          renderItem={(game) => <GameCard game={game} variant="featured" />}
        />
      </ShowcaseSection>

      <ShowcaseSection id="payments" title="Payment methods">
        <PaymentMethods methods={PAYMENT_METHODS} />
      </ShowcaseSection>

      <ShowcaseSection id="placeholders" title="Missing-asset placeholder">
        <div className="h-32 max-w-sm">
          <AssetPlaceholder label="Example: provider logo" />
        </div>
      </ShowcaseSection>
    </div>
  );
}
