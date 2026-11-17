"use client";

import { useCallback, useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StatusBadge } from "@/components/wallet/StatusBadge";
import { ProviderLogo } from "@/components/wallet/ProviderLogo";
import { RegisteredNumberNotice, displayBdPhone } from "@/components/wallet/RegisteredNumberNotice";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/money";
import type { PayoutAccount } from "@/lib/wallet-client";
import type { PaymentProvider, WalletConfig, WalletView, WithdrawalTransaction } from "@/types/wallet";

async function call<T>(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
  });
  const body = (await res.json().catch(() => ({}))) as { data?: T; message?: string | string[] };
  const message = Array.isArray(body.message) ? body.message[0] : body.message;
  return res.ok && body.data !== undefined
    ? { ok: true as const, data: body.data }
    : { ok: false as const, message: message ?? "Request failed" };
}

/**
 * The agent's own wallet. The balance is credited by an admin (audited
 * adjustment); nothing is earned automatically. Withdrawals go only to the
 * agent's own verified registered number and are approved by an admin, with
 * the same backend rules as player withdrawals.
 */
export function AgentWalletPanel() {
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [payout, setPayout] = useState<PayoutAccount | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [config, setConfig] = useState<WalletConfig | null>(null);
  const [history, setHistory] = useState<WithdrawalTransaction[]>([]);
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [w, p, c, h] = await Promise.all([
      call<{ wallet: WalletView; payout: PayoutAccount }>("/api/agent/wallet"),
      call<PaymentProvider[]>("/api/me/wallet/providers"),
      call<WalletConfig>("/api/me/wallet/config"),
      call<{ data: WithdrawalTransaction[] }>("/api/agent/wallet/withdrawals?page=1&limit=10"),
    ]);
    if (w.ok) {
      setWallet(w.data.wallet);
      setPayout(w.data.payout);
    } else setError(w.message);
    if (p.ok) setProviders(p.data.filter((x) => x.isActive));
    if (c.ok) setConfig(c.data);
    if (h.ok) setHistory(h.data.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = Number(amount);
  const min = config?.withdrawal.min ?? 0;
  const max = config?.withdrawal.max ?? 0;
  const available = wallet?.availableBalance ?? 0;
  const pending = history.some((h) => h.status === "PENDING");
  const amountError =
    !amount ? null
    : !(value > 0) ? "Enter an amount."
    : config && (value < min || value > max) ? `Amount must be between ${formatBdt(min)} and ${formatBdt(max)}.`
    : value > available ? "Amount is more than your available balance."
    : null;
  const canSubmit = Boolean(provider && amount && !amountError && payout?.verified && !pending && !busy);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !provider) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    // No phone number is sent: the backend always pays the registered number.
    const r = await call<WithdrawalTransaction>("/api/agent/wallet/withdrawals", {
      method: "POST",
      body: JSON.stringify({ providerCode: provider.code, amount: value }),
    });
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setNotice(`Withdrawal of ${formatBdt(value)} requested to ${displayBdPhone(r.data.receivingPhone)}. An admin will review it.`);
    setAmount("");
    setProvider(null);
    await load();
  }

  const [agentNumberCopied, setAgentNumberCopied] = useState(false);
  const sharedAgentNumber = config?.agentSendMoneyCashoutNumber ?? config?.agentNumber ?? "Not configured";
  const [actionTab, setActionTab] = useState<"send" | "cashout">("send");

  async function copySharedNumber() {
    try {
      await navigator.clipboard.writeText(sharedAgentNumber);
      setAgentNumberCopied(true);
      window.setTimeout(() => setAgentNumberCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-tcl-gold/40 bg-tcl-surface-2 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-tcl-muted">Available</p>
          <p className="mt-1 font-display text-heading-lg tabular-nums text-tcl-gold">{wallet ? formatBdt(wallet.availableBalance) : "—"}</p>
        </div>
        <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-tcl-muted">Reserved (pending withdrawal)</p>
          <p className="mt-1 font-display text-heading-lg tabular-nums text-tcl-white">{wallet ? formatBdt(wallet.reservedBalance) : "—"}</p>
        </div>
      </div>
      <p className="text-[11px] text-tcl-muted">
        Your agent balance is credited by an admin. No commission is calculated automatically.
      </p>

      <NeonCard className="space-y-4 p-4">
        <h2 className="font-display text-heading-md uppercase text-tcl-white">Send Money & Cashout Number</h2>
        <p className="text-[11px] text-tcl-muted">
          Use the shared number below when performing Send Money or Cashout operations.
        </p>
        <div className="flex rounded-lg border border-tcl-border-muted bg-tcl-surface-2 p-1">
          <button
            type="button"
            onClick={() => setActionTab("send")}
            className={cn(
              "flex-1 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer",
              actionTab === "send" ? "bg-tcl-gold/20 text-tcl-gold border border-tcl-gold/40" : "text-tcl-muted hover:text-tcl-white",
            )}
          >
            Send Money
          </button>
          <button
            type="button"
            onClick={() => setActionTab("cashout")}
            className={cn(
              "flex-1 rounded-md py-2 text-xs font-semibold transition-colors cursor-pointer",
              actionTab === "cashout" ? "bg-tcl-gold/20 text-tcl-gold border border-tcl-gold/40" : "text-tcl-muted hover:text-tcl-white",
            )}
          >
            Cashout
          </button>
        </div>
        <div className="flex items-stretch gap-2">
          <div className="flex-1 inline-flex items-center rounded-md border border-tcl-gold/50 bg-tcl-black px-4 text-lg font-display tracking-widest text-tcl-gold">
            {sharedAgentNumber}
          </div>
          <button
            type="button"
            onClick={copySharedNumber}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-tcl-gold bg-tcl-gold/10 px-4 text-sm font-semibold text-tcl-gold hover:bg-tcl-gold/20 cursor-pointer"
          >
            {agentNumberCopied ? <ICONS.Check className="size-4" /> : <ICONS.Copy className="size-4" />}
            {agentNumberCopied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-[11px] text-tcl-muted">
          Action mode: <strong className="text-tcl-white">{actionTab === "send" ? "Send Money" : "Cashout"}</strong> (both actions use this exact shared configurable number).
        </p>
      </NeonCard>

      <NeonCard className="space-y-4">
        <h2 className="font-display text-heading-md uppercase text-tcl-white">Withdraw</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-caption font-semibold text-tcl-white">Payment method</p>
            <div className="grid grid-cols-4 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p)}
                  aria-pressed={provider?.id === p.id}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border bg-tcl-surface-2 p-2 cursor-pointer",
                    provider?.id === p.id ? "border-tcl-gold" : "border-tcl-border-muted",
                  )}
                >
                  <ProviderLogo provider={p} size="sm" />
                  <span className="w-full truncate text-center text-[10px] font-semibold uppercase text-tcl-white">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <RegisteredNumberNotice payout={payout} />

          <label className="block space-y-1.5">
            <span className="text-caption font-semibold text-tcl-white">Amount (BDT)</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder={config ? `${min} – ${max}` : ""}
              className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm tabular-nums text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
            />
            {amountError ? <span className="block text-[11px] text-tcl-red-bright">{amountError}</span> : null}
          </label>

          {pending ? (
            <p className="text-[11px] text-tcl-gold">You already have a pending withdrawal. Wait for an admin to review it.</p>
          ) : null}
          {error ? (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
              <ICONS.AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="rounded-md border border-tcl-success/40 bg-tcl-success/10 px-3 py-2 text-caption text-tcl-success">
              {notice}
            </p>
          ) : null}

          <PrimaryButton type="submit" fullWidth size="lg" disabled={!canSubmit}>
            {busy ? "Submitting…" : "Request Withdrawal"}
          </PrimaryButton>
        </form>
      </NeonCard>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-tcl-gold">My withdrawals</h3>
        {history.length === 0 ? (
          <p className="text-caption text-tcl-muted">No withdrawals yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2 rounded-md border border-tcl-border-muted bg-tcl-surface-2/60 px-3 py-2 text-caption">
                <span className="font-semibold tabular-nums text-tcl-white">{formatBdt(h.amount)}</span>
                <span className="text-tcl-muted">{h.provider?.name ?? "—"}</span>
                <span className="font-mono text-tcl-muted">{displayBdPhone(h.receivingPhone)}</span>
                <span className="ml-auto text-tcl-muted">{new Date(h.createdAt).toLocaleDateString()}</span>
                <StatusBadge status={h.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
