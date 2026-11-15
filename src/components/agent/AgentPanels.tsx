"use client";

import { useCallback, useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { Modal } from "@/components/ui/Modal";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { StatusBadge } from "@/components/wallet/StatusBadge";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/money";

async function get<T>(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as { data?: T; message?: string };
  return res.ok && body.data ? { ok: true as const, data: body.data } : { ok: false as const, message: body.message ?? "Request failed" };
}

interface PlayerRow {
  id: string;
  username: string;
  phone: string | null;
  phoneVerified: boolean;
  isActive: boolean;
  joinedAt: string;
  deposits: { count: number; amount: number };
  withdrawals: { count: number; amount: number };
}

/** The agent's own players, read-only. Phone numbers arrive already masked. */
export function AgentPlayersPanel() {
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<PlayerRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) qs.set("search", search);
    const r = await get<{ data: PlayerRow[]; meta: { total: number; page: number; totalPages: number } }>(`/api/agent/players?${qs}`);
    setLoading(false);
    if (!r.ok) return setError(r.message);
    setError(null);
    setRows(r.data.data);
    setMeta(r.data.meta);
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <p className="text-caption text-tcl-muted">
        Players an admin has assigned to you. This view is read-only; contact an admin to change assignments.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <div className="relative flex-1">
          <ICONS.Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your players by username"
            maxLength={32}
            className="h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-9 pr-3 text-sm text-tcl-white placeholder:text-tcl-muted"
          />
        </div>
        <button type="submit" className="h-10 rounded-md border border-tcl-gold/50 px-4 text-sm font-semibold text-tcl-gold hover:bg-tcl-gold/10 cursor-pointer">
          Search
        </button>
      </form>

      {error ? (
        <p role="alert" className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">{error}</p>
      ) : loading && rows.length === 0 ? (
        <NeonCard className="py-8 text-center text-tcl-muted">
          <ICONS.Loader2 aria-hidden="true" className="inline size-5 animate-spin" />
        </NeonCard>
      ) : rows.length === 0 ? (
        <NeonCard className="py-8 text-center text-caption text-tcl-muted">
          {search ? "No players match that search." : "No players are assigned to you yet."}
        </NeonCard>
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="w-full rounded-lg border border-tcl-border-muted bg-tcl-surface-1 px-4 py-3 text-left transition-colors hover:border-tcl-gold/40 cursor-pointer"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-tcl-white">{p.username}</span>
                  {!p.isActive ? (
                    <span className="rounded-pill bg-tcl-red/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tcl-red-bright">Inactive</span>
                  ) : null}
                  <span className="font-mono text-caption text-tcl-muted">{p.phone ?? "no phone"}</span>
                  <span className={cn("text-[10px] font-bold uppercase", p.phoneVerified ? "text-tcl-success" : "text-tcl-muted")}>
                    {p.phoneVerified ? "verified" : "unverified"}
                  </span>
                  <span className="ml-auto text-caption text-tcl-muted">joined {new Date(p.joinedAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 text-caption">
                  <span className="text-tcl-muted">
                    Deposits <span className="tabular-nums text-tcl-gold">{formatBdt(p.deposits.amount)}</span> ({p.deposits.count})
                  </span>
                  <span className="text-tcl-muted">
                    Withdrawals <span className="tabular-nums text-tcl-white">{formatBdt(p.withdrawals.amount)}</span> ({p.withdrawals.count})
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-caption text-tcl-muted">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} players
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

      {open ? <PlayerDialog player={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

interface Movement {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  provider: string;
  createdAt: string;
}

function PlayerDialog({ player, onClose }: { player: PlayerRow; onClose: () => void }) {
  const [detail, setDetail] = useState<{ deposits: Movement[]; withdrawals: Movement[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void get<{ deposits: Movement[]; withdrawals: Movement[] }>(`/api/agent/players/${player.id}`).then((r) =>
      r.ok ? setDetail(r.data) : setError(r.message),
    );
  }, [player.id]);

  const list = (title: string, items: Movement[]) => (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-tcl-white">{title}</p>
      {items.length === 0 ? (
        <p className="text-caption text-tcl-muted">None yet.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-2 rounded-md border border-tcl-border-muted bg-tcl-surface-2/60 px-3 py-2 text-caption">
              <span className="tabular-nums font-semibold text-tcl-white">{formatBdt(m.amount)}</span>
              <span className="text-tcl-muted">{m.provider}</span>
              <span className="ml-auto text-tcl-muted">{new Date(m.createdAt).toLocaleDateString()}</span>
              <StatusBadge status={m.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Modal open onClose={onClose} title={player.username} subtitle={player.phone ?? undefined} size="md">
      {error ? (
        <p role="alert" className="text-caption text-tcl-red-bright">{error}</p>
      ) : !detail ? (
        <p className="text-caption text-tcl-muted">Loading…</p>
      ) : (
        <div className="space-y-4">
          {list("Recent deposits", detail.deposits)}
          {list("Recent withdrawals", detail.withdrawals)}
        </div>
      )}
    </Modal>
  );
}

interface Report {
  days: number;
  payouts: {
    allTime: { count: number; amount: number };
    period: { count: number; amount: number };
    awaiting: { count: number; amount: number };
    returnedInPeriod: number;
  };
  players: {
    total: number;
    joinedInPeriod: number;
    depositsInPeriod: { count: number; amount: number };
    withdrawalsInPeriod: { count: number; amount: number };
  };
  series: { date: string; amount: number; count: number }[];
  commission: { configured: boolean; note: string };
}

/** The agent's own payout and player figures for a period. */
export function AgentReportPanel() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setReport(null);
    void get<Report>(`/api/agent/report?days=${days}`).then((r) => {
      if (!live) return;
      if (r.ok) {
        setReport(r.data);
        setError(null);
      } else setError(r.message);
    });
    return () => {
      live = false;
    };
  }, [days]);

  const max = report ? Math.max(0, ...report.series.map((s) => s.amount)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-caption text-tcl-muted">Your figures only.</p>
        <div className="ml-auto flex overflow-hidden rounded-pill border border-tcl-border-muted text-[11px]">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={cn("px-3 py-1.5 font-semibold cursor-pointer", days === d ? "bg-tcl-red/30 text-tcl-red-bright" : "text-tcl-muted hover:text-tcl-white")}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">{error}</p>
      ) : !report ? (
        <NeonCard className="py-8 text-center text-tcl-muted">
          <ICONS.Loader2 aria-hidden="true" className="inline size-5 animate-spin" />
        </NeonCard>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tcl-gold">Payouts</h2>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Stat label={`Paid in ${report.days} days`} value={formatBdt(report.payouts.period.amount)} sub={`${report.payouts.period.count} payouts`} />
              <Stat label="Paid all time" value={formatBdt(report.payouts.allTime.amount)} sub={`${report.payouts.allTime.count} payouts`} />
              <Stat label="Awaiting your payout" value={formatBdt(report.payouts.awaiting.amount)} sub={`${report.payouts.awaiting.count} assigned`} />
              <Stat label={`Returned in ${report.days} days`} value={String(report.payouts.returnedInPeriod)} sub="sent back to admins" />
            </div>
            {max > 0 ? (
              <div className="space-y-1">
                <div
                  role="img"
                  aria-label={`Your daily payouts over ${report.days} days`}
                  className="flex h-32 items-end gap-[2px] rounded-md border border-tcl-border-muted bg-tcl-surface-2/40 px-2 pb-1 pt-2"
                >
                  {report.series.map((s) => (
                    <span
                      key={s.date}
                      title={`${s.date}: ${formatBdt(s.amount)} (${s.count})`}
                      className="min-w-0 flex-1 rounded-t-sm bg-tcl-gold"
                      style={{ height: `${(s.amount / max) * 100}%`, minHeight: s.amount > 0 ? 2 : 0 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-tcl-muted">
                  <span>{report.series[0]?.date}</span>
                  <span>{report.series.at(-1)?.date}</span>
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-tcl-border-muted p-4 text-center text-caption text-tcl-muted">
                No payouts completed in this period.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-tcl-gold">My players</h2>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Stat label="Assigned players" value={String(report.players.total)} sub={`${report.players.joinedInPeriod} joined in period`} />
              <Stat label="Their deposits" value={formatBdt(report.players.depositsInPeriod.amount)} sub={`${report.players.depositsInPeriod.count} approved`} />
              <Stat label="Their withdrawals" value={formatBdt(report.players.withdrawalsInPeriod.amount)} sub={`${report.players.withdrawalsInPeriod.count} paid`} />
              <Stat label="Commission" value="Not set up" sub="no commission rules" />
            </div>
            <p className="text-[11px] text-tcl-muted">{report.commission.note}</p>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-3">
      <p className="text-[10px] uppercase tracking-wider text-tcl-muted">{label}</p>
      <p className="mt-1 truncate font-display text-xl tabular-nums text-tcl-white">{value}</p>
      <p className="text-[11px] text-tcl-muted">{sub}</p>
    </div>
  );
}
