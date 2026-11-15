import type { Metadata } from "next";
import { cookies } from "next/headers";
import { readAccessToken } from "@/lib/auth-cookies";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "Audit Logs | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

interface AuditRow {
  id: string;
  action: string;
  userId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  // Backend returns `timestamp`; some older seed rows may use `createdAt`.
  timestamp?: string;
  createdAt?: string;
}

function tsOf(r: AuditRow) {
  return r.timestamp ?? r.createdAt ?? "";
}

const ACTION_COLOR: Record<string, string> = {
  LOGIN: "bg-tcl-success/20 text-tcl-success",
  LOGOUT: "bg-tcl-muted/20 text-tcl-muted",
  REGISTER: "bg-tcl-gold/20 text-tcl-gold",
  PASSWORD_CHANGE: "bg-tcl-gold/20 text-tcl-gold",
  PROFILE_UPDATE: "bg-tcl-muted/20 text-tcl-white",
  GAME_LAUNCH: "bg-tcl-muted/20 text-tcl-white",
  PROMOTION_CLAIM: "bg-tcl-red/20 text-tcl-red-bright",
  ADMIN_ACTION: "bg-tcl-red/30 text-tcl-red-bright",
  SUPPORT_TICKET: "bg-tcl-muted/20 text-tcl-white",
  SETTINGS_CHANGE: "bg-tcl-gold/20 text-tcl-gold",
};

export default async function AuditLogsPage() {
  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  let rows: AuditRow[] = [];
  let fetchErr: string | null = null;

  if (at) {
    try {
      const res = await backendFetch("/admin/audit-logs", { accessToken: at });
      if (!res.ok) fetchErr = `Backend returned ${res.status}`;
      else {
        const body = (await res.json()) as { data?: unknown };
        const list = Array.isArray(body.data)
          ? (body.data as AuditRow[])
          : (body.data && typeof body.data === "object" && "data" in body.data && Array.isArray((body.data as { data: unknown }).data))
            ? (body.data as { data: AuditRow[] }).data
            : [];
        rows = [...list].sort((a, b) => new Date(tsOf(b)).getTime() - new Date(tsOf(a)).getTime());
      }
    } catch (e) {
      fetchErr = e instanceof Error ? e.message : "Network error";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">Audit Logs</h2>
        <span className="rounded-pill bg-tcl-surface-2 px-2 py-0.5 text-[11px] text-tcl-muted">
          {rows.length} entries
        </span>
      </div>

      {fetchErr ? (
        <NeonCard className="p-4 text-center text-tcl-red-bright">
          Could not load audit logs: {fetchErr}
        </NeonCard>
      ) : (
        <NeonCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                  <th className="py-3 pl-4 pr-3 font-semibold">Action</th>
                  <th className="py-3 pr-3 font-semibold">User</th>
                  <th className="py-3 pr-3 font-semibold">IP</th>
                  <th className="py-3 pr-3 font-semibold">Metadata</th>
                  <th className="py-3 pr-4 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-tcl-muted">
                      <ICONS.BookOpen aria-hidden="true" className="mx-auto mb-2 size-6" />
                      No audit entries yet.
                    </td>
                  </tr>
                ) : rows.map((r) => (
                  <tr key={r.id} className="border-b border-tcl-border-muted/50 align-top">
                    <td className="py-3 pl-4 pr-3">
                      <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${ACTION_COLOR[r.action] ?? "bg-tcl-muted/10 text-tcl-muted"}`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-tcl-muted">
                      {r.userId ? r.userId.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-tcl-muted">
                      {r.ipAddress ?? "—"}
                    </td>
                    <td className="py-3 pr-3">
                      {r.metadata && Object.keys(r.metadata as object).length > 0 ? (
                        <code className="block max-w-xs truncate text-[10px] text-tcl-white">
                          {JSON.stringify(r.metadata)}
                        </code>
                      ) : (
                        <span className="text-[11px] text-tcl-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-[11px] text-tcl-muted">
                      {tsOf(r) ? new Date(tsOf(r)).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NeonCard>
      )}

      <p className="text-[11px] text-tcl-muted">
        Audit entries are written by the backend on authentication events, role
        changes, profile updates and admin actions. Retention: forever (no
        archival policy configured yet).
      </p>
    </div>
  );
}
