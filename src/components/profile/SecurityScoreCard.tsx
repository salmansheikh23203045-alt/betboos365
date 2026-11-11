"use client";

import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";
import { useRouter } from "next/navigation";

export function SecurityScoreCard({ score = 0 }: { score?: number }) {
  const router = useRouter();
  const level = score < 40
    ? BN.userCenter.securityLow
    : score < 75
      ? BN.userCenter.securityMedium
      : BN.userCenter.securityHigh;

  return (
    <div className="relative overflow-hidden rounded-card border border-tcl-red/40 bg-gradient-to-br from-tcl-red to-tcl-red/70 p-6 text-center shadow-[0_0_28px_rgba(220,38,38,0.4)]">
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
        <div className="flex size-44 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-sm">
          <div className="flex size-36 flex-col items-center justify-center rounded-full bg-white text-tcl-red">
            <span className="font-display text-3xl uppercase leading-none">
              {level}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-tcl-red/70">
              {BN.userCenter.securityScore}
            </span>
          </div>
        </div>

        <p className="text-sm text-white">
          {BN.userCenter.accountSecurityLow}
        </p>
        <p className="text-[12px] text-white/80">
          কোর হল {score} পয়েন্ট
        </p>

        <p className="mt-4 w-full border-t border-white/20 pt-3 text-caption uppercase text-white/80">
          {BN.userCenter.recommendedSetting}
        </p>
        <div className="grid grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center gap-1 text-white hover:opacity-90"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
              <ICONS.User aria-hidden="true" className="size-6" />
            </span>
            <span className="text-[11px]">{BN.userCenter.personalInfo}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile/withdraw")}
            className="flex flex-col items-center gap-1 text-white hover:opacity-90"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-pink-600 shadow-md">
              <ICONS.Wallet aria-hidden="true" className="size-6" />
            </span>
            <span className="text-[11px]">{BN.userCenter.bindEWallet}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
