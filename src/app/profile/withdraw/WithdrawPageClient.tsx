"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { TransactionList } from "@/components/wallet/TransactionList";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";
import { fetchMyWallet, fetchWalletConfig } from "@/lib/wallet-client";
import type { WalletView, WalletConfig } from "@/types/wallet";

export function WithdrawPageClient() {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchMyWallet().then((r) => r.ok && setWallet(r.data));
    fetchWalletConfig().then((r) => r.ok && setConfig(r.data));
  }, [refreshKey]);

  return (
    <UserCenterShell title={BN.userCenter.withdraw}>
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_minmax(0,1fr)]">
          <NeonCard className="space-y-4">
            <SectionHeading
              title={BN.userCenter.withdraw}
              icon="ArrowUpCircle"
            />

            {/* Empty wallet state matches reference screenshot 3 */}
            <div className="rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2 p-5 text-center">
              <ICONS.Wallet
                aria-hidden="true"
                className="mx-auto mb-2 size-10 text-tcl-muted"
              />
              <p className="text-caption text-tcl-white">
                {BN.userCenter.emptyWallet}
              </p>
              <p className="mt-1 text-[11px] text-tcl-muted">
                {BN.userCenter.withdrawNotice}
              </p>
              <div className="mt-4 flex justify-center">
                <PrimaryButton size="md" onClick={() => setOpen(true)} icon="Plus">
                  {BN.userCenter.addWallet}
                </PrimaryButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-caption">
              <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3">
                <span className="text-[11px] uppercase text-tcl-muted">
                  {BN.userCenter.centralWallet}
                </span>
                <p className="text-sm font-semibold text-tcl-white">
                  {wallet
                    ? `${wallet.currency} ${wallet.availableBalance.toLocaleString()}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3">
                <span className="text-[11px] uppercase text-tcl-muted">
                  {BN.userCenter.withdrawAmount}
                </span>
                <p className="text-sm font-semibold text-tcl-white">
                  {config
                    ? `৳ ${config.withdrawal.min.toLocaleString()} – ৳ ${config.withdrawal.max.toLocaleString()}`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <PrimaryButton
                onClick={() => setOpen(true)}
                size="lg"
                icon="ArrowUpCircle"
              >
                {BN.wallet.withdrawFunds}
              </PrimaryButton>
              <Link
                href="/profile/records?tab=withdraw"
                className="inline-flex items-center gap-1.5 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 py-2 text-caption text-tcl-white hover:border-tcl-gold/40"
              >
                <ICONS.History aria-hidden="true" className="size-4" />
                {BN.userCenter.withdrawRecord}
              </Link>
            </div>
          </NeonCard>

          <NeonCard className="space-y-3">
            <SectionHeading
              title={BN.userCenter.recentWithdrawals}
              icon="History"
            />
            <div className="rounded-md border border-dashed border-tcl-border-muted bg-tcl-surface-2 p-4 text-center text-caption text-tcl-muted">
              {BN.userCenter.noWithdrawalRequest}
              <p className="mt-2 text-[11px]">{BN.userCenter.empty}</p>
            </div>
            <ul className="space-y-1 text-[11px] text-tcl-muted">
              <li>
                <ICONS.Clock
                  aria-hidden="true"
                  className="mr-1 inline size-3 align-middle"
                />
                {BN.userCenter.withdrawTimes} {BN.userCenter.hours24}
              </li>
              <li>
                {BN.userCenter.remainingWithdrawals}:{" "}
                <span className="text-tcl-red-bright">100</span>
              </li>
            </ul>
          </NeonCard>
        </div>

        <TransactionList key={refreshKey} refreshKey={refreshKey} />

        <WithdrawModal
          open={open}
          onClose={() => setOpen(false)}
          onSubmitted={() => setRefreshKey((n) => n + 1)}
        />
      </div>
    </UserCenterShell>
  );
}
