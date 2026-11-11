"use client";

import { useEffect, useMemo, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { fetchTransactions } from "@/lib/wallet-client";
import { StatusBadge } from "./StatusBadge";
import type { WalletTransaction, TransactionStatus } from "@/types/wallet";

type Filter =
  | { kind: "type"; value: "all" | "deposit" | "withdrawal" }
  | { kind: "status"; value: TransactionStatus };

const FILTERS: { label: string; filter: Filter }[] = [
  { label: "All", filter: { kind: "type", value: "all" } },
  { label: "Deposit", filter: { kind: "type", value: "deposit" } },
  { label: "Withdraw", filter: { kind: "type", value: "withdrawal" } },
  { label: "Pending", filter: { kind: "status", value: "PENDING" } },
  { label: "Approved", filter: { kind: "status", value: "APPROVED" } },
  { label: "Rejected", filter: { kind: "status", value: "REJECTED" } },
];

export function TransactionList({
  refreshKey = 0,
  pageSize = 20,
}: {
  refreshKey?: number;
  pageSize?: number;
}) {
  const [filter, setFilter] = useState<Filter>(FILTERS[0].filter);
  const [data, setData] = useState<WalletTransaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const params: Parameters<typeof fetchTransactions>[0] = { limit: pageSize };
    if (filter.kind === "type") params.type = filter.value;
    else params.status = filter.value;
    fetchTransactions(params)
      .then((res) => {
        if (!alive) return;
        if (!res.ok) {
          setError(res.message);
          setData([]);
        } else {
          setData(res.data.data);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [filter, pageSize, refreshKey]);

  return (
    <NeonCard className="animate-tab-fade space-y-4">
      <SectionHeading title="Transaction History" icon="History" />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active =
            (f.filter.kind === "type" && filter.kind === "type" && f.filter.value === filter.value) ||
            (f.filter.kind === "status" && filter.kind === "status" && f.filter.value === filter.value);
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(f.filter)}
              className={cn(
                "inline-flex items-center rounded-pill border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer tap-feedback",
                active
                  ? "border-tcl-gold bg-tcl-gold/15 text-tcl-gold"
                  : "border-tcl-border-muted bg-tcl-surface-2 text-tcl-muted hover:border-tcl-red/50 hover:text-tcl-white",
              )}
              aria-pressed={active}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
          <ICONS.AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex items-center justify-center py-10 text-tcl-muted">
          <ICONS.Loader2 aria-hidden="true" className="size-6 animate-spin" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2/50 px-4 py-6 text-center text-caption text-tcl-muted">
          No transactions yet.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                  <th className="pb-2 pr-3 font-semibold">ID</th>
                  <th className="pb-2 pr-3 font-semibold">Type</th>
                  <th className="pb-2 pr-3 font-semibold">Provider</th>
                  <th className="pb-2 pr-3 font-semibold">Amount</th>
                  <th className="pb-2 pr-3 font-semibold">Phone / Ref</th>
                  <th className="pb-2 pr-3 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {data.map((tx) => (
              <TxCardMobile key={tx.id} tx={tx} />
            ))}
          </ul>
        </>
      )}
    </NeonCard>
  );
}

function TxRow({ tx }: { tx: WalletTransaction }) {
  const isDeposit = tx.type === "DEPOSIT";
  return (
    <tr className="border-b border-tcl-border-muted/50 transition-colors hover:bg-tcl-surface-2/50 last:border-0">
      <td className="py-2.5 pr-3 text-[11px] uppercase text-tcl-muted">
        {tx.id.slice(0, 8).toUpperCase()}
      </td>
      <td className="py-2.5 pr-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 font-semibold",
            isDeposit ? "text-tcl-success" : "text-tcl-red-bright",
          )}
        >
          {isDeposit ? (
            <ICONS.ArrowDownCircle aria-hidden="true" className="size-4" />
          ) : (
            <ICONS.ArrowUpCircle aria-hidden="true" className="size-4" />
          )}
          {isDeposit ? "Deposit" : "Withdraw"}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-tcl-white">{tx.provider?.name ?? "—"}</td>
      <td className="py-2.5 pr-3 font-semibold text-tcl-gold">
        {tx.currency} {tx.amount.toLocaleString()}
      </td>
      <td className="py-2.5 pr-3 text-caption text-tcl-muted">
        {isDeposit
          ? tx.transactionReference
          : tx.receivingPhone}
      </td>
      <td className="py-2.5 pr-3 text-caption text-tcl-muted">
        {new Date(tx.createdAt).toLocaleDateString()}
        <span className="block text-[10px]">
          {new Date(tx.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </td>
      <td className="py-2.5">
        <StatusBadge status={tx.status} />
      </td>
    </tr>
  );
}

function TxCardMobile({ tx }: { tx: WalletTransaction }) {
  const isDeposit = tx.type === "DEPOSIT";
  return (
    <li className="rounded-md border border-tcl-border-muted bg-tcl-surface-2/60 p-3">
      <div className="flex items-center gap-2">
        {isDeposit ? (
          <ICONS.ArrowDownCircle aria-hidden="true" className="size-5 text-tcl-success" />
        ) : (
          <ICONS.ArrowUpCircle aria-hidden="true" className="size-5 text-tcl-red-bright" />
        )}
        <span className="font-semibold text-tcl-white">
          {isDeposit ? "Deposit" : "Withdraw"}
        </span>
        <span className="ml-auto">
          <StatusBadge status={tx.status} />
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <p className="font-display text-heading-sm uppercase text-tcl-gold">
          {tx.currency} {tx.amount.toLocaleString()}
        </p>
        <p className="text-caption text-tcl-muted">{tx.provider?.name ?? "—"}</p>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-tcl-muted">
        <span>
          {isDeposit ? `TrxID ${tx.transactionReference}` : `To ${tx.receivingPhone}`}
        </span>
        <span>
          {new Date(tx.createdAt).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      </div>
    </li>
  );
}
