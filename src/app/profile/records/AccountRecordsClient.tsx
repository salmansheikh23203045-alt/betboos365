"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { StatusBadge } from "@/components/wallet/StatusBadge";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";
import { fetchTransactions } from "@/lib/wallet-client";
import type {
  WalletTransaction,
  DepositTransaction,
  WithdrawalTransaction,
} from "@/types/wallet";

type TabKey = "transactions" | "deposit" | "withdraw";

const TABS: { key: TabKey; label: string }[] = [
  { key: "transactions", label: "লেনদেন রেকর্ড" },
  { key: "deposit", label: "জমা রেকর্ড" },
  { key: "withdraw", label: "উত্তোলন রেকর্ড" },
];

function RecordsInner() {
  const sp = useSearchParams();
  const initial = (sp.get("tab") as TabKey | null) ?? "transactions";
  const [tab, setTab] = useState<TabKey>(initial);
  const [rows, setRows] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "seven">(
    "today",
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const type =
      tab === "deposit" ? "deposit" : tab === "withdraw" ? "withdrawal" : "all";
    fetchTransactions({ type, limit: 50 }).then((res) => {
      if (!alive) return;
      if (res.ok) setRows(res.data.data);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [tab]);

  const headers =
    tab === "deposit" || tab === "withdraw"
      ? [
          BN.userCenter.txnOrderNo,
          BN.userCenter.txnTime,
          BN.userCenter.txnAmount,
          BN.common.status,
          "প্রোভাইডার",
          BN.userCenter.orderRef,
        ]
      : [
          BN.userCenter.txnOrderNo,
          BN.userCenter.txnTime,
          BN.userCenter.txnAmount,
          BN.userCenter.currentBalance,
          BN.userCenter.orderRef,
          BN.userCenter.content,
        ];

  function isDeposit(r: WalletTransaction): r is DepositTransaction {
    return r.type === "DEPOSIT";
  }
  function isWithdrawal(r: WalletTransaction): r is WithdrawalTransaction {
    return r.type === "WITHDRAWAL";
  }

  const filteredRows = rows.filter((r) => {
    if (tab === "deposit") return isDeposit(r);
    if (tab === "withdraw") return isWithdrawal(r);
    return true;
  });

  const totalAmount = filteredRows.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <UserCenterShell title={BN.userCenter.accountRecord}>
      <NeonCard className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-tcl-border-muted pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "cursor-pointer border-b-2 pb-1.5 text-sm font-semibold",
                tab === t.key
                  ? "border-tcl-gold text-tcl-gold"
                  : "border-transparent text-tcl-muted hover:text-tcl-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {(
            [
              ["today", BN.userCenter.today],
              ["yesterday", BN.userCenter.yesterday],
              ["seven", BN.userCenter.sevenDays],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDateFilter(k)}
              className={cn(
                "inline-flex items-center gap-1.5 text-caption",
                dateFilter === k ? "text-tcl-red-bright" : "text-tcl-white/70",
              )}
            >
              <span
                className={cn(
                  "inline-block size-3.5 rounded-full border",
                  dateFilter === k
                    ? "border-tcl-red-bright bg-tcl-red-bright"
                    : "border-tcl-border-muted",
                )}
              />
              {label}
            </button>
          ))}
          <label className="inline-flex items-center gap-2 text-caption text-tcl-white/80">
            <ICONS.Calendar
              aria-hidden="true"
              className="size-4 text-tcl-muted"
            />
            <input
              type="text"
              defaultValue={`${new Date().toISOString().slice(5, 10)}~${new Date().toISOString().slice(5, 10)}`}
              className="h-8 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 text-[11px] text-tcl-white"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-caption text-tcl-white/80">
            অর্ডার সন্দর্ভ সংখ্যা:
            <select
              className="h-8 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 text-[11px] text-tcl-white"
              defaultValue="all"
            >
              <option value="all">{BN.common.all}</option>
            </select>
          </label>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-tcl-red px-3 py-1.5 text-caption font-semibold text-white"
          >
            {BN.userCenter.other}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-caption">
            <thead className="border-b border-tcl-border-muted text-[11px] uppercase tracking-wide text-tcl-muted">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="py-2 px-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="py-20 text-center text-tcl-muted"
                  >
                    {BN.common.loading}
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="py-20 text-center text-tcl-muted"
                  >
                    {BN.userCenter.noData}
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-tcl-border-muted/50 text-tcl-white/90"
                  >
                    <td className="py-2 px-2 text-[11px]">{r.id.slice(0, 8)}</td>
                    <td className="py-2 px-2 text-[11px]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 font-semibold">
                      {r.currency} {Number(r.amount).toLocaleString()}
                    </td>
                    {tab === "transactions" ? (
                      <>
                        <td className="py-2 px-2">—</td>
                        <td className="py-2 px-2 text-[11px]">
                          {isDeposit(r) ? r.transactionReference : "—"}
                        </td>
                        <td className="py-2 px-2 text-[11px]">
                          {r.type === "DEPOSIT" ? BN.tx.deposit : BN.tx.withdraw}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-2">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-2 px-2 text-[11px]">
                          {r.provider?.name ?? "—"}
                        </td>
                        <td className="py-2 px-2 text-[11px]">
                          {isDeposit(r)
                            ? r.transactionReference
                            : isWithdrawal(r)
                              ? r.receivingPhone
                              : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t border-tcl-border-muted">
              <tr>
                <td className="py-2 px-2 text-tcl-white">{BN.common.total}</td>
                <td />
                <td className="py-2 px-2 text-tcl-white">
                  {totalAmount.toLocaleString()}
                </td>
                <td />
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </NeonCard>
    </UserCenterShell>
  );
}

export function AccountRecordsClient() {
  return (
    <Suspense
      fallback={
        <UserCenterShell title={BN.userCenter.accountRecord}>
          <NeonCard>
            <p className="py-20 text-center text-tcl-muted">
              {BN.common.loading}
            </p>
          </NeonCard>
        </UserCenterShell>
      }
    >
      <RecordsInner />
    </Suspense>
  );
}
