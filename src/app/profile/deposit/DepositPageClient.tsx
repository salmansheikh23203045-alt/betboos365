"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DepositModal } from "@/components/wallet/DepositModal";
import { TransactionList } from "@/components/wallet/TransactionList";
import { ProviderLogo } from "@/components/wallet/ProviderLogo";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";
import {
  createDeposit,
  fetchMyWallet,
  fetchWalletConfig,
  fetchWalletProviders,
} from "@/lib/wallet-client";
import type { WalletView, WalletConfig, PaymentProvider, PaymentType } from "@/types/wallet";
import { cn } from "@/lib/cn";
import { notifyWalletChanged } from "@/components/wallet/WalletBalanceProvider";
import { SenderPhoneField, senderPhoneValid } from "@/components/wallet/SenderPhoneField";

type Step = "method" | "type" | "amount" | "confirm" | "submitted";

export function DepositPageClient() {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[] | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [step, setStep] = useState<Step>("method");
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
  const [amount, setAmount] = useState("");
  const [txRef, setTxRef] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    Promise.all([fetchMyWallet(), fetchWalletConfig(), fetchWalletProviders()])
      .then(([w, cfg, prv]) => {
        if (w.ok) setWallet(w.data);
        if (cfg.ok) setConfig(cfg.data);
        if (prv.ok) setProviders(prv.data);
      })
      .finally(() => setLoadingMeta(false));
  }, [refreshKey]);

  const amountNumber = useMemo(() => Number.parseFloat(amount), [amount]);
  const amountValid =
    config !== null &&
    Number.isFinite(amountNumber) &&
    amountNumber >= config.deposit.min &&
    amountNumber <= config.deposit.max;

  async function handleSubmit() {
    if (!provider || !paymentType || !txRef || !amountValid) return;
    setSubmitting(true);
    setError(null);
    const res = await createDeposit({
      providerCode: provider.code,
      paymentType,
      amount: amountNumber,
      transactionReference: txRef.trim(),
      ...(senderPhone.trim() ? { senderPhone: senderPhone.trim() } : {}),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setStep("submitted");
    setRefreshKey((n) => n + 1);
    notifyWalletChanged();
  }

  async function copyAgentNumber() {
    if (!config) return;
    try {
      await navigator.clipboard.writeText(config.agentNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  function resetDeposit() {
    setStep("method");
    setProvider(null);
    setPaymentType(null);
    setAmount("");
    setTxRef("");
    setSenderPhone("");
    setError(null);
    setCopied(false);
  }

  return (
    <UserCenterShell title={BN.userCenter.deposit}>
      {/* ── DESKTOP VIEW (100% UNTOUCHED ORIGINAL) ── */}
      <div className="hidden sm:block space-y-4">
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
            {stepSubtitleMobile(step)}
          </span>
        </div>

        <div className="rounded-lg border border-tcl-red/30 bg-tcl-surface-1 p-3 space-y-3">
          {loadingMeta || !config || !providers ? (
            <div className="flex justify-center py-6 text-tcl-muted">
              <ICONS.Loader2 className="size-5 animate-spin" />
            </div>
          ) : step === "method" ? (
            <div className="space-y-2">
              <p className="text-[11px] text-tcl-muted">Select method:</p>
              <div className="grid grid-cols-2 gap-2">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProvider(p);
                      setStep("type");
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border bg-tcl-surface-2 p-2 text-left cursor-pointer",
                      provider?.id === p.id ? "border-tcl-gold" : "border-tcl-border-muted"
                    )}
                  >
                    <ProviderLogo provider={p} size="sm" />
                    <span className="text-xs font-semibold text-tcl-white truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : step === "type" ? (
            <div className="space-y-2">
              {[
                { value: "SEND_MONEY" as PaymentType, label: "Send Money" },
                { value: "CASH_OUT" as PaymentType, label: "Cash Out" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setPaymentType(o.value);
                    setStep("amount");
                  }}
                  className="w-full rounded-lg border border-tcl-border-muted bg-tcl-surface-2 p-2.5 text-xs font-semibold text-tcl-white text-left"
                >
                  {o.label}
                </button>
              ))}
              <SecondaryButton onClick={() => setStep("method")} size="sm" fullWidth>Back</SecondaryButton>
            </div>
          ) : step === "amount" ? (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-tcl-white">Amount ({config.currency})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${config.deposit.min} – ${config.deposit.max}`}
                className="h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-xs text-tcl-white focus:outline-none"
              />
              <div className="flex gap-2 pt-1">
                <SecondaryButton onClick={() => setStep("type")} size="sm" fullWidth>Back</SecondaryButton>
                <PrimaryButton onClick={() => setStep("confirm")} disabled={!amountValid} size="sm" fullWidth>Continue</PrimaryButton>
              </div>
            </div>
          ) : step === "confirm" ? (
            <div className="space-y-2">
              <div className="rounded border border-tcl-gold/30 bg-tcl-surface-2 p-2 text-xs">
                <p className="text-tcl-gold font-bold">Agent: {config.agentNumber}</p>
                <button type="button" onClick={copyAgentNumber} className="mt-1 text-[10px] text-tcl-gold underline">
                  {copied ? "Copied!" : "Copy Agent Number"}
                </button>
              </div>
              <input
                type="text"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="Transaction ID (TrxID)"
                className="h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-xs text-tcl-white focus:outline-none"
              />
              <SenderPhoneField value={senderPhone} onChange={setSenderPhone} compact />
              {error && <p className="text-[10px] text-tcl-red-bright">{error}</p>}
              <div className="flex gap-2 pt-1">
                <SecondaryButton onClick={() => setStep("amount")} size="sm" fullWidth disabled={submitting}>Back</SecondaryButton>
                <PrimaryButton onClick={handleSubmit} disabled={!/^[A-Za-z0-9-]{4,64}$/.test(txRef.trim()) || !senderPhoneValid(senderPhone) || submitting} size="sm" fullWidth>
                  {submitting ? "Submitting..." : "Submit"}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <ICONS.CheckCircle2 className="size-10 text-tcl-success" />
              <p className="text-xs font-bold text-tcl-white">Request Received (Pending)</p>
              <PrimaryButton onClick={resetDeposit} size="sm">New Deposit</PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </UserCenterShell>
  );
}

function stepSubtitleMobile(step: Step) {
  switch (step) {
    case "method": return "Step 1/4";
    case "type": return "Step 2/4";
    case "amount": return "Step 3/4";
    case "confirm": return "Step 4/4";
    case "submitted": return "Done";
  }
}
