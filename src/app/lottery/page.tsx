import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";

export const metadata: Metadata = { title: `${BN.nav.lottery} | BetBoos365` };

export default function LotteryPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner
        title={BN.nav.lottery}
        subtitle="বিশ্ব লটারি, কুইক ড্র এবং নাম্বার গেম"
        icon="Target"
      />
      <NeonCard as="section" className="space-y-4">
        <SectionHeading title={BN.nav.lottery} icon="Target" size="lg" />
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ICONS.Target aria-hidden="true" className="size-12 text-tcl-muted" />
          <p className="text-caption text-tcl-white">
            লটারি প্রোভাইডার ইন্টিগ্রেশন চলছে।
          </p>
          <p className="max-w-md text-[11px] text-tcl-muted">
            অনুমোদিত লটারি অপারেটর যুক্ত হওয়ার আগে এখানে কোনো টিকিট বিক্রি করা
            হচ্ছে না। লাইসেন্সিং সম্পূর্ণ হলে এই পেজে ড্র সিডিউল, টিকিট ক্রয় এবং
            ইতিহাস উপলব্ধ হবে।
          </p>
          <Link
            href="/promotion"
            className="inline-flex items-center gap-1.5 rounded-md border border-tcl-gold/40 bg-tcl-gold/10 px-4 py-2 text-caption text-tcl-gold hover:bg-tcl-gold/20"
          >
            {BN.nav.promotion} দেখুন
            <ICONS.ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </NeonCard>
    </div>
  );
}
