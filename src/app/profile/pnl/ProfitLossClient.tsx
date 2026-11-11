"use client";

import { useEffect, useState } from "react";
import { UserCenterShell } from "@/components/profile/UserCenterShell";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";
import { fetchTransactions } from "@/lib/wallet-client";
import type { WalletTransaction } from "@/types/wallet";

const CATEGORIES = [
  { key: "all", label: BN.userCenter.allTab },
  { key: "slot", label: BN.userCenter.slotTab },
  { key: "fishing", label: BN.userCenter.fishingTab },
  { key: "live", label: BN.userCenter.liveTab },
  { key: "sports", label: BN.userCenter.sportsTab },
  { key: "poker", label: BN.userCenter.pokerTab },
  { key: "lottery", label: BN.userCenter.lotteryTab },
] as const;

const DATE_FILTERS = [
  { key: "today", label: BN.userCenter.today },
  { key: "yesterday", label: BN.userCenter.yesterday },
  { key: "seven", label: BN.userCenter.sevenDays },
] as const;

const COLS = [
  BN.common.date,
  BN.userCenter.depositCol,
  BN.userCenter.withdrawCol,
  BN.userCenter.bet,
  BN.userCenter.income,
  BN.userCenter.rebate,
  BN.userCenter.promotionCol,
  BN.userCenter.profitLossCol,
];

export function ProfitLossClient() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [date, setDate] = useState<(typeof DATE_FILTERS)[number]["key"]>("today");
  const [rows, setRows] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    fetchTransactions({ type: "all", limit: 200 }).then((r) => {
      if (r.ok) setRows(r.data.data);
    });
  }, []);

  const totalDeposits = rows
    .filter((r) => r.type === "DEPOSIT" && (r.status === "APPROVED" || r.status === "COMPLETED"))
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalWithdrawals = rows
    .filter(
      (r) => r.type === "WITHDRAWAL" && (r.status === "COMPLETED" || r.status === "APPROVED"),
    )
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <UserCenterShell title={BN.userCenter.profitLoss}>
      <NeonCard className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 border-b border-tcl-border-muted pb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={cn(
                "cursor-pointer border-b-2 pb-1.5 text-sm font-semibold transition-colors",
                cat === c.key
                  ? "border-tcl-gold text-tcl-gold"
                  : "border-transparent text-tcl-muted hover:text-tcl-white",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {DATE_FILTERS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDate(d.key)}
              className={cn(
                "inline-flex items-center gap-1.5 text-caption",
                date === d.key ? "text-tcl-red-bright" : "text-tcl-white/70",
              )}
            >
              <span
                className={cn(
                  "inline-block size-3.5 rounded-full border",
                  date === d.key
                    ? "border-tcl-red-bright bg-tcl-red-bright"
                    : "border-tcl-border-muted",
                )}
              />
              {d.label}
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
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-tcl-red px-3 py-1.5 text-caption font-semibold text-white"
          >
            {BN.userCenter.other}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-caption">
            <thead className="border-b border-tcl-border-muted text-[11px] uppercase tracking-wide text-tcl-muted">
              <tr>
                {COLS.map((c, i) => (
                  <th key={i} className="py-2 px-2 text-left font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={COLS.length}
                  className="py-20 text-center text-tcl-muted"
                >
                  {BN.userCenter.noData}
                </td>
              </tr>
            </tbody>
            <tfoot className="border-t border-tcl-border-muted">
              <tr className="text-tcl-white">
                <td className="py-2 px-2">{BN.common.total}</td>
                <td className="py-2 px-2">{totalDeposits.toLocaleString()}</td>
                <td className="py-2 px-2">
                  {totalWithdrawals.toLocaleString()}
                </td>
                <td className="py-2 px-2">0</td>
                <td className="py-2 px-2">0</td>
                <td className="py-2 px-2">0</td>
                <td className="py-2 px-2">0</td>
                <td className="py-2 px-2">0</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-center text-[11px] text-tcl-muted">
          মন্তব্য: উপরের তথ্য গ্রীনউইচ মান প্রকৃতি ভিত্তিতে। ডেসিমাল পয়েন্ট
        </p>
      </NeonCard>
    </UserCenterShell>
  );
}
