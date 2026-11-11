"use client";

import { useEffect, useState } from "react";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";
import type { SessionUser } from "@/components/auth/AuthProvider";
import { fetchMyWallet } from "@/lib/wallet-client";
import type { WalletView } from "@/types/wallet";

export function PrizeCenterClient({ user }: { user: SessionUser }) {
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMyWallet().then((r) => r.ok && setWallet(r.data));
  }, []);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  return (
    <UserCenterShell title={BN.userCenter.prizeCenter}>
      <div className="space-y-4">
        {/* Top bar with tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-1.5 text-caption text-tcl-red-bright"
          >
            {BN.userCenter.prizeCenter}{" "}
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-tcl-red text-[10px] font-bold text-white">
              1
            </span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-tcl-gold/40 bg-tcl-gold/10 px-3 py-1.5 text-caption text-tcl-gold"
          >
            <ICONS.Trophy aria-hidden="true" className="size-3.5" />
            টিকিটের রেকর্ড
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)]">
          {/* Account card */}
          <NeonCard className="space-y-3 bg-gradient-to-br from-purple-700 to-purple-900 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-2xl text-white">{user.username}</p>
                <p className="text-[11px] text-white/70">
                  ব্যবহারকারীর নম্বর:{" "}
                  <span className="text-white">{user.username}</span>
                  <button
                    type="button"
                    onClick={copyId}
                    className="ml-1 text-white/80 hover:text-white"
                  >
                    <ICONS.Copy aria-hidden="true" className="inline size-3" />
                  </button>
                  {copied ? (
                    <span className="ml-1 text-[10px] text-tcl-gold">
                      {BN.common.copied}
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                aria-label={BN.userCenter.refreshBalance}
                className="rounded-full p-1 text-white/70 hover:text-white"
                onClick={() =>
                  fetchMyWallet().then((r) => r.ok && setWallet(r.data))
                }
              >
                <ICONS.History aria-hidden="true" className="size-4" />
              </button>
            </div>

            <div className="rounded-md border border-white/20 bg-white/10 p-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-white/70">
                প্রাপ্ত হিসাব
              </p>
              <p className="font-display text-3xl uppercase text-white">
                ৳ {wallet ? wallet.availableBalance.toFixed(2) : "0.00"}
              </p>
            </div>

            <ul className="space-y-2">
              <li className="flex items-center gap-3 rounded-md border border-white/20 bg-white/5 p-2 text-[12px]">
                <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600">
                  <ICONS.Star aria-hidden="true" className="size-5 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">সাইন-ইন কাজ</p>
                  <p className="text-[10px] text-white/70">একটি কাজ চলমান</p>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-white/40 px-3 py-1 text-[11px] text-white hover:bg-white/10"
                >
                  {BN.common.view}
                </button>
              </li>
              <li className="flex items-center gap-3 rounded-md border border-white/20 bg-white/5 p-2 text-[12px]">
                <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-600">
                  <ICONS.Gift aria-hidden="true" className="size-5 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">রেসকিউ ফান্ড</p>
                  <p className="text-[10px] text-white/70">
                    পুনরুদ্ধারে সাহায্য করুন
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-white/40 px-3 py-1 text-[11px] text-white hover:bg-white/10"
                >
                  {BN.common.view}
                </button>
              </li>
            </ul>
          </NeonCard>

          {/* Reward highlight */}
          <NeonCard className="relative overflow-hidden bg-gradient-to-br from-pink-100 to-pink-200 text-pink-900">
            <div className="absolute left-4 top-3 font-display text-7xl text-pink-300/60">
              1
            </div>
            <div className="relative grid gap-4 md:grid-cols-[1.4fr_minmax(0,1fr)]">
              <div className="space-y-2">
                <p className="font-display text-xl uppercase text-pink-900">
                  {BN.userCenter.freeNotify}
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-tcl-red to-rose-600 p-4 text-center text-white shadow-lg">
                <p className="text-[11px] uppercase tracking-wide text-white/80">
                  {BN.userCenter.coupon}
                </p>
                <p className="my-1 font-display text-2xl uppercase text-tcl-gold">
                  {BN.userCenter.rebateChip}
                </p>
                <p className="text-[11px] text-white/80">
                  {BN.userCenter.expires}:{" "}
                  {new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                </p>
              </div>
              <div className="rounded-xl border border-pink-300 bg-white p-4 text-center">
                <p className="text-[11px] uppercase text-pink-500">
                  {BN.userCenter.daysRemaining}
                </p>
                <p className="font-display text-3xl uppercase text-pink-900">
                  0{" "}
                  <span className="text-sm">
                    {BN.userCenter.daysSuffix}
                  </span>
                </p>
                <p className="text-[11px] text-pink-700">23:24:15</p>
                <button
                  type="button"
                  className={cn(
                    "mt-2 w-full rounded-md bg-gradient-to-r from-green-400 to-emerald-600 py-1.5 text-[12px] font-semibold text-white",
                  )}
                >
                  {BN.userCenter.claim}
                </button>
              </div>
            </div>
          </NeonCard>
        </div>

        <NeonCard>
          <p className="py-10 text-center text-caption text-tcl-muted">
            {BN.userCenter.noRewards}
          </p>
        </NeonCard>
      </div>
    </UserCenterShell>
  );
}
