import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Pill } from "@/components/ui/Pill";

export const metadata: Metadata = { title: "Promotions & Bonuses | BetBoos365" };
export const dynamic = "force-dynamic";

interface BonusOffer {
  id: string;
  title: string;
  description: string;
  badge: string;
  highlight?: boolean;
  ctaLabel: string;
  ctaHref: string;
}

const BONUS_OFFERS: BonusOffer[] = [
  {
    id: "welcome-110",
    title: "New Member Welcome Bonus – 110%",
    description: "নতুন সদস্যদের জন্য থাকছে আকর্ষণীয় ১১০% স্বাগত বোনাস অফার!",
    badge: "110% WELCOME",
    highlight: true,
    ctaLabel: "Claim Now",
    ctaHref: "/signup",
  },
  {
    id: "reg-30",
    title: "Registration Bonus – 30 BDT",
    description: "নতুন সদস্যদের স্বাগতম! নিবন্ধন সম্পন্ন করার জন্য থাকছে ৩০ টাকার বিশেষ উপহার।",
    badge: "30 BDT FREE",
    highlight: true,
    ctaLabel: "Register",
    ctaHref: "/signup",
  },
  {
    id: "signin-999",
    title: "30 Days Sign-in Reward – 999 BDT",
    description: "৩০ দিন সাইন-ইন পুরস্কার – ৯৯৯ টাকা!",
    badge: "999 BDT",
    highlight: true,
    ctaLabel: "Sign In",
    ctaHref: "/login",
  },
  {
    id: "birthday-999",
    title: "Birthday Special Reward – 999 BDT 🎂",
    description: "জন্মদিনের বিশেষ উপহার – ৯৯৯ টাকা! আপনার বিশেষ দিনে আনন্দ আরও বাড়িয়ে নিন।",
    badge: "999 BDT 🎂",
    highlight: true,
    ctaLabel: "Claim Gift",
    ctaHref: "/profile",
  },
  {
    id: "first-deposit-30",
    title: "First Deposit Bonus – 30%",
    description: "প্রথম ডিপোজিট বোনাস – ৩০% ক্যাশব্যাক ও অতিরিক্ত ব্যালেন্স।",
    badge: "30% DEPOSIT",
    highlight: false,
    ctaLabel: "Deposit",
    ctaHref: "/login",
  },
  {
    id: "second-deposit-40",
    title: "Second Deposit Bonus – 40%",
    description: "দ্বিতীয় ডিপোজিট বোনাস – ৪০% অতিরিক্ত বোনাস অফার।",
    badge: "40% DEPOSIT",
    highlight: false,
    ctaLabel: "Deposit",
    ctaHref: "/login",
  },
  {
    id: "daily-deposit-6",
    title: "Daily Deposit Bonus – 6%",
    description: "প্রতিদিনের ডিপোজিটে থাকছে ৬% বোনাস সুবিধা।",
    badge: "6% DAILY",
    highlight: false,
    ctaLabel: "Deposit",
    ctaHref: "/login",
  },
  {
    id: "monthly-deposit-10",
    title: "Monthly Deposit Bonus – 10%",
    description: "মাসিক ডিপোজিট বোনাস – ১০% পর্যন্ত অতিরিক্ত সুবিধা।",
    badge: "10% MONTHLY",
    highlight: false,
    ctaLabel: "Deposit",
    ctaHref: "/login",
  },
  {
    id: "cashback-5",
    title: "Cashback Bonus – 5%",
    description: "ক্যাশব্যাক বোনাস – ৫% ক্যাশব্যাক অফার।",
    badge: "5% CASHBACK",
    highlight: false,
    ctaLabel: "Learn More",
    ctaHref: "/promotion",
  },
  {
    id: "loss-rebate-5",
    title: "Loss Rebate – 5%",
    description: "লস রিবেট – ৫% পর্যন্ত রিবেট সুবিধা।",
    badge: "5% REBATE",
    highlight: false,
    ctaLabel: "Learn More",
    ctaHref: "/promotion",
  },
  {
    id: "vip-rewards",
    title: "VIP Rewards",
    description: "ভিআইপি মেম্বারদের জন্য বিশেষ এক্সক্লুসিভ রিওয়ার্ড ও সুবিধা।",
    badge: "VIP",
    highlight: false,
    ctaLabel: "Join VIP",
    ctaHref: "/profile",
  },
  {
    id: "free-bet",
    title: "Free Bet",
    description: "ফ্রি বেট অফার – খেলাধুলায় ঝুঁকিহীন বেটিংয়ের সুযোগ।",
    badge: "FREE BET",
    highlight: false,
    ctaLabel: "Bet Now",
    ctaHref: "/sports",
  },
  {
    id: "free-spins",
    title: "Free Spins",
    description: "ফ্রি স্পিনস – স্লট গেমে ফ্রি স্পিন উপভোগ করুন।",
    badge: "FREE SPINS",
    highlight: false,
    ctaLabel: "Spin Now",
    ctaHref: "/slots",
  },
  {
    id: "community-bonus",
    title: "Community Bonus",
    description: "🎁 গ্রুপে যোগ দিন এবং বিনামূল্যে 30 BDT পান! ⚡ দ্রুত সেটআপ ✅ সহজে সুবিধা গ্রহণ",
    badge: "COMMUNITY",
    highlight: false,
    ctaLabel: "Join Group",
    ctaHref: "/contact",
  },
];

export default function PromotionPage() {
  const items = BONUS_OFFERS;

  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner
        title="Promotions & Bonuses"
        subtitle="আকর্ষণীয় সব বোনাস অফার এবং রিওয়ার্ড — আজই উপভোগ করুন!"
        icon="Gift"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((promo, i) => (
          <NeonCard
            key={promo.id}
            as="article"
            hoverGlow
            className={`animate-stagger flex flex-col justify-between space-y-4 transition-all duration-300 ${
              promo.highlight
                ? "border-tcl-red/80 shadow-[0_0_20px_rgba(255,51,38,0.25)] bg-gradient-to-b from-[#1a0808] to-[#121212]"
                : ""
            }`}
            style={{ "--stagger-i": i } as React.CSSProperties}
          >
            <div>
              <div className="mb-3 flex items-center justify-between">
                <Pill variant={promo.highlight ? "free" : "gold"}>{promo.badge}</Pill>
                {promo.highlight && (
                  <span className="text-xs font-bold text-tcl-gold tracking-wider uppercase bg-tcl-gold/10 px-2 py-0.5 rounded border border-tcl-gold/30">
                    Featured
                  </span>
                )}
              </div>
              <h2 className="font-display text-heading-lg uppercase text-gold-gradient">
                {promo.title}
              </h2>
              <p className="mt-2 text-caption text-tcl-muted leading-relaxed whitespace-pre-line">
                {promo.description}
              </p>
            </div>
            <div className="pt-2">
              <SecondaryButton href={promo.ctaHref} size="sm" arrow>
                {promo.ctaLabel}
              </SecondaryButton>
            </div>
          </NeonCard>
        ))}
      </div>
    </div>
  );
}
