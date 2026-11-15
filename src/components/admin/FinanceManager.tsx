"use client";

import { useCallback, useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Modal } from "@/components/ui/Modal";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/wallet/StatusBadge";
import type {
  AdminDepositRow,
  AdminWithdrawalRow,
  PageMeta,
  TransactionStatus,
} from "@/types/wallet";

type Tab = "deposits" | "withdrawals";

const STATUS_OPTIONS: { label: string; value: TransactionStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Rejected", value: "REJECTED" },
];

// Each half is null when the signed-in account may not view that side.
interface Summary {
  deposits: { pending: number; approved: number; rejected: number } | null;
  withdrawals: { pending: number; approved: number; completed: number; rejected: number } | null;
}

interface FinanceManagerProps {
  providers: { code: string; name: string }[];
  /** Show one side only (Deposit Management / Withdrawal Management pages). */
  only?: Tab;
  /** The account's effective permissions. Buttons are hidden without them; the API enforces them. */
  permissions: string[];
}

async function parseJson<T>(res: Response) {
  const body = (await res.json().catch(() => ({}))) as { data?: T; message?: string };
  return { ok: res.ok, data: body.data, message: body.message };
}

export function FinanceManager({ providers, only, permissions }: FinanceManagerProps) {
  const [tab, setTab] = useState<Tab>(only ?? "deposits");
  const [status, setStatus] = useState<TransactionStatus | "">("PENDING");
  const [providerCode, setProviderCode] = useState("");
  const [search, setSearch] = useState("");
  const [deposits, setDeposits] = useState<AdminDepositRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selected, setSelected] = useState<
    | { kind: "deposit"; row: AdminDepositRow }
    | { kind: "withdrawal"; row: AdminWithdrawalRow }
    | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (providerCode) qs.set("providerCode", providerCode);
    if (search.trim()) qs.set("search", search.trim());
    qs.set("page", String(page));
    qs.set("limit", "20");
    const endpoint = tab === "deposits" ? "/api/admin/finance/deposits" : "/api/admin/finance/withdrawals";
    try {
      const res = await fetch(`${endpoint}?${qs}`, { cache: "no-store" });
      const parsed = await parseJson<{
        data: AdminDepositRow[] | AdminWithdrawalRow[];
        meta: PageMeta;
      }>(res);
      if (!parsed.ok || !parsed.data) {
        setError(parsed.message ?? "Unable to load");
        setDeposits([]);
        setWithdrawals([]);
        setMeta(null);
      } else {
        if (tab === "deposits") {
          setDeposits(parsed.data.data as AdminDepositRow[]);
          setWithdrawals([]);
        } else {
          setWithdrawals(parsed.data.data as AdminWithdrawalRow[]);
          setDeposits([]);
        }
        setMeta(parsed.data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, status, providerCode, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/finance/summary", { cache: "no-store" })
      .then((res) => parseJson<Summary>(res))
      .then((parsed) => {
        if (alive && parsed.ok && parsed.data) setSummary(parsed.data);
      });
    return () => {
      alive = false;
    };
  }, [tab, deposits.length, withdrawals.length]);

  const onTabChange = (next: Tab) => {
    setTab(next);
    setPage(1);
    setStatus("PENDING");
  };

  return (
    <div className="space-y-4">
      {summary ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {summary.deposits && only !== "withdrawals" ? (
            <>
              <SummaryTile label="Pending Deposits" value={summary.deposits.pending} tone="pending" icon="ArrowDownCircle" />
              <SummaryTile label="Approved Deposits" value={summary.deposits.approved} tone="ok" icon="CheckCircle2" />
            </>
          ) : null}
          {summary.withdrawals && only !== "deposits" ? (
            <>
              <SummaryTile label="Pending Withdrawals" value={summary.withdrawals.pending} tone="pending" icon="ArrowUpCircle" />
              {only === "withdrawals" ? (
                <SummaryTile label="Awaiting Payout" value={summary.withdrawals.approved} tone="pending" icon="ArrowUpCircle" />
              ) : null}
              <SummaryTile label="Completed Withdrawals" value={summary.withdrawals.completed} tone="ok" icon="CheckCircle2" />
            </>
          ) : null}
        </div>
      ) : null}

      {only ? null : (
      <div className="flex gap-2 border-b border-tcl-border-muted">
        {([
          ["deposits", "Deposits"],
          ["withdrawals", "Withdrawals"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => onTabChange(k)}
            className={cn(
              "border-b-2 px-4 pb-2.5 text-sm font-semibold transition-all cursor-pointer",
              tab === k
                ? "border-tcl-gold text-tcl-gold"
                : "border-transparent text-tcl-muted hover:text-tcl-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      <div className="grid gap-2 md:grid-cols-[1fr_200px_200px_auto]">
        <div className="relative">
          <ICONS.Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={
              tab === "deposits"
                ? "Search username, transaction ID…"
                : "Search username, phone…"
            }
            className="h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-9 pr-3 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TransactionStatus | "");
            setPage(1);
          }}
          className="h-10 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm text-tcl-white focus:border-tcl-gold focus:outline-none"
        >
          {STATUS_OPTIONS.filter((o) => tab === "withdrawals" || o.value !== "COMPLETED").map(
            (o) => (
              <option key={o.value} value={o.value}>
                Status: {o.label}
              </option>
            ),
          )}
        </select>
        <select
          value={providerCode}
          onChange={(e) => {
            setProviderCode(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm text-tcl-white focus:border-tcl-gold focus:outline-none"
        >
          <option value="">Provider: All</option>
          {providers.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
        <SecondaryButton size="md" variant="outline" onClick={() => load()}>
          <ICONS.Filter aria-hidden="true" className="size-4" /> Refresh
        </SecondaryButton>
      </div>

      {error ? (
        <NeonCard className="p-3 text-center text-tcl-red-bright text-caption">
          {error}
        </NeonCard>
      ) : null}

      <NeonCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                <th className="py-3 pl-4 pr-3 font-semibold">User</th>
                <th className="py-3 pr-3 font-semibold">Provider</th>
                <th className="py-3 pr-3 font-semibold">Amount</th>
                <th className="py-3 pr-3 font-semibold">
                  {tab === "deposits" ? "TrxID" : "Phone"}
                </th>
                <th className="py-3 pr-3 font-semibold">Submitted</th>
                <th className="py-3 pr-3 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-tcl-muted">
                    <ICONS.Loader2 aria-hidden="true" className="inline size-5 animate-spin" />
                  </td>
                </tr>
              ) : tab === "deposits" ? (
                deposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-tcl-muted">
                      No deposits match the filter.
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-tcl-border-muted/50 align-top hover:bg-tcl-surface-2/40"
                    >
                      <td className="py-3 pl-4 pr-3 text-tcl-white">
                        {d.user ? `@${d.user.username}` : "—"}
                        <span className="block text-[10px] text-tcl-muted">
                          #{d.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-tcl-white">
                        {d.provider?.name ?? "—"}
                        <span className="block text-[10px] text-tcl-muted">
                          {d.paymentType === "SEND_MONEY" ? "Send Money" : "Cash Out"}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-semibold text-tcl-gold">
                        {d.currency} {d.amount.toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 font-mono text-[11px] text-tcl-white">
                        {d.transactionReference}
                        {d.senderPhone ? <span className="block text-[10px] text-tcl-muted">from {d.senderPhone}</span> : null}
                      </td>
                      <td className="py-3 pr-3 text-[11px] text-tcl-muted">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => setSelected({ kind: "deposit", row: d })}
                          className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 py-1 text-[11px] font-semibold text-tcl-white hover:border-tcl-gold/40 cursor-pointer"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-tcl-muted">
                    No withdrawals match the filter.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-tcl-border-muted/50 align-top hover:bg-tcl-surface-2/40"
                  >
                    <td className="py-3 pl-4 pr-3 text-tcl-white">
                      {w.user ? `@${w.user.username}` : "—"}
                      {w.requesterIsAgent ? (
                        <span className="ml-1.5 rounded-pill bg-tcl-red/20 px-1.5 py-0.5 align-middle text-[9px] font-bold uppercase text-tcl-red-bright">
                          Agent
                        </span>
                      ) : null}
                      <span className="block text-[10px] text-tcl-muted">
                        #{w.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-tcl-white">{w.provider?.name ?? "—"}</td>
                    <td className="py-3 pr-3 font-semibold text-tcl-gold">
                      {w.currency} {w.amount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-tcl-white">
                      {w.receivingPhone}
                    </td>
                    <td className="py-3 pr-3 text-[11px] text-tcl-muted">
                      {new Date(w.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={w.status} />
                      {w.assignedAgent ? (
                        <span className="mt-1 block text-[10px] text-tcl-muted">
                          Agent: @{w.assignedAgent.username}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => setSelected({ kind: "withdrawal", row: w })}
                        className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 py-1 text-[11px] font-semibold text-tcl-white hover:border-tcl-gold/40 cursor-pointer"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeonCard>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between text-caption text-tcl-muted">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((n) => Math.max(1, n - 1))}
              className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-1 text-tcl-white disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((n) => n + 1)}
              className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-1 text-tcl-white disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {selected ? (
        <DecisionDialog
          selection={selected}
          permissions={permissions}
          onClose={() => setSelected(null)}
          onCompleted={async () => {
            setSelected(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "pending" | "ok";
  icon: "ArrowDownCircle" | "ArrowUpCircle" | "CheckCircle2";
}) {
  const Icon = ICONS[icon];
  return (
    <div
      className={cn(
        "rounded-md border bg-tcl-surface-2 px-3 py-3",
        tone === "pending" ? "border-tcl-gold/40" : "border-tcl-success/40",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          aria-hidden="true"
          className={cn("size-5", tone === "pending" ? "text-tcl-gold" : "text-tcl-success")}
        />
        <span className="text-[10px] uppercase tracking-wider text-tcl-muted">{label}</span>
      </div>
      <p className="mt-1 font-display text-heading-lg uppercase text-tcl-white">{value}</p>
    </div>
  );
}

function DecisionDialog({
  selection,
  permissions,
  onClose,
  onCompleted,
}: {
  permissions: string[];
  selection:
    | { kind: "deposit"; row: AdminDepositRow }
    | { kind: "withdrawal"; row: AdminWithdrawalRow };
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [adminNote, setAdminNote] = useState(selection.row.adminNote ?? "");
  const [payoutReference, setPayoutReference] = useState(
    selection.kind === "withdrawal" ? selection.row.payoutReference ?? "" : "",
  );
  const [busy, setBusy] = useState<"approve" | "reject" | "complete" | "assign" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<{ id: string; username: string }[]>([]);
  const [agentId, setAgentId] = useState(
    selection.kind === "withdrawal" ? selection.row.assignedAgent?.id ?? "" : "",
  );

  const canReview = permissions.includes(
    selection.kind === "deposit" ? "deposits.review" : "withdrawals.review",
  );
  const canComplete = permissions.includes("withdrawals.complete");
  const canAssign = permissions.includes("withdrawals.assign");
  const showAssign =
    canAssign && selection.kind === "withdrawal" && selection.row.status === "APPROVED";

  useEffect(() => {
    if (!showAssign) return;
    let alive = true;
    fetch("/api/admin/finance/agents", { cache: "no-store" })
      .then((res) => parseJson<{ id: string; username: string }[]>(res))
      .then((parsed) => {
        if (alive && parsed.ok && parsed.data) setAgents(parsed.data);
      });
    return () => {
      alive = false;
    };
  }, [showAssign]);

  async function assign(next: string | null) {
    setBusy("assign");
    setError(null);
    const res = await fetch(`/api/admin/finance/withdrawals/${selection.row.id}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: next }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? "Could not assign");
      return;
    }
    onCompleted();
  }

  const isTerminal =
    selection.row.status === "REJECTED" || selection.row.status === "COMPLETED";
  const isApprovedWithdrawal =
    selection.kind === "withdrawal" && selection.row.status === "APPROVED";

  async function run(action: "approve" | "reject" | "complete") {
    setBusy(action);
    setError(null);
    const endpoint =
      selection.kind === "deposit"
        ? `/api/admin/finance/deposits/${selection.row.id}/${action}`
        : `/api/admin/finance/withdrawals/${selection.row.id}/${action}`;
    const payload: { adminNote?: string; payoutReference?: string } = {};
    if (adminNote) payload.adminNote = adminNote;
    if (action === "complete" && payoutReference) payload.payoutReference = payoutReference;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(null);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      setError(body.message ?? "Action failed");
      return;
    }
    onCompleted();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={selection.kind === "deposit" ? "Deposit Review" : "Withdrawal Review"}
      subtitle={`#${selection.row.id.slice(0, 8).toUpperCase()}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-caption">
          <Field label="User">
            {selection.row.user ? `@${selection.row.user.username}` : "—"}
          </Field>
          <Field label="Status">
            <StatusBadge status={selection.row.status} />
          </Field>
          <Field label="Provider">{selection.row.provider?.name ?? "—"}</Field>
          <Field label="Amount">
            <span className="font-display text-heading-sm uppercase text-tcl-gold">
              {selection.row.currency} {selection.row.amount.toLocaleString()}
            </span>
          </Field>
          {selection.kind === "deposit" ? (
            <>
              <Field label="Payment Type">
                {selection.row.paymentType === "SEND_MONEY" ? "Send Money" : "Cash Out"}
              </Field>
              <Field label="Transaction ID">
                <span className="font-mono text-tcl-white">
                  {selection.row.transactionReference}
                </span>
              </Field>
              <Field label="Sent from">
                <span className="font-mono text-tcl-white">{selection.row.senderPhone ?? "Not given"}</span>
              </Field>
              <Field label="Agent Number">
                <span className="font-mono text-tcl-white">
                  {selection.row.agentNumber}
                </span>
              </Field>
            </>
          ) : (
            <>
              <Field label="Receiving Phone">
                <span className="font-mono text-tcl-white">
                  {selection.row.receivingPhone}
                </span>
              </Field>
              {selection.row.payoutReference ? (
                <Field label="Payout Reference">
                  <span className="font-mono text-tcl-white">
                    {selection.row.payoutReference}
                  </span>
                </Field>
              ) : null}
            </>
          )}
          <Field label="Submitted">
            {new Date(selection.row.createdAt).toLocaleString()}
          </Field>
          {selection.row.processedBy ? (
            <Field label={selection.row.status === "REJECTED" ? "Rejected by" : "Approved by"}>
              @{selection.row.processedBy.username}
            </Field>
          ) : null}
          {selection.kind === "withdrawal" && selection.row.assignedAgent ? (
            <Field label="Assigned agent">@{selection.row.assignedAgent.username}</Field>
          ) : null}
          {selection.kind === "withdrawal" && selection.row.completedBy ? (
            <Field label="Paid out by">@{selection.row.completedBy.username}</Field>
          ) : null}
        </div>

        {showAssign ? (
          <div className="space-y-1.5 rounded-md border border-tcl-border-muted bg-tcl-surface-2/50 p-3">
            <label htmlFor="assign-agent" className="text-caption font-semibold text-tcl-white">
              Assign payout to an agent
            </label>
            <div className="flex flex-wrap gap-2">
              <select
                id="assign-agent"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="h-10 min-w-0 flex-1 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm text-tcl-white focus:border-tcl-gold focus:outline-none"
              >
                <option value="">Select an agent…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    @{a.username}
                  </option>
                ))}
              </select>
              <SecondaryButton
                size="md"
                variant="outline"
                disabled={busy !== null || !agentId || agentId === selection.row.assignedAgent?.id}
                onClick={() => assign(agentId)}
              >
                {busy === "assign" ? "Saving…" : "Assign"}
              </SecondaryButton>
              {selection.row.assignedAgent ? (
                <SecondaryButton size="md" variant="outline" disabled={busy !== null} onClick={() => assign(null)}>
                  Unassign
                </SecondaryButton>
              ) : null}
            </div>
            <p className="text-[11px] text-tcl-muted">
              The agent sends the money to the receiving phone and marks it completed with the payout reference.
            </p>
          </div>
        ) : null}

        {selection.row.status === "PENDING" ? (
          <div className="rounded-md border border-tcl-gold/40 bg-tcl-gold/10 px-3 py-2 text-caption text-tcl-gold">
            {selection.kind === "deposit"
              ? "Verify the payment arrived at the agent number for this Transaction ID before approving."
              : "The receiving phone is the user's verified registered number. Approve after review; mark Completed only once the payout has actually been sent."}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-caption font-semibold text-tcl-white">
            Admin note {isTerminal ? "" : "(optional)"}
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            readOnly={isTerminal}
            maxLength={500}
            placeholder="Add a note for the audit log…"
            className="w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-2 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
          />
        </div>

        {isApprovedWithdrawal && canComplete ? (
          <div className="space-y-1.5">
            <label className="text-caption font-semibold text-tcl-white">
              Payout Reference (required for Complete)
            </label>
            <input
              type="text"
              value={payoutReference}
              onChange={(e) => setPayoutReference(e.target.value)}
              placeholder="Provider TrxID of the actual payout"
              className="h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm font-mono text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
            />
          </div>
        ) : null}

        {selection.row.adminNote && isTerminal ? (
          <div className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-2 text-caption text-tcl-muted">
            Existing note: {selection.row.adminNote}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
            <ICONS.AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <SecondaryButton onClick={onClose} variant="outline" size="md" disabled={busy !== null}>
            Close
          </SecondaryButton>
          {selection.row.status === "PENDING" && canReview ? (
            <>
              <button
                type="button"
                onClick={() => run("reject")}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-md border border-tcl-red bg-tcl-red/20 px-4 py-2 text-sm font-semibold text-tcl-red-bright hover:bg-tcl-red/30 disabled:opacity-60 cursor-pointer"
              >
                <ICONS.XCircle aria-hidden="true" className="size-4" />
                {busy === "reject" ? "Rejecting…" : "Reject"}
              </button>
              <PrimaryButton
                onClick={() => run("approve")}
                disabled={busy !== null}
                size="md"
                icon="CheckCircle2"
              >
                {busy === "approve" ? "Approving…" : "Approve"}
              </PrimaryButton>
            </>
          ) : null}
          {isApprovedWithdrawal && canReview ? (
              <button
                type="button"
                onClick={() => run("reject")}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-md border border-tcl-red bg-tcl-red/20 px-4 py-2 text-sm font-semibold text-tcl-red-bright hover:bg-tcl-red/30 disabled:opacity-60 cursor-pointer"
              >
                <ICONS.XCircle aria-hidden="true" className="size-4" />
                {busy === "reject" ? "Rejecting…" : "Reject"}
              </button>
          ) : null}
          {isApprovedWithdrawal && canComplete ? (
              <PrimaryButton
                onClick={() => run("complete")}
                disabled={busy !== null || !payoutReference.trim()}
                size="md"
                icon="CheckCircle2"
              >
                {busy === "complete" ? "Completing…" : "Mark Completed"}
              </PrimaryButton>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-tcl-muted">{label}</p>
      <div className="text-tcl-white">{children}</div>
    </div>
  );
}
