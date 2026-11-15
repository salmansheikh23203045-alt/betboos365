"use client";

import { useCallback, useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/wallet/StatusBadge";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { AdminWithdrawalRow, PageMeta } from "@/types/wallet";
import { formatBdt } from "@/lib/money";
import { AgentPlayersPanel, AgentReportPanel } from "./AgentPanels";
import { AgentWalletPanel } from "./AgentWalletPanel";

interface Summary {
  awaitingPayout: number;
  completed: number;
  completedAmount: number;
  currency: string;
  players?: number;
}

type Filter = "APPROVED" | "COMPLETED";

async function api<T>(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
  });
  const body = (await res.json().catch(() => ({}))) as { data?: T; message?: string };
  return { ok: res.ok, data: body.data, message: body.message ?? (res.ok ? undefined : "Request failed") };
}

type Tab = "payouts" | "wallet" | "players" | "reports";
const TABS: { value: Tab; label: string; icon: "ArrowUpCircle" | "Wallet" | "Users" | "TrendingUp" }[] = [
  { value: "payouts", label: "Payouts", icon: "ArrowUpCircle" },
  { value: "wallet", label: "Withdraw", icon: "Wallet" },
  { value: "players", label: "My Players", icon: "Users" },
  { value: "reports", label: "Reports", icon: "TrendingUp" },
];

/**
 * Agent Dashboard: payouts assigned to this agent, the agent's own players
 * (read-only) and the agent's own reports. Every call is scoped to the
 * signed-in agent by the backend.
 */
export function AgentDashboard() {
  const [tab, setTab] = useState<Tab>("payouts");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-heading-lg uppercase text-tcl-white">Agent Dashboard</h1>
        <nav aria-label="Agent sections" className="mt-3 grid grid-cols-4 gap-1 rounded-lg border border-tcl-border-muted bg-tcl-surface-2/60 p-1">
          {TABS.map((t) => {
            const Icon = ICONS[t.icon];
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                aria-current={tab === t.value ? "page" : undefined}
                className={cn(
                  // Icon above the label on phones so all four tabs fit; side by side from sm up.
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                  tab === t.value ? "bg-tcl-red/25 text-tcl-white" : "text-tcl-muted hover:text-tcl-white",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
      {tab === "payouts" ? (
        <PayoutsPanel />
      ) : tab === "wallet" ? (
        <AgentWalletPanel />
      ) : tab === "players" ? (
        <AgentPlayersPanel />
      ) : (
        <AgentReportPanel />
      )}
    </div>
  );
}

/** Withdrawals assigned to the signed-in agent for payout. */
function PayoutsPanel() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filter, setFilter] = useState<Filter>("APPROVED");
  const [rows, setRows] = useState<AdminWithdrawalRow[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminWithdrawalRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, sum] = await Promise.all([
      api<{ data: AdminWithdrawalRow[]; meta: PageMeta }>(`/api/agent/withdrawals?status=${filter}&page=${page}&limit=20`),
      api<Summary>("/api/agent/summary"),
    ]);
    setLoading(false);
    if (sum.ok && sum.data) setSummary(sum.data);
    if (!list.ok || !list.data) {
      setError(list.message ?? "Unable to load withdrawals");
      setRows([]);
      return;
    }
    setError(null);
    setRows(list.data.data);
    setMeta(list.data.meta);
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <p className="text-caption text-tcl-muted">
        Withdrawals assigned to you for payout. Send the money to the receiving number shown, then mark the
        withdrawal completed with the payout reference.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Awaiting payout" value={summary ? String(summary.awaitingPayout) : "—"} tone="pending" />
        <Tile label="Completed by you" value={summary ? String(summary.completed) : "—"} tone="ok" />
        <Tile label="Total paid out" value={summary ? formatBdt(summary.completedAmount) : "—"} tone="ok" />
        <Tile label="My players" value={summary ? String(summary.players ?? 0) : "—"} tone="ok" />
      </div>

      <div className="flex items-center gap-2 border-b border-tcl-border-muted">
        {(
          [
            ["APPROVED", "Awaiting payout"],
            ["COMPLETED", "Completed"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
            className={cn(
              "border-b-2 px-4 pb-2.5 text-sm font-semibold cursor-pointer",
              filter === value ? "border-tcl-gold text-tcl-gold" : "border-transparent text-tcl-muted hover:text-tcl-white",
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load()}
          className="mb-1.5 ml-auto rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-1.5 text-caption font-semibold text-tcl-white hover:border-tcl-gold/40 cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div role="alert" className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
          {error}
        </div>
      ) : null}

      {loading && rows.length === 0 ? (
        <NeonCard className="py-8 text-center text-tcl-muted">
          <ICONS.Loader2 aria-hidden="true" className="inline size-5 animate-spin" />
        </NeonCard>
      ) : rows.length === 0 ? (
        <NeonCard className="py-8 text-center text-caption text-tcl-muted">
          {filter === "APPROVED" ? "No withdrawals are assigned to you right now." : "You have not completed any withdrawals yet."}
        </NeonCard>
      ) : (
        <ul className="space-y-2">
          {rows.map((w) => (
            <li key={w.id}>
              <NeonCard className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-heading-md text-tcl-gold">
                    {w.currency} {w.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-tcl-white">
                    {w.provider?.name ?? "—"} · <span className="font-mono">{w.receivingPhone}</span>
                  </p>
                  <p className="text-[11px] text-tcl-muted">
                    #{w.id.slice(0, 8).toUpperCase()} · {w.user ? `@${w.user.username}` : "—"} ·{" "}
                    {new Date(w.createdAt).toLocaleString()}
                    {w.payoutReference ? ` · ref ${w.payoutReference}` : ""}
                  </p>
                </div>
                <StatusBadge status={w.status} />
                {w.status === "APPROVED" ? (
                  <PrimaryButton size="md" onClick={() => setSelected(w)}>
                    Process
                  </PrimaryButton>
                ) : null}
              </NeonCard>
            </li>
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-caption text-tcl-muted">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <SecondaryButton size="md" variant="outline" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
              Previous
            </SecondaryButton>
            <SecondaryButton size="md" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((n) => n + 1)}>
              Next
            </SecondaryButton>
          </div>
        </div>
      ) : null}

      {selected ? (
        <ProcessDialog
          row={selected}
          onClose={() => setSelected(null)}
          onDone={async () => {
            setSelected(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: "pending" | "ok" }) {
  return (
    <div className={cn("rounded-md border bg-tcl-surface-2 px-3 py-3", tone === "pending" ? "border-tcl-gold/40" : "border-tcl-success/40")}>
      <p className="text-[10px] uppercase tracking-wider text-tcl-muted">{label}</p>
      <p className="mt-1 font-display text-heading-lg text-tcl-white">{value}</p>
    </div>
  );
}

function ProcessDialog({ row, onClose, onDone }: { row: AdminWithdrawalRow; onClose: () => void; onDone: () => void }) {
  const [payoutReference, setPayoutReference] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"pay" | "return">("pay");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res =
      mode === "pay"
        ? await api(`/api/agent/withdrawals/${row.id}/complete`, {
            method: "POST",
            body: JSON.stringify({ payoutReference: payoutReference.trim() }),
          })
        : await api(`/api/agent/withdrawals/${row.id}/return`, {
            method: "POST",
            body: JSON.stringify({ note: note.trim() }),
          });
    setBusy(false);
    if (!res.ok) return setError(res.message ?? "Action failed");
    onDone();
  }

  const input =
    "w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none";

  return (
    <Modal open onClose={onClose} title="Process withdrawal" subtitle={`#${row.id.slice(0, 8).toUpperCase()}`} size="md">
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-caption">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-tcl-muted">Send</dt>
            <dd className="font-display text-heading-sm text-tcl-gold">
              {row.currency} {row.amount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-tcl-muted">Via</dt>
            <dd className="text-tcl-white">{row.provider?.name ?? "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[10px] uppercase tracking-wider text-tcl-muted">To (user&rsquo;s verified registered number)</dt>
            <dd className="font-mono text-base text-tcl-white">{row.receivingPhone}</dd>
          </div>
        </dl>

        {mode === "pay" ? (
          <label className="block space-y-1.5">
            <span className="text-caption font-semibold text-tcl-white">Payout reference</span>
            <input
              value={payoutReference}
              onChange={(e) => setPayoutReference(e.target.value)}
              placeholder="Transaction ID of the payout you sent"
              className={cn(input, "h-10 font-mono")}
            />
            <span className="block text-[11px] text-tcl-muted">
              Mark completed only after the money has actually been sent. This cannot be undone.
            </span>
          </label>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-caption font-semibold text-tcl-white">Why are you returning it?</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className={cn(input, "py-2")} />
            <span className="block text-[11px] text-tcl-muted">
              The withdrawal goes back to the admins unpaid. The user&rsquo;s funds stay reserved until an admin decides.
            </span>
          </label>
        )}

        {error ? (
          <div role="alert" className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "pay" ? "return" : "pay");
              setError(null);
            }}
            className="mr-auto text-caption text-tcl-muted underline hover:text-tcl-white cursor-pointer"
          >
            {mode === "pay" ? "Can't pay this one? Return it" : "Back to payout"}
          </button>
          <SecondaryButton variant="outline" size="md" onClick={onClose} disabled={busy}>
            Close
          </SecondaryButton>
          <PrimaryButton
            size="md"
            onClick={submit}
            disabled={busy || (mode === "pay" ? !payoutReference.trim() : note.trim().length < 3)}
          >
            {busy ? "Saving…" : mode === "pay" ? "Mark Completed" : "Return to admins"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
