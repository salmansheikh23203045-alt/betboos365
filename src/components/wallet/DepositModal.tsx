"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
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

type Step = "method" | "type" | "amount" | "confirm" | "submitted";

export function DepositModal({
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
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [step, setStep] = useState<Step>("method");
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType | null>(null);
  const [amount, setAmount] = useState("");
  const [txRef, setTxRef] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingMeta(true);
    Promise.all([fetchWalletConfig(), fetchWalletProviders()])
      .then(([cfg, prv]) => {
        if (cfg.ok) setConfig(cfg.data);
        if (prv.ok) setProviders(prv.data);
      })
      .finally(() => setLoadingMeta(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep("method");
      setProvider(null);
      setPaymentType(null);
      setAmount("");
      setTxRef("");
      setError(null);
      setCopied(false);
    }
  }, [open]);

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
  }

  async function copyAgentNumber() {
    if (!config) return;
    try {
      await navigator.clipboard.writeText(config.agentNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard denied — manual copy still visible */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deposit Funds"
      subtitle={stepSubtitle(step)}
      size="md"
    >
      {loadingMeta || !config || !providers ? (
        <div className="flex items-center justify-center py-10 text-tcl-muted">
          <ICONS.Loader2 aria-hidden="true" className="size-6 animate-spin" />
        </div>
      ) : step === "method" ? (
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
    </Modal>
  );
}

function stepSubtitle(step: Step) {
  switch (step) {
    case "method":
      return "Step 1 of 4 — Select your payment method";
    case "type":
      return "Step 2 of 4 — Choose payment type";
    case "amount":
      return "Step 3 of 4 — Enter amount";
    case "confirm":
      return "Step 4 of 4 — Complete payment and submit Transaction ID";
    case "submitted":
      return "Request received";
  }
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
    <div className="space-y-3">
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
              "group relative flex items-center gap-3 rounded-lg border bg-tcl-surface-2 px-3 py-3 text-left transition-all cursor-pointer tap-feedback",
              selected?.id === p.id
                ? "border-tcl-gold shadow-[0_0_18px_rgba(241,191,61,0.35)]"
                : "border-tcl-border-muted hover:border-tcl-red/60 hover:shadow-[0_0_14px_rgba(220,38,38,0.25)]",
            )}
          >
            <ProviderLogo provider={p} />
            <div className="min-w-0">
              <p className="font-semibold text-tcl-white">{p.name}</p>
              <p className="text-[11px] uppercase tracking-wider text-tcl-muted">
                {p.code}
              </p>
            </div>
            <ICONS.ChevronRight
              aria-hidden="true"
              className="ml-auto size-4 text-tcl-muted group-hover:text-tcl-white"
            />
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
    {
      value: "SEND_MONEY",
      label: "Send Money",
      description: "Personal mobile banking transfer.",
    },
    {
      value: "CASH_OUT",
      label: "Cash Out",
      description: "Pay from an agent cash-out counter.",
    },
  ];
  return (
    <div className="space-y-4">
      <div className="space-y-3">
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
              <ICONS.ArrowRight aria-hidden="true" className="size-4 text-tcl-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-tcl-white">{o.label}</p>
              <p className="text-caption text-tcl-muted">{o.description}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-between gap-3 pt-1">
        <SecondaryButton onClick={onBack} size="md" icon="ChevronLeft">
          Back
        </SecondaryButton>
      </div>
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
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tcl-gold font-bold">
            {config.currency}
          </span>
          <input
            id="dep-amount"
            type="number"
            min={config.deposit.min}
            max={config.deposit.max}
            step="1"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={`${config.deposit.min} – ${config.deposit.max}`}
            className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-14 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
          />
        </div>
        <p className="text-[11px] text-tcl-muted">
          Minimum deposit: <span className="text-tcl-white">{config.currency} {config.deposit.min.toLocaleString()}</span>.
          Maximum deposit: <span className="text-tcl-white">{config.currency} {config.deposit.max.toLocaleString()}</span>.
        </p>
      </div>
      <div className="flex justify-between gap-3 pt-1">
        <SecondaryButton onClick={onBack} size="md" icon="ChevronLeft">
          Back
        </SecondaryButton>
        <PrimaryButton
          onClick={onContinue}
          disabled={!valid}
          size="md"
          icon="ArrowRight"
        >
          Continue
        </PrimaryButton>
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
      <div className="rounded-lg border border-tcl-gold/40 bg-gradient-to-b from-tcl-gold/10 to-transparent p-4">
        <div className="flex items-center gap-3">
          <ProviderLogo provider={provider} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-heading-sm uppercase text-tcl-white">
              {provider.name}
            </p>
            <p className="text-caption text-tcl-gold font-semibold uppercase tracking-wider">
              {paymentType === "SEND_MONEY" ? "Send Money" : "Cash Out"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-caption uppercase text-tcl-muted">Amount</p>
            <p className="font-display text-heading-md uppercase text-tcl-gold">
              {currency} {amount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-caption font-semibold text-tcl-white">
          Agent Number — pay to this number
        </label>
        <div className="flex items-stretch gap-2">
          <div className="flex-1 inline-flex items-center rounded-md border border-tcl-gold/50 bg-tcl-black px-4 text-heading-md font-display tracking-widest text-tcl-gold">
            {agentNumber}
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-tcl-gold bg-tcl-gold/10 px-3 text-sm font-semibold text-tcl-gold hover:bg-tcl-gold/20 cursor-pointer tap-feedback"
            aria-label="Copy agent number"
          >
            {copied ? (
              <ICONS.Check aria-hidden="true" className="size-4" />
            ) : (
              <ICONS.Copy aria-hidden="true" className="size-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-[11px] text-tcl-muted">
          Open your {provider.name} app, send the exact amount to this number, then copy the Transaction ID below.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dep-ref" className="text-caption font-semibold text-tcl-white">
          Transaction ID
        </label>
        <input
          id="dep-ref"
          type="text"
          value={txRef}
          onChange={(e) => onTxRefChange(e.target.value.trim())}
          placeholder="e.g. 9A7B2CX1"
          maxLength={64}
          className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm uppercase tracking-wider text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
        />
        <p className="text-[11px] text-tcl-muted">
          The TrxID from your {provider.name} payment confirmation. Alphanumeric, 4–64 characters.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
          <ICONS.AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex justify-between gap-3 pt-1">
        <SecondaryButton onClick={onBack} size="md" icon="ChevronLeft" disabled={submitting}>
          Back
        </SecondaryButton>
        <PrimaryButton
          onClick={onSubmit}
          disabled={!refValid || submitting}
          size="md"
          icon={submitting ? undefined : "Send"}
        >
          {submitting ? "Submitting…" : "Submit Deposit Request"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function SubmittedStep({
  onClose,
  agentNumber,
}: {
  onClose: () => void;
  agentNumber: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <ICONS.CheckCircle2 aria-hidden="true" className="size-14 text-tcl-success" />
      <h3 className="font-display text-heading-md uppercase text-tcl-white">
        Deposit request received
      </h3>
      <p className="max-w-sm text-caption text-tcl-muted">
        Your request is now <span className="text-tcl-gold font-semibold">PENDING</span>.
        An admin will verify the payment to {agentNumber} and credit your wallet once
        confirmed. You can track the status in your Transaction History.
      </p>
      <PrimaryButton onClick={onClose} size="md">
        Done
      </PrimaryButton>
    </div>
  );
}
