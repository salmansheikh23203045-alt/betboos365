"use client";

import { useEffect, useMemo, useState } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { ProviderLogo } from "./ProviderLogo";
import {
  createDeposit,
  fetchWalletConfig,
  fetchWalletProviders,
} from "@/lib/wallet-client";
import type { PaymentProvider, PaymentType, WalletConfig } from "@/types/wallet";
import { BN } from "@/i18n/bn";
import { notifyWalletChanged } from "@/components/wallet/WalletBalanceProvider";

type Step = "method" | "type" | "amount" | "confirm" | "submitted";

export function DepositFlow({
  onClose,
  onSubmitted,
  fullPage = false,
}: {
  onClose?: () => void;
  onSubmitted?: () => void;
  fullPage?: boolean;
}) {
  const [providers, setProviders] = useState<PaymentProvider[] | null>(null);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [step, setStep] = useState<Step>("method");
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
  const [amount, setAmount] = useState("");
  const [txRef, setTxRef] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchWalletConfig(), fetchWalletProviders()])
      .then(([cfg, prv]) => {
        if (cfg.ok) setConfig(cfg.data);
        if (prv.ok) setProviders(prv.data);
      })
      .finally(() => setLoadingMeta(false));
  }, []);

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
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setStep("submitted");
    onSubmitted?.();
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

  if (loadingMeta || !config || !providers) {
    return (
      <div className="flex h-full items-center justify-center text-tcl-muted">
        <ICONS.Loader2 aria-hidden="true" className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", fullPage && "pb-6")}>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {step === "method" ? (
          <MethodStep
            providers={providers}
            selected={provider}
            onPick={(p) => {
              setProvider(p);
              setStep("type");
            }}
          />
        ) : step === "type" ? (
          <TypeStep
            onBack={() => setStep("method")}
            onPick={(t) => {
              setPaymentType(t);
              setStep("amount");
            }}
            selected={paymentType}
          />
        ) : step === "amount" ? (
          <AmountStep
            config={config}
            amount={amount}
            onAmountChange={setAmount}
            onBack={() => setStep("type")}
            onContinue={() => setStep("confirm")}
            valid={amountValid}
          />
        ) : step === "confirm" ? (
          <ConfirmStep
            provider={provider!}
            paymentType={paymentType!}
            amount={amountNumber}
            currency={config.currency}
            agentNumber={config.agentNumber}
            txRef={txRef}
            onTxRefChange={setTxRef}
            onCopy={copyAgentNumber}
            copied={copied}
            onBack={() => setStep("amount")}
            onSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
        ) : (
          <SubmittedStep onClose={onClose} agentNumber={config.agentNumber} />
        )}
      </div>
    </div>
  );
}

function MethodStep({
  providers,
  selected,
  onPick,
}: {
  providers: PaymentProvider[];
  selected: PaymentProvider | null;
  onPick: (p: PaymentProvider) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-caption text-tcl-muted">
        Choose the mobile banking service you will pay from.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-xl border bg-tcl-surface-2 p-3 text-center transition-all cursor-pointer tap-feedback",
              selected?.id === p.id
                ? "border-tcl-gold shadow-[0_0_18px_rgba(241,191,61,0.35)]"
                : "border-tcl-border-muted hover:border-tcl-red/60",
            )}
          >
            <ProviderLogo provider={p} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-tcl-white">{p.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TypeStep({
  onBack,
  onPick,
  selected,
}: {
  onBack: () => void;
  onPick: (t: PaymentType) => void;
  selected: PaymentType | null;
}) {
  const options: { value: PaymentType; label: string; description: string }[] = [
    { value: "SEND_MONEY", label: "Send Money", description: "Personal transfer." },
    { value: "CASH_OUT", label: "Cash Out", description: "Agent counter." },
  ];
  return (
    <div className="space-y-4">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className={cn(
            "flex w-full items-start gap-3 rounded-lg border bg-tcl-surface-2 px-4 py-3 text-left transition-all cursor-pointer tap-feedback",
            selected === o.value
              ? "border-tcl-gold shadow-[0_0_18px_rgba(241,191,61,0.35)]"
              : "border-tcl-border-muted hover:border-tcl-red/60",
          )}
        >
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-tcl-gold/40 bg-tcl-black">
            <ICONS.ArrowRight className="size-4 text-tcl-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-tcl-white">{o.label}</p>
            <p className="text-caption text-tcl-muted">{o.description}</p>
          </div>
        </button>
      ))}
      <SecondaryButton onClick={onBack} size="md" icon="ChevronLeft" fullWidth>
        Back
      </SecondaryButton>
    </div>
  );
}

function AmountStep({
  config,
  amount,
  onAmountChange,
  onBack,
  onContinue,
  valid,
}: {
  config: WalletConfig;
  amount: string;
  onAmountChange: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
  valid: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="dep-amount" className="text-caption font-semibold text-tcl-white">
          Amount ({config.currency})
        </label>
        <input
          id="dep-amount"
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="h-12 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm text-tcl-white"
        />
        <p className="text-[11px] text-tcl-muted">
          {config.deposit.min.toLocaleString()} – {config.deposit.max.toLocaleString()}
        </p>
      </div>
      <div className="flex gap-3">
        <SecondaryButton onClick={onBack} size="md" fullWidth>Back</SecondaryButton>
        <PrimaryButton onClick={onContinue} disabled={!valid} size="md" fullWidth>Continue</PrimaryButton>
      </div>
    </div>
  );
}

function ConfirmStep({
  provider,
  paymentType,
  amount,
  currency,
  agentNumber,
  txRef,
  onTxRefChange,
  onCopy,
  copied,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  provider: PaymentProvider;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  agentNumber: string;
  txRef: string;
  onTxRefChange: (v: string) => void;
  onCopy: () => void;
  copied: boolean;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const refValid = /^[A-Za-z0-9-]{4,64}$/.test(txRef.trim());
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-tcl-gold/40 p-4">
        <p className="text-caption text-tcl-gold">{provider.name} • {paymentType}</p>
        <p className="text-2xl text-tcl-white">{currency} {amount.toLocaleString()}</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-caption text-tcl-white">Agent Number</label>
        <div className="flex gap-2">
            <div className="flex-1 border rounded-md p-2 text-tcl-gold">{agentNumber}</div>
            <SecondaryButton onClick={onCopy} size="sm">{copied ? "Copied" : "Copy"}</SecondaryButton>
        </div>
      </div>
      <input
        value={txRef}
        onChange={(e) => onTxRefChange(e.target.value)}
        placeholder="Transaction ID"
        className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm text-tcl-white"
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-3">
        <SecondaryButton onClick={onBack} size="md" fullWidth>Back</SecondaryButton>
        <PrimaryButton onClick={onSubmit} disabled={!refValid || submitting} size="md" fullWidth>
            {submitting ? "Submitting..." : "Submit"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function SubmittedStep({ onClose, agentNumber }: { onClose?: () => void; agentNumber: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <ICONS.CheckCircle2 className="size-16 text-tcl-success" />
      <h3 className="text-2xl text-tcl-white">Request Received</h3>
      <PrimaryButton onClick={onClose} size="md" fullWidth>Done</PrimaryButton>
    </div>
  );
}
