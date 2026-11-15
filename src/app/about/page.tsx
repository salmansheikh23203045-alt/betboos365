import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "About Us | BetBoos365" };

const VALUES = [
  { icon: "ShieldCheck" as const, title: "Safe & Secure", text: "Advanced encryption and security protocols protect your data and transactions at all times." },
  { icon: "Zap" as const, title: "Lightning Fast", text: "Instant deposits and rapid withdrawals ensure you never have to wait to play or cash out." },
  { icon: "Headset" as const, title: "24/7 Support", text: "Our dedicated support team is available around the clock to assist you with any questions." },
  { icon: "Crown" as const, title: "VIP Experience", text: "Exclusive rewards, personal account managers, and premium perks for our loyal players." },
];

export default function AboutPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-8 px-4 py-6 lg:px-6">
      <PageBanner title="About Us" subtitle="The story behind BetBoos365" icon="Info" />

      <NeonCard as="section" className="space-y-4">
        <h2 className="font-display text-heading-lg uppercase text-gold-gradient">Who We Are</h2>
        <p className="text-body leading-relaxed text-tcl-muted">
          BetBoos365 is a premier online gaming destination that brings together the best casino games, live dealers, sports betting,
          and esports under one roof. We are committed to providing a safe, fair, and thrilling gaming experience for players worldwide.
        </p>
        <p className="text-body leading-relaxed text-tcl-muted">
          Our platform features games from the industry&apos;s most respected providers, including Pragmatic Play, Evolution,
          JILI, PG Soft, and many more. Whether you prefer spinning the reels, playing against live dealers, or betting on
          your favourite sports, BetBoos365 has something for everyone.
        </p>
      </NeonCard>

      <section className="space-y-4">
        <h2 className="text-center font-display text-heading-lg uppercase text-gold-gradient">Our Values</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => {
            const Icon = ICONS[v.icon];
            return (
              <NeonCard key={v.title} hoverGlow className="animate-stagger text-center" style={{ "--stagger-i": i } as React.CSSProperties}>
                <Icon aria-hidden="true" className="mx-auto mb-3 size-10 text-tcl-gold" />
                <h3 className="mb-2 text-heading-sm font-bold uppercase text-tcl-white">{v.title}</h3>
                <p className="text-caption text-tcl-muted leading-relaxed">{v.text}</p>
              </NeonCard>
            );
          })}
        </div>
      </section>

      <NeonCard as="section" className="space-y-4">
        <h2 className="font-display text-heading-lg uppercase text-gold-gradient">Responsible Gaming</h2>
        <p className="text-body leading-relaxed text-tcl-muted">
          At BetBoos365, we believe gaming should always be fun and entertaining. We encourage all players to gamble responsibly
          and offer tools to help you stay in control — including deposit limits, session reminders, and self-exclusion options.
          If you or someone you know has a gambling problem, please seek help.
        </p>
      </NeonCard>
    </div>
  );
}
