"use client";

import { useCallback, useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/money";

export interface LedgerEntry {
  id: string;
  userId: string;
  username: string;
  type: string;
  amount: number;
  balanceAfter: number;
  referenceType: string | null;
  description: string | null;
  createdAt: string;
}

export const LEDGER_TYPES: { value: string; label: string; outflow: boolean }[] = [
  { value: "DEPOSIT_CREDIT", label: "Deposit credited", outflow: false },
  { value: "WITHDRAWAL_RESERVE", label: "Withdrawal hold", outflow: true },
  { value: "WITHDRAWAL_RELEASE", label: "Hold released", outflow: false },
  { value: "WITHDRAWAL_DEBIT", label: "Withdrawal paid", outflow: true },
  { value: "BONUS_CREDIT", label: "Bonus", outflow: false },
  { value: "ADJUSTMENT_CREDIT", label: "Adjustment credit", outflow: false },
  { value: "ADJUSTMENT_DEBIT", label: "Adjustment debit", outflow: true },
];
const META = new Map(LEDGER_TYPES.map((t) => [t.value, t]));

/**
 * Note on signs: a withdrawal hold moves money from available to reserved;
 * "Withdrawal paid" then settles the reserved part. Balance after is the
 * available balance after the entry.
 */
export function LedgerRows({ rows, showUser = true }: { rows: LedgerEntry[]; showUser?: boolean }) {
  return (
    <table className="w-full min-w-[640px] text-left text-sm">
      <thead className="text-caption uppercase text-tcl-muted">
        <tr>
          <th className="py-2 pr-3 font-semibold">When</th>
          {showUser ? <th className="py-2 pr-3 font-semibold">Player</th> : null}
          <th className="py-2 pr-3 font-semibold">Type</th>
          <th className="py-2 pr-3 text-right font-semibold">Amount</th>
          <th className="py-2 pr-3 text-right font-semibold">Balance after</th>
          <th className="py-2 font-semibold">Details</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const meta = META.get(r.type);
          const out = meta?.outflow ?? false;
          return (
            <tr key={r.id} className="border-t border-tcl-border-muted text-tcl-white">
              <td className="whitespace-nowrap py-2 pr-3 text-tcl-white/80">{new Date(r.createdAt).toLocaleString()}</td>
              {showUser ? <td className="py-2 pr-3 font-semibold">{r.username}</td> : null}
              <td className="whitespace-nowrap py-2 pr-3">{meta?.label ?? r.type}</td>
              <td className={cn("whitespace-nowrap py-2 pr-3 text-right tabular-nums font-semibold", out ? "text-tcl-red-bright" : "text-tcl-gold")}>
                {out ? "−" : "+"}
                {formatBdt(r.amount)}
              </td>
              <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums text-tcl-white/80">{formatBdt(r.balanceAfter)}</td>
              <td className="max-w-[260px] truncate py-2 text-caption text-tcl-muted" title={r.description ?? ""}>
                {r.description ?? "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Full wallet ledger across players, newest first, with type and player filters. */
export function LedgerTable() {
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [username, setUsername] = useState("");
  const [applied, setApplied] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ page: String(page), limit: "25" });
    if (type) qs.set("type", type);
    if (applied) qs.set("username", applied);
    try {
      const res = await fetch(`/api/admin/finance/ledger?${qs}`, { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as {
        data?: { data: LedgerEntry[]; meta: { total: number; page: number; totalPages: number } };
        message?: string;
      };
      if (!res.ok || !body.data) throw new Error(body.message ?? "Could not load the ledger.");
      setRows(body.data.data);
      setMeta(body.data.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the ledger.");
    } finally {
      setLoading(false);
    }
  }, [page, type, applied]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <NeonCard className="space-y-3 overflow-x-auto">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setApplied(username.trim());
        }}
      >
        <label className="space-y-1 text-caption text-tcl-muted">
          <span className="block">Type</span>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 text-sm text-tcl-white"
          >
            <option value="">All types</option>
            {LEDGER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-caption text-tcl-muted">
          <span className="block">Player username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="exact username"
            maxLength={32}
            className="h-9 w-44 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 text-sm text-tcl-white placeholder:text-tcl-muted"
          />
        </label>
        <button type="submit" className="h-9 rounded-md border border-tcl-gold/50 px-3 text-sm font-semibold text-tcl-gold hover:bg-tcl-gold/10">
          Filter
        </button>
        {applied || type ? (
          <button
            type="button"
            onClick={() => {
              setType("");
              setUsername("");
              setApplied("");
              setPage(1);
            }}
            className="h-9 px-2 text-sm text-tcl-muted hover:text-tcl-white"
          >
            Clear
          </button>
        ) : null}
        <span className="ml-auto text-caption text-tcl-muted">{meta.total.toLocaleString()} entries</span>
      </form>

      {error ? (
        <p role="alert" className="flex items-center gap-2 text-caption text-tcl-red-bright">
          <ICONS.AlertTriangle aria-hidden="true" className="size-4" /> {error}
        </p>
      ) : loading && rows.length === 0 ? (
        <p className="text-caption text-tcl-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-caption text-tcl-muted">No ledger entries match.</p>
      ) : (
        <LedgerRows rows={rows} />
      )}

      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2 text-caption">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-tcl-border-muted px-2 py-1 text-tcl-white disabled:opacity-40">
            Prev
          </button>
          <span className="text-tcl-muted">
            {meta.page} / {meta.totalPages}
          </span>
          <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-tcl-border-muted px-2 py-1 text-tcl-white disabled:opacity-40">
            Next
          </button>
        </div>
      ) : null}
    </NeonCard>
  );
}
