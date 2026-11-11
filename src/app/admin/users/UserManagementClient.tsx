"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { AdminUserRow } from "./page";

type RoleSlug = "user" | "vip" | "moderator" | "admin" | "super_admin";
const ROLE_CHOICES: Array<{ value: RoleSlug; label: string; superOnly?: boolean }> = [
  { value: "user", label: "User" },
  { value: "vip", label: "VIP" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin", superOnly: true },
  { value: "super_admin", label: "Super Admin", superOnly: true },
];

export function UserManagementClient({
  rows,
  meta,
  currentUserId,
  isSuperAdmin,
}: {
  rows: AdminUserRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  currentUserId: string;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "admin">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "err" | null; msg?: string }>({ kind: null });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((u) => {
      if (filter === "active" && !u.isActive) return false;
      if (filter === "inactive" && u.isActive) return false;
      if (filter === "admin" && !u.roles.some((r) => r === "admin" || r === "super_admin")) return false;
      if (!needle) return true;
      return (
        u.username.toLowerCase().includes(needle) ||
        u.firstName.toLowerCase().includes(needle) ||
        u.lastName.toLowerCase().includes(needle) ||
        (u.email ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, filter]);

  async function updateRoles(u: AdminUserRow, nextRoles: RoleSlug[]) {
    setStatus({ kind: null });
    setPendingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/roles`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ roles: nextRoles }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ message: "Failed" }))) as { message?: string };
        setStatus({ kind: "err", msg: body.message ?? `Failed (${res.status})` });
      } else {
        setStatus({ kind: "ok", msg: `Updated roles for @${u.username}` });
        startTransition(() => router.refresh());
      }
    } catch {
      setStatus({ kind: "err", msg: "Network error" });
    } finally {
      setPendingId(null);
    }
  }

  async function toggleActive(u: AdminUserRow) {
    if (u.id === currentUserId) {
      setStatus({ kind: "err", msg: "You cannot deactivate yourself." });
      return;
    }
    if (!u.isActive) {
      // Reactivate not yet implemented on the backend.
      setStatus({ kind: "err", msg: "Reactivation requires a backend endpoint that doesn't exist yet." });
      return;
    }
    setStatus({ kind: null });
    setPendingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/deactivate`, { method: "PATCH" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ message: "Failed" }))) as { message?: string };
        setStatus({ kind: "err", msg: body.message ?? `Failed (${res.status})` });
      } else {
        setStatus({ kind: "ok", msg: `Deactivated @${u.username}` });
        startTransition(() => router.refresh());
      }
    } catch {
      setStatus({ kind: "err", msg: "Network error" });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">User Management</h2>
        <span className="rounded-pill bg-tcl-surface-2 px-2 py-0.5 text-[11px] text-tcl-muted">
          {meta.total} total
        </span>
      </div>

      {status.kind ? (
        <div
          role="status"
          className={cn(
            "rounded-md border px-3 py-2 text-caption",
            status.kind === "ok"
              ? "border-tcl-success/40 bg-tcl-success/10 text-tcl-success"
              : "border-tcl-red/40 bg-tcl-red/10 text-tcl-red-bright",
          )}
        >
          {status.msg}
        </div>
      ) : null}

      <NeonCard className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <ICONS.Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by username, name, email…"
              className="h-10 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
            />
          </div>
          <div className="flex overflow-hidden rounded-pill border border-tcl-border-muted text-[11px]">
            {(["all", "active", "inactive", "admin"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 font-semibold capitalize cursor-pointer",
                  filter === f ? "bg-tcl-red/30 text-tcl-red-bright" : "text-tcl-muted hover:text-tcl-white",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                <th className="pb-2 pr-3 font-semibold">User</th>
                <th className="pb-2 pr-3 font-semibold">Email</th>
                <th className="pb-2 pr-3 font-semibold">Roles</th>
                <th className="pb-2 pr-3 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-tcl-muted">
                    No users match these filters.
                  </td>
                </tr>
              ) : filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                const isSuperOnOther = u.roles.includes("super_admin") && !isSuperAdmin;
                const canEditRoles = isSuperAdmin && !isSelf;
                return (
                  <tr key={u.id} className="border-b border-tcl-border-muted/50 align-top">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-tcl-gold/20 text-tcl-gold">
                          <ICONS.User aria-hidden="true" className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-tcl-white">
                            {u.firstName} {u.lastName}
                            {isSelf ? <span className="ml-1 text-[10px] text-tcl-gold">(you)</span> : null}
                          </p>
                          <p className="truncate text-[11px] text-tcl-muted">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-tcl-muted">{u.email ?? "—"}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={cn(
                              "rounded-pill px-1.5 py-0.5 text-[10px] font-bold uppercase",
                              r === "super_admin" ? "bg-tcl-gold/20 text-tcl-gold" :
                              r === "admin"       ? "bg-tcl-red/20 text-tcl-red-bright" :
                              r === "vip"         ? "bg-tcl-gold/10 text-tcl-gold" :
                              "bg-tcl-muted/10 text-tcl-muted",
                            )}
                          >
                            {r.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase",
                          u.isActive ? "bg-tcl-success/20 text-tcl-success" : "bg-tcl-red/20 text-tcl-red-bright",
                        )}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <RoleEditor
                          user={u}
                          canEdit={canEditRoles && !isSuperOnOther}
                          disabled={pendingId === u.id}
                          isSuperAdmin={isSuperAdmin}
                          onApply={(roles) => updateRoles(u, roles)}
                        />
                        <button
                          type="button"
                          onClick={() => toggleActive(u)}
                          disabled={pendingId === u.id || isSelf || isSuperOnOther || !u.isActive}
                          title={
                            isSelf ? "You cannot deactivate yourself"
                            : isSuperOnOther ? "Only Super Admin can touch Super Admin accounts"
                            : !u.isActive ? "Reactivation endpoint not implemented yet"
                            : "Deactivate this account"
                          }
                          className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-2 py-1 text-[11px] font-semibold text-tcl-red-bright hover:border-tcl-red/70 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {u.isActive ? "Deactivate" : "Inactive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 ? (
          <div className="flex items-center justify-between pt-1 text-[12px] text-tcl-muted">
            <span>
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-1">
              <SecondaryButton
                size="sm"
                variant="outline"
                href={`/admin/users?page=${Math.max(1, meta.page - 1)}&limit=${meta.limit}`}
                disabled={meta.page <= 1}
              >
                Prev
              </SecondaryButton>
              <SecondaryButton
                size="sm"
                variant="outline"
                href={`/admin/users?page=${Math.min(meta.totalPages, meta.page + 1)}&limit=${meta.limit}`}
                disabled={meta.page >= meta.totalPages}
              >
                Next
              </SecondaryButton>
            </div>
          </div>
        ) : null}
      </NeonCard>
    </div>
  );
}

function RoleEditor({
  user,
  canEdit,
  disabled,
  isSuperAdmin,
  onApply,
}: {
  user: AdminUserRow;
  canEdit: boolean;
  disabled: boolean;
  isSuperAdmin: boolean;
  onApply: (roles: RoleSlug[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<RoleSlug>>(new Set(user.roles as RoleSlug[]));

  if (!canEdit) {
    return (
      <span className="rounded-md bg-tcl-muted/10 px-2 py-1 text-[11px] text-tcl-muted" title="Only Super Admin can edit roles">
        —
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-2 py-1 text-[11px] font-semibold text-tcl-white hover:border-tcl-gold/40 disabled:opacity-50 cursor-pointer"
      >
        Edit Roles
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-9 z-10 w-52 rounded-md border border-tcl-border-muted bg-tcl-surface-1 p-2 shadow-lg">
          {ROLE_CHOICES.filter((c) => !c.superOnly || isSuperAdmin).map((c) => (
            <label key={c.value} className="flex items-center gap-2 px-2 py-1 text-[12px] text-tcl-white">
              <input
                type="checkbox"
                className="accent-tcl-gold"
                checked={selected.has(c.value)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(c.value);
                  else next.delete(c.value);
                  setSelected(next);
                }}
              />
              {c.label}
            </label>
          ))}
          <div className="mt-2 flex gap-1 border-t border-tcl-border-muted pt-2">
            <button
              type="button"
              onClick={() => {
                onApply(Array.from(selected));
                setOpen(false);
              }}
              disabled={selected.size === 0}
              className="flex-1 rounded-md bg-tcl-red/30 px-2 py-1 text-[11px] font-bold uppercase text-tcl-red-bright hover:bg-tcl-red/50 disabled:opacity-40 cursor-pointer"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-tcl-border-muted px-2 py-1 text-[11px] text-tcl-muted hover:text-tcl-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
