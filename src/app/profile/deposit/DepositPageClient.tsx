"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DepositModal } from "@/components/wallet/DepositModal";
import { TransactionList } from "@/components/wallet/TransactionList";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";
import { fetchMyWallet, fetchWalletConfig } from "@/lib/wallet-client";
import type { WalletView, WalletConfig } from "@/types/wallet";

export function DepositPageClient() {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchMyWallet().then((r) => r.ok && setWallet(r.data));
    fetchWalletConfig().then((r) => r.ok && setConfig(r.data));
  }, [refreshKey]);

  return (
    <UserCenterShell title={BN.userCenter.deposit}>
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_minmax(0,1fr)]">
          <NeonCard className="space-y-4">
            <SectionHeading title={BN.userCenter.deposit} icon="ArrowDownCircle" />
            <p className="text-caption text-tcl-white/80">
              bKash, Nagad, Rocket এবং Upay এর মধ্যে একটি পেমেন্ট মাধ্যম নির্বাচন
              করে ডিপোজিট শুরু করুন। পেমেন্ট সম্পন্ন করে আপনার ট্রানজেকশন আইডি
              দিন — অ্যাডমিন যাচাই করে ওয়ালেটে ক্রেডিট করবে।
            </p>

            {config ? (
              <ul className="grid grid-cols-2 gap-3 text-caption">
                <li className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3">
                  <span className="text-[11px] uppercase text-tcl-muted">
                    {BN.userCenter.deposit} — {BN.common.total}
                  </span>
                  <p className="text-sm font-semibold text-tcl-white">
                    ৳ {config.deposit.min.toLocaleString()} – ৳{" "}
                    {config.deposit.max.toLocaleString()}
                  </p>
                </li>
                <li className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3">
                  <span className="text-[11px] uppercase text-tcl-muted">
                    {BN.wallet.agentNumber}
                  </span>
                  <p className="text-sm font-semibold text-tcl-white">
                    {config.agentNumber}
                  </p>
                </li>
              </ul>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <PrimaryButton onClick={() => setOpen(true)} size="lg" icon="ArrowDownCircle">
                {BN.wallet.depositFunds}
              </PrimaryButton>
              <Link
                href="/profile/records?tab=deposit"
                className="inline-flex items-center gap-1.5 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 py-2 text-caption text-tcl-white hover:border-tcl-gold/40"
              >
                <ICONS.History aria-hidden="true" className="size-4" />
                {BN.userCenter.depositRecord}
              </Link>
            </div>
          </NeonCard>

          <NeonCard className="space-y-3" tone="gold">
            <SectionHeading title={BN.wallet.availableBalance} icon="Wallet" />
            <p className="font-display text-3xl uppercase text-tcl-gold">
              {wallet
                ? `${wallet.currency} ${wallet.availableBalance.toLocaleString()}`
                : "—"}
            </p>
            {wallet && wallet.reservedBalance > 0 ? (
              <p className="text-caption text-tcl-muted">
                ৳ {wallet.reservedBalance.toLocaleString()}{" "}
                পেন্ডিং উত্তোলনের জন্য সংরক্ষিত।
              </p>
            ) : null}
            <SecondaryButton
              onClick={() =>
                fetchMyWallet().then((r) => r.ok && setWallet(r.data))
              }
              icon="History"
              size="md"
            >
              {BN.userCenter.refreshBalance}
            </SecondaryButton>
          </NeonCard>
        </div>

        <TransactionList key={refreshKey} refreshKey={refreshKey} />

        <DepositModal
          open={open}
          onClose={() => setOpen(false)}
          onSubmitted={() => setRefreshKey((n) => n + 1)}
        />
      </div>
    </UserCenterShell>
  );
}
