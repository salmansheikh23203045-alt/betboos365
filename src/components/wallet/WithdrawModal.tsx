"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { ProviderLogo } from "./ProviderLogo";
import {
  createWithdrawal,
  fetchMyWallet,
  fetchWalletConfig,
  fetchWalletProviders,
} from "@/lib/wallet-client";
import type {
  PaymentProvider,
  WalletConfig,
  WalletView,
} from "@/types/wallet";

const BD_PHONE = /^(?:\+?8801|01)[3-9]\d{8}$/;

export function WithdrawModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [providers, setProviders] = useState<PaymentProvider[] | null>(null);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingMeta(true);
    Promise.all([fetchWalletConfig(), fetchWalletProviders(), fetchMyWallet()])
      .then(([cfg, prv, w]) => {
        if (cfg.ok) setConfig(cfg.data);
        if (prv.ok) setProviders(prv.data);
        if (w.ok) setWallet(w.data);
      })
      .finally(() => setLoadingMeta(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setProvider(null);
      setPhone("");
      setAmount("");
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const amountNumber = useMemo(() => Number.parseFloat(amount), [amount]);
  const phoneValid = BD_PHONE.test(phone);
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
      receivingPhone: phone.trim(),
      amount: amountNumber,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccess(true);
    onSubmitted?.();
    // Refresh wallet so the user sees the reserved amount move.
    const w = await fetchMyWallet();
    if (w.ok) setWallet(w.data);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Withdraw Funds"
      subtitle={success ? "Request received" : "Request a payout to your mobile banking account"}
      size="md"
    >
      {loadingMeta || !config || !providers || !wallet ? (
        <div className="flex items-center justify-center py-10 text-tcl-muted">
          <ICONS.Loader2 aria-hidden="true" className="size-6 animate-spin" />
        </div>
      ) : success ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <ICONS.CheckCircle2 aria-hidden="true" className="size-14 text-tcl-success" />
          <h3 className="font-display text-heading-md uppercase text-tcl-white">
            Withdrawal request received
          </h3>
          <p className="max-w-sm text-caption text-tcl-muted">
            Your request is <span className="text-tcl-gold font-semibold">PENDING</span>.
            The requested amount is reserved from your available balance and will be
            released if the request is rejected. Track progress in Transaction History.
          </p>
          <PrimaryButton onClick={onClose} size="md">
            Done
          </PrimaryButton>
        </div>
      ) : (
        <div className="space-y-4">
          <BalanceBanner wallet={wallet} />

          <div className="space-y-1.5">
            <p className="text-caption font-semibold text-tcl-white">
              Mobile Banking Provider
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {providers.map((p) => {
                const active = provider?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border bg-tcl-surface-2 px-2 py-2.5 transition-all cursor-pointer tap-feedback",
                      active
                        ? "border-tcl-gold shadow-[0_0_14px_rgba(241,191,61,0.35)]"
                        : "border-tcl-border-muted hover:border-tcl-red/60",
                    )}
                    aria-pressed={active}
                  >
                    <ProviderLogo provider={p} size="sm" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-tcl-white">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wd-phone" className="text-caption font-semibold text-tcl-white">
              Your Receiving Phone Number
            </label>
            <div className="relative">
              <ICONS.Phone
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted"
              />
              <input
                id="wd-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.trim())}
                placeholder="01XXXXXXXXX"
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
              />
            </div>
            {phone && !phoneValid ? (
              <p className="text-[11px] text-tcl-red-bright">
                Enter a valid Bangladeshi mobile number (e.g. 01712345678).
              </p>
            ) : (
              <p className="text-[11px] text-tcl-muted">
                The payout will be sent to this number. Must match your {provider?.name ?? "provider"} account.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wd-amount" className="text-caption font-semibold text-tcl-white">
              Amount ({config.currency})
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tcl-gold font-bold">
                {config.currency}
              </span>
              <input
                id="wd-amount"
                type="number"
                min={config.withdrawal.min}
                max={config.withdrawal.max}
                step="1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${config.withdrawal.min} – ${config.withdrawal.max}`}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-14 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-tcl-muted">
              Min: <span className="text-tcl-white">{config.currency} {config.withdrawal.min.toLocaleString()}</span>.
              Max: <span className="text-tcl-white">{config.currency} {config.withdrawal.max.toLocaleString()}</span>.
            </p>
            {amount && amountValid && !balanceOk ? (
              <p className="text-[11px] text-tcl-red-bright">
                Amount exceeds your available balance.
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
              <ICONS.AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex justify-between gap-3 pt-1">
            <SecondaryButton onClick={onClose} size="md" disabled={submitting}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={!canSubmit}
              size="md"
              icon={submitting ? undefined : "Send"}
            >
              {submitting ? "Submitting…" : "Submit Withdrawal Request"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </Modal>
  );
}

function BalanceBanner({ wallet }: { wallet: WalletView }) {
  return (
    <div className="rounded-lg border border-tcl-gold/40 bg-gradient-to-b from-tcl-gold/10 to-transparent p-4">
      <div className="flex items-center gap-3">
        <ICONS.Wallet aria-hidden="true" className="size-6 text-tcl-gold" />
        <div className="min-w-0 flex-1">
          <p className="text-caption uppercase tracking-wider text-tcl-muted">
            Available Balance
          </p>
          <p className="font-display text-heading-lg uppercase text-tcl-gold">
            {wallet.currency} {wallet.availableBalance.toLocaleString()}
          </p>
        </div>
        {wallet.reservedBalance > 0 ? (
          <div className="text-right">
            <p className="text-caption uppercase tracking-wider text-tcl-muted">
              Reserved
            </p>
            <p className="font-semibold text-tcl-white">
              {wallet.currency} {wallet.reservedBalance.toLocaleString()}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
