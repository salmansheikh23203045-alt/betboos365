import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NeonCard } from "@/components/ui/NeonCard";
import { PageBanner } from "@/components/pages/PageBanner";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";
import { ReferralCard } from "@/components/referral/ReferralCard";

export const metadata: Metadata = { title: `${BN.referral.title} | BetBoos365` };
export const dynamic = "force-dynamic";

export default async function ReferralPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/referral");

  // Referral code is derived from the username — stable, memorable, and no
  // extra backend state required for the preview. Real payouts land when
  // the referral ledger goes live.
  const code = user.username.toUpperCase().slice(0, 10);

  return (
    <div className="animate-fade-in-up mx-auto max-w-[920px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner
        title={BN.referral.title}
        subtitle={BN.referral.subtitle}
        icon="Users"
      />

      <NeonCard className="flex items-start gap-3 border-tcl-gold/40 bg-tcl-gold/5">
        <ICONS.AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tcl-gold" />
        <div className="text-caption text-tcl-muted">
          <p className="font-semibold text-tcl-gold">{BN.common.comingSoon}</p>
          <p className="mt-1">{BN.referral.comingSoonBody}</p>
        </div>
      </NeonCard>

      <ReferralCard code={code} />

      <NeonCard className="space-y-3">
        <h2 className="font-display text-heading-md uppercase text-tcl-white">
          {BN.referral.howItWorks}
        </h2>
        <ol className="space-y-2 text-caption text-tcl-muted">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-tcl-gold text-tcl-gold font-bold">
              ১
            </span>
            <span>{BN.referral.step1}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-tcl-gold text-tcl-gold font-bold">
              ২
            </span>
            <span>{BN.referral.step2}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-tcl-gold text-tcl-gold font-bold">
              ৩
            </span>
            <span>{BN.referral.step3}</span>
          </li>
        </ol>
      </NeonCard>
    </div>
  );
}
