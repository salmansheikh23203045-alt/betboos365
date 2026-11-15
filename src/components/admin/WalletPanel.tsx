"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/money";
import { LedgerRows, type LedgerEntry } from "./LedgerTable";

interface WalletView {
  userId: string;
  username: string;
  isPlayer: boolean;
  isAgent?: boolean;
  /** Players and agents; never admin-level accounts. */
  adjustable?: boolean;
  isActive: boolean;
  availableBalance: number;
  reservedBalance: number;
  recent: LedgerEntry[];
  adjustLimit: number;
}

/**
 * A player's wallet as staff see it, plus the manual adjustment form for
 * accounts holding wallet.adjust. The backend re-checks every rule: player
 * accounts only, not your own, never below zero, reason required, audited.
 */
export function WalletPanel({
  userId,
  username,
  canAdjust,
  onClose,
}: {
  userId: string;
  username: string;
  canAdjust: boolean;
  onClose: () => void;
}) {
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(null);
  // One key per confirmed submission: a double click or retry cannot apply it twice.
  const [key, setKey] = useState<string>("");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/admin/finance/users/${userId}/wallet`, { cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as { data?: WalletView; message?: string };
    if (!res.ok || !body.data) return setError(body.message ?? "Could not load the wallet.");
    setWallet(body.data);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = Math.round(Number(amount) * 100) / 100;
  const limit = wallet?.adjustLimit ?? 100_000;
  const formError =
    !amount ? null
    : !(value > 0) ? "Enter an amount above zero."
    : value > limit ? `The most one adjustment can move is ${formatBdt(limit)}.`
    : direction === "debit" && wallet && value > wallet.availableBalance ? "Debit is larger than the available balance."
    : null;
  const reasonOk = reason.trim().length >= 5;

  function review(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (formError || !amount || !reasonOk) return;
    setKey(crypto.randomUUID());
    setConfirming(true);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/finance/users/${userId}/wallet/adjust`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ direction, amount: value, reason: reason.trim(), idempotencyKey: key }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        data?: { balanceAfter: number };
        message?: string | string[];
      };
      if (!res.ok || !body.data) {
        const msg = Array.isArray(body.message) ? body.message[0] : body.message;
        setNotice({ ok: false, msg: msg ?? `Adjustment failed (${res.status}).` });
      } else {
        setNotice({
          ok: true,
          msg: `${direction === "credit" ? "Credited" : "Debited"} ${formatBdt(value)}. New available balance ${formatBdt(body.data.balanceAfter)}.`,
        });
        setAmount("");
        setReason("");
        await load();
      }
    } catch {
      setNotice({ ok: false, msg: "Network error. Nothing was changed unless the ledger shows it." });
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Wallet · ${username}`} size="lg">
      <div className="space-y-4">
        {error ? (
          <p role="alert" className="text-caption text-tcl-red-bright">{error}</p>
        ) : !wallet ? (
          <p className="text-caption text-tcl-muted">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2/60 p-3">
                <p className="text-[11px] uppercase text-tcl-muted">Available</p>
                <p className="font-display text-2xl tabular-nums text-tcl-gold">{formatBdt(wallet.availableBalance)}</p>
              </div>
              <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2/60 p-3">
                <p className="text-[11px] uppercase text-tcl-muted">Reserved (pending withdrawals)</p>
                <p className="font-display text-2xl tabular-nums text-tcl-white">{formatBdt(wallet.reservedBalance)}</p>
              </div>
            </div>

            {canAdjust && (wallet.adjustable ?? wallet.isPlayer) ? (
              <form onSubmit={review} className="space-y-3 rounded-md border border-tcl-border-muted p-3">
                <p className="text-sm font-semibold text-tcl-white">Manual adjustment</p>
                <div className="flex gap-2" role="radiogroup" aria-label="Direction">
                  {(["credit", "debit"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      role="radio"
                      aria-checked={direction === d}
                      onClick={() => setDirection(d)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm font-semibold capitalize",
                        direction === d
                          ? d === "credit" ? "border-tcl-gold bg-tcl-gold/15 text-tcl-gold" : "border-tcl-red bg-tcl-red/15 text-tcl-red-bright"
                          : "border-tcl-border-muted text-tcl-muted",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                  <label className="space-y-1 text-caption text-tcl-muted">
                    <span className="block">Amount (BDT)</span>
                    <input
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder="0.00"
                      className="h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm tabular-nums text-tcl-white"
                    />
                  </label>
                  <label className="space-y-1 text-caption text-tcl-muted">
                    <span className="block">Reason (recorded in the ledger and audit log)</span>
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={160}
                      placeholder="e.g. Deposit TrxID 8F3K… credited manually"
                      className="h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm text-tcl-white placeholder:text-tcl-muted"
                    />
                  </label>
                </div>
                {formError ? <p className="text-caption text-tcl-red-bright">{formError}</p> : null}
                {confirming ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-tcl-gold/40 bg-tcl-gold/10 p-2 text-sm text-tcl-white">
                    <span className="flex-1">
                      {direction === "credit" ? "Credit" : "Debit"} <strong>{formatBdt(value)}</strong>{" "}
                      {direction === "credit" ? "to" : "from"} <strong>{username}</strong>?
                    </span>
                    <button
                      type="button"
                      onClick={() => void submit()}
                      disabled={submitting}
                      className="rounded-md bg-tcl-gold px-3 py-1.5 text-sm font-bold text-tcl-black disabled:opacity-50"
                    >
                      {submitting ? "Saving…" : "Confirm"}
                    </button>
                    <button type="button" onClick={() => setConfirming(false)} disabled={submitting} className="px-2 text-sm text-tcl-muted">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={!amount || !reasonOk || Boolean(formError)}
                    className="rounded-md border border-tcl-gold/60 px-3 py-2 text-sm font-semibold text-tcl-gold hover:bg-tcl-gold/10 disabled:opacity-40"
                  >
                    Review adjustment
                  </button>
                )}
              </form>
            ) : !(wallet.adjustable ?? wallet.isPlayer) ? (
              <p className="text-caption text-tcl-muted">Admin-level accounts have no wallet to adjust.</p>
            ) : null}

            {notice ? (
              <p
                role="status"
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-caption",
                  notice.ok ? "border-tcl-success/40 bg-tcl-success/10 text-tcl-success" : "border-tcl-red/40 bg-tcl-red/10 text-tcl-red-bright",
                )}
              >
                {notice.ok ? <ICONS.Check aria-hidden="true" className="size-4" /> : <ICONS.AlertTriangle aria-hidden="true" className="size-4" />}
                {notice.msg}
              </p>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-tcl-white">Recent movements</p>
              {wallet.recent.length === 0 ? (
                <p className="text-caption text-tcl-muted">No wallet movements yet.</p>
              ) : (
                <div className="max-h-72 overflow-auto">
                  <LedgerRows rows={wallet.recent} showUser={false} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
