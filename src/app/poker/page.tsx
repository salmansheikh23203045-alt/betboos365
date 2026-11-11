import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";

export const metadata: Metadata = { title: `${BN.nav.poker} | TCL11` };

export default function PokerPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner
        title={BN.nav.poker}
        subtitle="ক্লাসিক পোকার এবং ভেরিয়েন্ট টেবিল"
        icon="Dices"
      />
      <NeonCard as="section" className="space-y-4">
        <SectionHeading title={BN.nav.poker} icon="Dices" size="lg" />
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ICONS.Dices aria-hidden="true" className="size-12 text-tcl-muted" />
          <p className="text-caption text-tcl-white">
            পোকার টেবিল প্রোভাইডার যুক্ত হচ্ছে।
          </p>
          <p className="max-w-md text-[11px] text-tcl-muted">
            লাইসেন্সড পোকার রুম সংযুক্ত হওয়ার পরে এই পেজে টেক্সাস হোল্ডেম,
            ওমাহা, স্ট্যাড সহ টেবিল উপলব্ধ হবে। নকল টেবিল দেখানো হচ্ছে না।
          </p>
          <Link
            href="/live-casino"
            className="inline-flex items-center gap-1.5 rounded-md border border-tcl-gold/40 bg-tcl-gold/10 px-4 py-2 text-caption text-tcl-gold hover:bg-tcl-gold/20"
          >
            {BN.nav.liveCasino} দেখুন
            <ICONS.ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </NeonCard>
    </div>
  );
}
