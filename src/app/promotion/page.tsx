import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Pill } from "@/components/ui/Pill";
import { PROMOTIONS as FALLBACK_PROMOTIONS } from "@/data/pages";
import { backendFetch } from "@/lib/api";

export const metadata: Metadata = { title: "Promotions | TCL11" };
// Re-render on every request — promotions are editable in the backend, we
// don't want to ship a stale list from build time.
export const dynamic = "force-dynamic";

interface BackendPromotion {
  id: string;
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  minVipLevel: number;
}

interface DisplayPromotion {
  id: string;
  title: string;
  description: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
}

async function fetchPromotions(): Promise<{
  items: DisplayPromotion[];
  source: "backend" | "fallback";
}> {
  try {
    const res = await backendFetch("/promotions");
    if (!res.ok) return { items: FALLBACK_PROMOTIONS, source: "fallback" };
    const body = (await res.json()) as { data?: BackendPromotion[] };
    const rows = body.data ?? [];
    const active = rows.filter((p) => p.isActive);
    if (active.length === 0) return { items: FALLBACK_PROMOTIONS, source: "fallback" };
    return {
      items: active.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        badge: p.badge,
        ctaLabel: p.ctaLabel,
        ctaHref: p.ctaHref,
      })),
      source: "backend",
    };
  } catch {
    return { items: FALLBACK_PROMOTIONS, source: "fallback" };
  }
}

export default async function PromotionPage() {
  const { items, source } = await fetchPromotions();

  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Promotions" subtitle="Exclusive bonuses and offers for our players" icon="Gift" />

      {source === "fallback" ? (
        <p className="text-caption text-tcl-muted">
          Showing sample promotions — live offers unavailable right now.
        </p>
      ) : null}

      {items.length === 0 ? (
        <NeonCard className="text-center text-caption text-tcl-muted">
          There are no active promotions right now. Check back soon.
        </NeonCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((promo, i) => (
            <NeonCard
              key={promo.id}
              as="article"
              hoverGlow
              className="animate-stagger flex flex-col justify-between space-y-4"
              style={{ "--stagger-i": i } as React.CSSProperties}
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Pill variant="free">{promo.badge}</Pill>
                </div>
                <h2 className="font-display text-heading-lg uppercase text-gold-gradient">{promo.title}</h2>
                <p className="mt-2 text-caption text-tcl-muted leading-relaxed">{promo.description}</p>
              </div>
              <SecondaryButton href={promo.ctaHref} size="sm" arrow>
                {promo.ctaLabel}
              </SecondaryButton>
            </NeonCard>
          ))}
        </div>
      )}
    </div>
  );
}
