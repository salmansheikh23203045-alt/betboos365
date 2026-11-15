"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { TransactionList } from "@/components/wallet/TransactionList";
import { ProviderLogo } from "@/components/wallet/ProviderLogo";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";
import {
  createWithdrawal,
  fetchMyWallet,
  fetchPayoutAccount,
  type PayoutAccount,
  fetchWalletConfig,
  fetchWalletProviders,
} from "@/lib/wallet-client";
import type { WalletView, WalletConfig, PaymentProvider } from "@/types/wallet";
import { cn } from "@/lib/cn";
import { notifyWalletChanged } from "@/components/wallet/WalletBalanceProvider";
import { RegisteredNumberNotice } from "@/components/wallet/RegisteredNumberNotice";

export function WithdrawPageClient() {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[] | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  // Withdrawals always go to the account's verified registered number. It is
  // shown read-only; the server ignores any number a client might send.
  const [payout, setPayout] = useState<PayoutAccount | null>(null);
  const phone = payout?.phone ?? "";
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchPayoutAccount().then((res) => {
      if (res.ok) setPayout(res.data);
    });
    Promise.all([fetchMyWallet(), fetchWalletConfig(), fetchWalletProviders()])
      .then(([w, cfg, prv]) => {
        if (w.ok) setWallet(w.data);
        if (cfg.ok) setConfig(cfg.data);
        if (prv.ok) setProviders(prv.data);
      })
      .finally(() => setLoadingMeta(false));
  }, [refreshKey]);

  const amountNumber = useMemo(() => Number.parseFloat(amount), [amount]);
  const phoneValid = payout?.verified === true;
  const amountValid =
    config !== null &&
    Number.isFinite(amountNumber) &&
    amountNumber >= config.withdrawal.min &&
    amountNumber <= config.withdrawal.max;
  const balanceOk = wallet !== null && amountValid && amountNumber <= wallet.availableBalance;
  const canSubmit = provider !== null && phoneValid && amountValid && balanceOk && !submitting;

  async function handleSubmit() {
    if (!provider || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    const res = await createWithdrawal({
      providerCode: provider.code,
      amount: amountNumber,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccess(true);
    setRefreshKey((n) => n + 1);
    notifyWalletChanged();
    const w = await fetchMyWallet();
    if (w.ok) setWallet(w.data);
  }

  function resetWithdrawal() {
    setProvider(null);
    setAmount("");
    setError(null);
    setSuccess(false);
  }

  return (
    <UserCenterShell title={BN.userCenter.withdraw}>
      {/* ── DESKTOP VIEW (100% UNTOUCHED ORIGINAL) ── */}
      <div className="hidden sm:block space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_minmax(0,1fr)]">
          <NeonCard className="space-y-4">
            <SectionHeading
              title={BN.userCenter.withdraw}
              icon="ArrowUpCircle"
            />

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

            {/* The only number withdrawals are paid to, with the rule in Bengali. */}
            <RegisteredNumberNotice payout={payout} />

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

      {/* ── MOBILE VIEW (COMPACT, ZERO-SCROLL, FULL PAGE) ── */}
      <div className="block sm:hidden space-y-2 pb-2">
        <div className="flex items-center justify-between rounded-lg border border-tcl-gold/40 bg-tcl-surface-1 p-2.5">
          <div className="flex items-center gap-2">
            <ICONS.Wallet className="size-4 text-tcl-gold" />
            <span className="text-xs text-tcl-muted">Balance:</span>
            <span className="font-display text-sm text-tcl-gold">
              {wallet ? `${wallet.currency} ${wallet.availableBalance.toLocaleString()}` : "—"}
            </span>
          </div>
          <span className="text-[10px] text-tcl-gold/80 font-semibold uppercase">
            Withdrawal
          </span>
        </div>

        <div className="rounded-lg border border-tcl-red/30 bg-tcl-surface-1 p-3 space-y-3">
          {loadingMeta || !config || !providers || !wallet ? (
            <div className="flex justify-center py-6 text-tcl-muted">
              <ICONS.Loader2 className="size-5 animate-spin" />
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <ICONS.CheckCircle2 className="size-10 text-tcl-success" />
              <p className="text-xs font-bold text-tcl-white">Request Received (Pending)</p>
              <PrimaryButton onClick={resetWithdrawal} size="sm">New Request</PrimaryButton>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-tcl-white">Provider:</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {providers.map((p) => {
                    const active = provider?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProvider(p)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded border bg-tcl-surface-2 p-1.5 cursor-pointer",
                          active ? "border-tcl-gold" : "border-tcl-border-muted"
                        )}
                      >
                        <ProviderLogo provider={p} size="sm" />
                        <span className="text-[9px] font-semibold uppercase text-tcl-white truncate w-full text-center">
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <RegisteredNumberNotice payout={payout} compact />

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-tcl-white">Amount ({config.currency})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`${config.withdrawal.min} – ${config.withdrawal.max}`}
                  className="h-9 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-xs text-tcl-white focus:outline-none"
                />
              </div>

              {error && <p className="text-[10px] text-tcl-red-bright">{error}</p>}

              <div className="flex gap-2 pt-1">
                <SecondaryButton onClick={resetWithdrawal} size="sm" fullWidth disabled={submitting}>Cancel</SecondaryButton>
                <PrimaryButton onClick={handleSubmit} disabled={!canSubmit} size="sm" fullWidth>
                  {submitting ? "Submitting..." : "Submit"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserCenterShell>
  );
}
