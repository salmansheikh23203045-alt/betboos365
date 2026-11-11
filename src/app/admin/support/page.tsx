import type { Metadata } from "next";
import { cookies } from "next/headers";
import { readAccessToken } from "@/lib/auth-cookies";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "Support & Tickets | TCL11 Admin" };
export const dynamic = "force-dynamic";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  userId: string;
}

export default async function AdminSupportPage() {
  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  let tickets: Ticket[] = [];
  let err: string | null = null;
  if (at) {
    try {
      const res = await backendFetch("/support/tickets", { accessToken: at });
      if (!res.ok) err = `Backend ${res.status}`;
      else {
        const body = (await res.json()) as { data?: unknown };
        tickets = Array.isArray(body.data) ? body.data
          : (body.data && typeof body.data === "object" && "data" in body.data && Array.isArray((body.data as { data: unknown }).data))
            ? (body.data as { data: Ticket[] }).data
            : [];
      }
    } catch (e) {
      err = e instanceof Error ? e.message : "Network error";
    }
  }

  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">Support &amp; Tickets</h2>
        <span className="rounded-pill bg-tcl-surface-2 px-2 py-0.5 text-[11px] text-tcl-muted">{tickets.length}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <TinyStat label="Open" value={open} tone="red" />
        <TinyStat label="In Progress" value={inProgress} tone="gold" />
        <TinyStat label="Resolved" value={resolved} tone="success" />
      </div>

      {err ? (
        <NeonCard className="p-4 text-center text-tcl-red-bright">Could not load: {err}</NeonCard>
      ) : (
        <NeonCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                  <th className="py-3 pl-4 pr-3 font-semibold">Subject</th>
                  <th className="py-3 pr-3 font-semibold">User</th>
                  <th className="py-3 pr-3 font-semibold">Priority</th>
                  <th className="py-3 pr-3 font-semibold">Status</th>
                  <th className="py-3 pr-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-tcl-border-muted/50">
                    <td className="py-3 pl-4 pr-3 text-tcl-white">{t.subject}</td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-tcl-muted">{t.userId.slice(0, 8)}…</td>
                    <td className="py-3 pr-3">
                      <span className="rounded-pill bg-tcl-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase text-tcl-white">
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${
                        t.status === "open" ? "bg-tcl-red/20 text-tcl-red-bright" :
                        t.status === "in_progress" ? "bg-tcl-gold/20 text-tcl-gold" :
                        "bg-tcl-success/20 text-tcl-success"
                      }`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[11px] text-tcl-muted">{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {tickets.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-tcl-muted">No tickets yet.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </NeonCard>
      )}

      <p className="text-[11px] text-tcl-muted">
        Reply / status-change UI not yet exposed in this screen. Use the ticket
        detail page or the API meanwhile.
      </p>
    </div>
  );
}

function TinyStat({ label, value, tone }: { label: string; value: number; tone: "red" | "gold" | "success" }) {
  const toneCls =
    tone === "red" ? "bg-tcl-red/10 text-tcl-red-bright" :
    tone === "gold" ? "bg-tcl-gold/10 text-tcl-gold" :
    "bg-tcl-success/10 text-tcl-success";
  return (
    <NeonCard className="flex items-center gap-3 p-4">
      <span className={`inline-flex size-10 items-center justify-center rounded-md ${toneCls}`}>
        <ICONS.MessageCircle aria-hidden="true" className="size-5" />
      </span>
      <div>
        <p className="text-[11px] uppercase text-tcl-muted">{label}</p>
        <p className="font-display text-heading-md text-tcl-white">{value}</p>
      </div>
    </NeonCard>
  );
}
