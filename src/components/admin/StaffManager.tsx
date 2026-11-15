"use client";

import { useCallback, useEffect, useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/wallet/StatusBadge";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { AdminWithdrawalRow } from "@/types/wallet";
import { WalletPanel } from "./WalletPanel";

type Kind = "agents" | "sub-admins";

interface StaffRow {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  phoneVerified?: boolean;
  isActive: boolean;
  createdAt: string;
  permissions?: string[];
  stats: Record<string, number>;
}

interface ListResponse {
  data: StaffRow[];
  meta: { total: number; active: number; inactive: number };
  grantable?: string[];
  defaults?: string[];
}

interface ActivityRow {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}

const COPY = {
  agents: {
    one: "Agent",
    blurb:
      "Agents sign in to their own Agent Dashboard, pay out only the withdrawals assigned to them, and see a read-only list of the players you assign to them (masked phone numbers, no balances). They cannot see other players, wallets or settings.",
  },
  "sub-admins": {
    one: "Sub Admin",
    blurb:
      "Sub Admins use this Admin Dashboard with restricted access: deposit and withdrawal review only, limited to the permissions you tick. They cannot manage users, agents, admins or settings.",
  },
} as const;

const PERMISSION_LABEL: Record<string, string> = {
  "deposits.view": "View deposit requests",
  "deposits.review": "Approve / reject deposits",
  "withdrawals.view": "View withdrawal requests",
  "withdrawals.review": "Approve / reject withdrawals",
  "withdrawals.assign": "Assign payouts to agents",
  "withdrawals.complete": "Mark payouts completed",
  "transactions.view": "View transaction records",
};

const INPUT =
  "h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none";

async function api<T>(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
  });
  const body = (await res.json().catch(() => ({}))) as { data?: T; message?: string };
  return { ok: res.ok, data: body.data, message: body.message ?? (res.ok ? undefined : "Request failed") };
}

type Dialog =
  | { type: "create" }
  | { type: "edit"; row: StaffRow }
  | { type: "password"; row: StaffRow }
  | { type: "permissions"; row: StaffRow }
  | { type: "activity"; row: StaffRow }
  | { type: "players"; row: StaffRow }
  | { type: "wallet"; row: StaffRow }
  | null;

export function StaffManager({ kind }: { kind: Kind }) {
  const copy = COPY[kind];
  const base = `/api/admin/staff/${kind}`;
  const [list, setList] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<ListResponse>(base);
    setLoading(false);
    if (!res.ok || !res.data) {
      setError(res.message ?? "Unable to load");
      return;
    }
    setError(null);
    setList(res.data);
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Confirms the agent's registered number belongs to them. Agent withdrawals
   * are paid only to a verified registered number (enforced by the backend).
   */
  async function setPhoneVerified(row: StaffRow, verified: boolean) {
    setBusyId(row.id);
    const res = await api(`/api/admin/users/${row.id}/phone-verification`, {
      method: "POST",
      body: JSON.stringify({ verified }),
    });
    setBusyId(null);
    if (!res.ok) setError(res.message ?? "Could not update verification");
    await load();
  }

  async function toggleStatus(row: StaffRow) {
    const verb = row.isActive ? "Deactivate" : "Activate";
    if (!window.confirm(`${verb} ${copy.one.toLowerCase()} @${row.username}?${row.isActive ? " They will be signed out immediately." : ""}`)) return;
    setBusyId(row.id);
    const res = await api(`${base}/${row.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    setBusyId(null);
    if (!res.ok) setError(res.message ?? "Action failed");
    await load();
  }

  const done = async () => {
    setDialog(null);
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">{copy.one} Management</h2>
        <PrimaryButton size="md" icon="Plus" onClick={() => setDialog({ type: "create" })}>
          New {copy.one}
        </PrimaryButton>
      </div>
      <p className="text-caption text-tcl-muted">{copy.blurb}</p>

      {list ? (
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["Total", list.meta.total],
              ["Active", list.meta.active],
              ["Deactivated", list.meta.inactive],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-tcl-muted">{label}</p>
              <p className="font-display text-heading-lg text-tcl-white">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
          {error}
        </div>
      ) : null}

      <NeonCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                <th className="py-3 pl-4 pr-3 font-semibold">{copy.one}</th>
                <th className="py-3 pr-3 font-semibold">Status</th>
                <th className="py-3 pr-3 font-semibold">{kind === "agents" ? "Payouts" : "Processed"}</th>
                <th className="py-3 pr-3 font-semibold">Created</th>
                <th className="py-3 pr-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !list ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-tcl-muted">
                    <ICONS.Loader2 aria-hidden="true" className="inline size-5 animate-spin" />
                  </td>
                </tr>
              ) : !list || list.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-tcl-muted">
                    No {copy.one.toLowerCase()} accounts yet.
                  </td>
                </tr>
              ) : (
                list.data.map((row) => (
                  <tr key={row.id} className="border-b border-tcl-border-muted/50 align-top hover:bg-tcl-surface-2/40">
                    <td className="py-3 pl-4 pr-3 text-tcl-white">
                      <span className="font-semibold">@{row.username}</span>
                      <span className="block text-[11px] text-tcl-muted">
                        {[row.name !== row.username ? row.name : null, row.phone, row.email].filter(Boolean).join(" · ") || "—"}
                      </span>
                      {kind === "agents" ? (
                        <span
                          className={cn(
                            "mt-1 inline-block rounded-pill px-1.5 py-0.5 text-[10px] font-bold uppercase",
                            !row.phone ? "bg-tcl-red/15 text-tcl-red-bright"
                            : row.phoneVerified ? "bg-tcl-success/15 text-tcl-success"
                            : "bg-tcl-gold/15 text-tcl-gold",
                          )}
                        >
                          {!row.phone ? "No payout number" : row.phoneVerified ? "Number verified" : "Number not verified"}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex rounded-pill border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          row.isActive
                            ? "border-tcl-success/40 bg-tcl-success/15 text-tcl-success"
                            : "border-tcl-red/40 bg-tcl-red/15 text-tcl-red-bright",
                        )}
                      >
                        {row.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[11px] text-tcl-muted">
                      {kind === "agents" ? (
                        <>
                          <span className="block text-tcl-white">{row.stats.awaitingPayout ?? 0} awaiting payout</span>
                          {row.stats.completed ?? 0} completed
                        </>
                      ) : (
                        <>
                          <span className="block text-tcl-white">{row.stats.depositsProcessed ?? 0} deposits</span>
                          {row.stats.withdrawalsProcessed ?? 0} withdrawals
                        </>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-[11px] text-tcl-muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1.5">
                        <RowButton onClick={() => setDialog({ type: "edit", row })}>Edit</RowButton>
                        {kind === "sub-admins" ? (
                          <RowButton onClick={() => setDialog({ type: "permissions", row })}>Permissions</RowButton>
                        ) : null}
                        <RowButton onClick={() => setDialog({ type: "password", row })}>Reset password</RowButton>
                        <RowButton onClick={() => setDialog({ type: "activity", row })}>Activity</RowButton>
                        {kind === "agents" ? (
                          <>
                            <RowButton onClick={() => setDialog({ type: "players", row })}>Players</RowButton>
                            <RowButton onClick={() => setDialog({ type: "wallet", row })}>Wallet</RowButton>
                            {row.phone ? (
                              <RowButton disabled={busyId === row.id} onClick={() => setPhoneVerified(row, !row.phoneVerified)}>
                                {row.phoneVerified ? "Unverify number" : "Verify number"}
                              </RowButton>
                            ) : null}
                          </>
                        ) : null}
                        <RowButton danger={row.isActive} disabled={busyId === row.id} onClick={() => toggleStatus(row)}>
                          {row.isActive ? "Deactivate" : "Activate"}
                        </RowButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeonCard>

      {dialog?.type === "create" ? (
        <CreateDialog kind={kind} base={base} grantable={list?.grantable} defaults={list?.defaults} onClose={() => setDialog(null)} onDone={done} />
      ) : null}
      {dialog?.type === "edit" ? <EditDialog kind={kind} base={base} row={dialog.row} onClose={() => setDialog(null)} onDone={done} /> : null}
      {dialog?.type === "password" ? <PasswordDialog base={base} row={dialog.row} onClose={() => setDialog(null)} onDone={done} /> : null}
      {dialog?.type === "permissions" ? (
        <PermissionsDialog base={base} row={dialog.row} grantable={list?.grantable ?? []} onClose={() => setDialog(null)} onDone={done} />
      ) : null}
      {dialog?.type === "activity" ? <ActivityDialog kind={kind} base={base} row={dialog.row} onClose={() => setDialog(null)} /> : null}
      {dialog?.type === "players" ? <AgentPlayersDialog base={base} row={dialog.row} onClose={() => setDialog(null)} /> : null}
      {dialog?.type === "wallet" ? (
        <WalletPanel userId={dialog.row.id} username={dialog.row.username} canAdjust onClose={() => setDialog(null)} />
      ) : null}
    </div>
  );
}

interface AssignedPlayer {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Players linked to an agent. Assigning a player who belongs to another agent
 * moves them; the audit log records the previous agent.
 */
function AgentPlayersDialog({ base, row, onClose }: { base: string; row: StaffRow; onClose: () => void }) {
  const [players, setPlayers] = useState<AssignedPlayer[] | null>(null);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await api<AssignedPlayer[]>(`${base}/${row.id}/players`);
    if (res.ok && res.data) setPlayers(res.data);
    else setMsg({ ok: false, text: res.message ?? "Unable to load players" });
  }, [base, row.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    const name = username.trim();
    if (name.length < 3) return;
    setBusy(true);
    const res = await api<{ username: string; previousAgentId: string | null }>(`${base}/${row.id}/players`, {
      method: "POST",
      body: JSON.stringify({ username: name }),
    });
    setBusy(false);
    if (!res.ok || !res.data) return setMsg({ ok: false, text: res.message ?? "Could not assign" });
    setMsg({
      ok: true,
      text: res.data.previousAgentId
        ? `${res.data.username} moved to @${row.username} from another agent.`
        : `${res.data.username} assigned to @${row.username}.`,
    });
    setUsername("");
    await load();
  }

  async function remove(p: AssignedPlayer) {
    setBusy(true);
    const res = await api(`${base}/${row.id}/players/${p.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.message ?? "Could not remove" });
    setMsg({ ok: true, text: `${p.username} removed from @${row.username}.` });
    await load();
  }

  return (
    <Modal open onClose={onClose} title="Assigned players" subtitle={`@${row.username}`} size="md">
      <div className="space-y-4">
        <p className="text-caption text-tcl-muted">
          The agent sees these players read-only (masked phone, deposit and withdrawal history) and nothing about any other player.
        </p>
        <form onSubmit={assign} className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Player username"
            maxLength={32}
            className={INPUT}
            disabled={!row.isActive}
          />
          <PrimaryButton size="md" type="submit" disabled={busy || username.trim().length < 3 || !row.isActive}>
            Assign
          </PrimaryButton>
        </form>
        {!row.isActive ? <p className="text-caption text-tcl-red-bright">Activate this agent before assigning players.</p> : null}
        {msg ? (
          <p
            role="status"
            className={cn(
              "rounded-md border px-3 py-2 text-caption",
              msg.ok ? "border-tcl-success/40 bg-tcl-success/10 text-tcl-success" : "border-tcl-red/40 bg-tcl-red/10 text-tcl-red-bright",
            )}
          >
            {msg.text}
          </p>
        ) : null}
        {players === null ? (
          <p className="text-caption text-tcl-muted">Loading…</p>
        ) : players.length === 0 ? (
          <p className="text-caption text-tcl-muted">No players assigned yet.</p>
        ) : (
          <ul className="max-h-80 space-y-1.5 overflow-auto">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md border border-tcl-border-muted bg-tcl-surface-2/60 px-3 py-2 text-sm">
                <span className="font-semibold text-tcl-white">{p.username}</span>
                {!p.isActive ? <span className="text-[10px] font-bold uppercase text-tcl-red-bright">inactive</span> : null}
                <span className="ml-auto text-[11px] text-tcl-muted">joined {new Date(p.createdAt).toLocaleDateString()}</span>
                <button
                  type="button"
                  onClick={() => void remove(p)}
                  disabled={busy}
                  className="rounded border border-tcl-red/40 px-2 py-0.5 text-[11px] font-semibold text-tcl-red-bright hover:bg-tcl-red/10 disabled:opacity-40 cursor-pointer"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function RowButton({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md border px-2 py-1 text-[11px] font-semibold disabled:opacity-50 cursor-pointer",
        danger
          ? "border-tcl-red/50 bg-tcl-red/10 text-tcl-red-bright hover:bg-tcl-red/20"
          : "border-tcl-border-muted bg-tcl-surface-2 text-tcl-white hover:border-tcl-gold/40",
      )}
    >
      {children}
    </button>
  );
}

function Labeled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-semibold text-tcl-white">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-tcl-muted">{hint}</span> : null}
    </label>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright">
      {message}
    </div>
  );
}

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        className={cn(INPUT, "pr-10")}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-tcl-muted hover:text-tcl-white cursor-pointer"
      >
        {show ? <ICONS.EyeOff className="size-4" /> : <ICONS.Eye className="size-4" />}
      </button>
    </div>
  );
}

const PASSWORD_HINT = "At least 8 characters with an uppercase letter, a lowercase letter and a digit. Stored hashed; it cannot be viewed later.";

function PermissionChecks({
  grantable,
  value,
  onChange,
}: {
  grantable: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-caption font-semibold text-tcl-white">Permissions</legend>
      {grantable.map((p) => (
        <label key={p} className="flex items-center gap-2 text-sm text-tcl-white">
          <input
            type="checkbox"
            checked={value.includes(p)}
            onChange={(e) => onChange(e.target.checked ? [...value, p] : value.filter((x) => x !== p))}
            className="size-4 accent-tcl-gold"
          />
          {PERMISSION_LABEL[p] ?? p}
        </label>
      ))}
    </fieldset>
  );
}

function CreateDialog({
  kind,
  base,
  grantable,
  defaults,
  onClose,
  onDone,
}: {
  kind: Kind;
  base: string;
  grantable?: string[];
  defaults?: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [permissions, setPermissions] = useState<string[]>(defaults ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = { username: username.trim(), password };
    if (name.trim()) payload.name = name.trim();
    if (phone.trim()) payload.phone = phone.replace(/[\s-]/g, "");
    if (kind === "sub-admins") payload.permissions = permissions;
    const res = await api(base, { method: "POST", body: JSON.stringify(payload) });
    setBusy(false);
    if (!res.ok) return setError(res.message ?? "Could not create the account");
    onDone();
  }

  return (
    <Modal open onClose={onClose} title={`New ${COPY[kind].one}`} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Labeled label="Username" hint="3–32 characters: letters, digits, dot, underscore or hyphen. Must be unique.">
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} className={INPUT} />
        </Labeled>
        <Labeled label="Initial password" hint={PASSWORD_HINT}>
          <PasswordInput value={password} onChange={setPassword} />
        </Labeled>
        <Labeled label="Name (optional)">
          <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
        </Labeled>
        <Labeled label="Contact phone (optional)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={INPUT} />
        </Labeled>
        {kind === "sub-admins" && grantable ? <PermissionChecks grantable={grantable} value={permissions} onChange={setPermissions} /> : null}
        <ErrorLine message={error} />
        <div className="flex justify-end gap-2">
          <SecondaryButton variant="outline" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" size="md" disabled={busy || !username.trim() || !password}>
            {busy ? "Creating…" : `Create ${COPY[kind].one}`}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function EditDialog({ kind, base, row, onClose, onDone }: { kind: Kind; base: string; row: StaffRow; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(row.name);
  const [phone, setPhone] = useState(row.phone ?? "");
  const [email, setEmail] = useState(row.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, string> = {};
    if (name.trim() && name.trim() !== row.name) payload.name = name.trim();
    if (phone.trim() && phone.trim() !== (row.phone ?? "")) payload.phone = phone.replace(/[\s-]/g, "");
    if (email.trim() && email.trim() !== (row.email ?? "")) payload.email = email.trim();
    if (Object.keys(payload).length === 0) return onClose();
    setBusy(true);
    setError(null);
    const res = await api(`${base}/${row.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    setBusy(false);
    if (!res.ok) return setError(res.message ?? "Could not save");
    onDone();
  }

  return (
    <Modal open onClose={onClose} title={`Edit ${COPY[kind].one}`} subtitle={`@${row.username}`} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Labeled label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
        </Labeled>
        <Labeled label="Contact phone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={INPUT} />
        </Labeled>
        <Labeled label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={INPUT} />
        </Labeled>
        <ErrorLine message={error} />
        <div className="flex justify-end gap-2">
          <SecondaryButton variant="outline" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" size="md" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function PasswordDialog({ base, row, onClose, onDone }: { base: string; row: StaffRow; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await api(`${base}/${row.id}/reset-password`, { method: "POST", body: JSON.stringify({ password }) });
    setBusy(false);
    if (!res.ok) return setError(res.message ?? "Could not reset the password");
    onDone();
  }

  return (
    <Modal open onClose={onClose} title="Reset password" subtitle={`@${row.username}`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <Labeled label="New password" hint={`${PASSWORD_HINT} All of this account's sessions are signed out.`}>
          <PasswordInput value={password} onChange={setPassword} />
        </Labeled>
        <ErrorLine message={error} />
        <div className="flex justify-end gap-2">
          <SecondaryButton variant="outline" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" size="md" disabled={busy || !password}>
            {busy ? "Resetting…" : "Reset password"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function PermissionsDialog({
  base,
  row,
  grantable,
  onClose,
  onDone,
}: {
  base: string;
  row: StaffRow;
  grantable: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [permissions, setPermissions] = useState<string[]>(row.permissions ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await api(`${base}/${row.id}/permissions`, { method: "PUT", body: JSON.stringify({ permissions }) });
    setBusy(false);
    if (!res.ok) return setError(res.message ?? "Could not save permissions");
    onDone();
  }

  return (
    <Modal open onClose={onClose} title="Sub Admin permissions" subtitle={`@${row.username}`} size="sm">
      <div className="space-y-4">
        <PermissionChecks grantable={grantable} value={permissions} onChange={setPermissions} />
        <p className="text-[11px] text-tcl-muted">Changes apply on this Sub Admin&rsquo;s next request. User, agent, admin and settings management can never be granted to a Sub Admin.</p>
        <ErrorLine message={error} />
        <div className="flex justify-end gap-2">
          <SecondaryButton variant="outline" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton size="md" onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save permissions"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

function describe(a: ActivityRow): string {
  const m = a.metadata ?? {};
  const short = (v: unknown) => (typeof v === "string" ? `#${v.slice(0, 8).toUpperCase()}` : "");
  switch (a.action) {
    case "WITHDRAWAL_COMPLETED":
      return `Paid out withdrawal ${short(m.withdrawalId)} · ${m.amount ?? ""} · ref ${m.payoutReference ?? "—"}`;
    case "WITHDRAWAL_APPROVED":
      return `Approved withdrawal ${short(m.withdrawalId)} · ${m.amount ?? ""}`;
    case "WITHDRAWAL_REJECTED":
      return `Rejected withdrawal ${short(m.withdrawalId)}`;
    case "WITHDRAWAL_ASSIGNED":
      return `${m.action === "returned_by_agent" ? "Returned" : "Assignment change on"} withdrawal ${short(m.withdrawalId)}`;
    case "DEPOSIT_APPROVED":
      return `Approved deposit ${short(m.depositId)} · ${m.amount ?? ""}`;
    case "DEPOSIT_REJECTED":
      return `Rejected deposit ${short(m.depositId)}`;
    case "LOGIN":
      return "Signed in";
    case "LOGOUT":
      return "Signed out";
    default:
      return a.action.replace(/_/g, " ").toLowerCase();
  }
}

function ActivityDialog({ kind, base, row, onClose }: { kind: Kind; base: string; row: StaffRow; onClose: () => void }) {
  const [tab, setTab] = useState<"activity" | "withdrawals">("activity");
  const [activity, setActivity] = useState<ActivityRow[] | null>(null);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<ActivityRow[]>(`${base}/${row.id}/activity`).then((res) => {
      if (!alive) return;
      if (res.ok && res.data) setActivity(res.data);
      else setError(res.message ?? "Unable to load activity");
    });
    if (kind === "agents") {
      api<{ data: AdminWithdrawalRow[] }>(`${base}/${row.id}/withdrawals?limit=50`).then((res) => {
        if (alive && res.ok && res.data) setWithdrawals(res.data.data);
      });
    }
    return () => {
      alive = false;
    };
  }, [base, kind, row.id]);

  return (
    <Modal open onClose={onClose} title={`${COPY[kind].one} activity`} subtitle={`@${row.username}`} size="lg">
      <div className="space-y-3">
        {kind === "agents" ? (
          <div className="flex gap-2 border-b border-tcl-border-muted">
            {(
              [
                ["activity", "Activity log"],
                ["withdrawals", "Withdrawals handled"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={cn(
                  "border-b-2 px-3 pb-2 text-sm font-semibold cursor-pointer",
                  tab === k ? "border-tcl-gold text-tcl-gold" : "border-transparent text-tcl-muted hover:text-tcl-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        <ErrorLine message={error} />
        <div className="max-h-[50vh] overflow-y-auto">
          {tab === "activity" ? (
            activity === null ? (
              <p className="py-4 text-center text-tcl-muted">Loading…</p>
            ) : activity.length === 0 ? (
              <p className="py-4 text-center text-tcl-muted">No recorded activity yet.</p>
            ) : (
              <ul className="divide-y divide-tcl-border-muted/50">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <span className="text-tcl-white">{describe(a)}</span>
                    <span className="shrink-0 text-right text-[11px] text-tcl-muted">
                      {new Date(a.timestamp).toLocaleString()}
                      {a.ipAddress ? <span className="block">{a.ipAddress}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : withdrawals === null ? (
            <p className="py-4 text-center text-tcl-muted">Loading…</p>
          ) : withdrawals.length === 0 ? (
            <p className="py-4 text-center text-tcl-muted">No withdrawals assigned to this agent yet.</p>
          ) : (
            <ul className="divide-y divide-tcl-border-muted/50">
              {withdrawals.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-tcl-white">
                    #{w.id.slice(0, 8).toUpperCase()} · {w.user ? `@${w.user.username}` : "—"}
                    <span className="block text-[11px] text-tcl-muted">
                      {w.provider?.name} · {w.receivingPhone}
                      {w.payoutReference ? ` · ref ${w.payoutReference}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold text-tcl-gold">
                      {w.currency} {w.amount.toLocaleString()}
                    </span>
                    <StatusBadge status={w.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
