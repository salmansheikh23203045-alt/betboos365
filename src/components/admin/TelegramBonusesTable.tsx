"use client";

import { useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";
import { formatBdt } from "@/lib/money";

interface Row {
  id: string;
  username: string;
  telegramUserId: string | null;
  telegramUsername: string | null;
  amount: number;
  createdAt: string;
}
interface Meta {
  total: number;
  page: number;
  totalPages: number;
  totalPaid: number;
  configured: boolean;
  enabled: boolean;
  amount: number;
}

/** Read-only list of Telegram community bonuses the backend has paid. */
export function TelegramBonusesTable() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/admin/bonuses/telegram?page=${page}&limit=50`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { data?: { data: Row[]; meta: Meta }; message?: string };
        if (cancelled) return;
        if (!res.ok || !body.data) return setError(body.message ?? "Could not load bonuses.");
        setRows(body.data.data);
        setMeta(body.data.meta);
      })
      .catch(() => !cancelled && setError("Network error."));
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <NeonCard className="space-y-1">
          <p className="text-caption text-tcl-muted">Verification</p>
          <p className={meta?.enabled ? "font-semibold text-emerald-400" : "font-semibold text-tcl-red-bright"}>
            {meta ? (meta.enabled ? "Live (Telegram bot)" : meta.configured ? "Switched off" : "Not configured") : "—"}
          </p>
        </NeonCard>
        <NeonCard className="space-y-1">
          <p className="text-caption text-tcl-muted">Bonuses paid</p>
          <p className="font-display text-2xl text-tcl-white">{meta?.total ?? "—"}</p>
        </NeonCard>
        <NeonCard className="space-y-1">
          <p className="text-caption text-tcl-muted">Total credited</p>
          <p className="font-display text-2xl text-tcl-gold">{meta ? formatBdt(meta.totalPaid) : "—"}</p>
        </NeonCard>
      </div>

      <NeonCard className="space-y-3 overflow-x-auto">
        {error ? (
          <p role="alert" className="flex items-center gap-2 text-caption text-tcl-red-bright">
            <ICONS.AlertTriangle aria-hidden="true" className="size-4" /> {error}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-caption text-tcl-muted">No Telegram bonuses have been paid yet.</p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-caption uppercase text-tcl-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold">Player</th>
                <th className="py-2 pr-3 font-semibold">Telegram</th>
                <th className="py-2 pr-3 font-semibold">Amount</th>
                <th className="py-2 font-semibold">Credited</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-tcl-border-muted text-tcl-white">
                  <td className="py-2 pr-3 font-semibold">{r.username}</td>
                  <td className="py-2 pr-3 text-tcl-white/80">
                    {r.telegramUsername ? `@${r.telegramUsername}` : "—"}
                    <span className="ml-1 text-caption text-tcl-muted">#{r.telegramUserId}</span>
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-tcl-gold">{formatBdt(r.amount)}</td>
                  <td className="py-2 text-tcl-white/80">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta && meta.totalPages > 1 ? (
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
    </div>
  );
}
