import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { readAccessToken } from "@/lib/auth-cookies";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "Admins | TCL11 Admin" };
export const dynamic = "force-dynamic";

interface UserRow {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export default async function AdminAdminsPage() {
  const session = (await getSession())!;
  if (!session.roles.includes("super_admin")) {
    // Only super_admin can see or manage other admins.
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const at = readAccessToken(cookieStore);
  let rows: UserRow[] = [];
  let err: string | null = null;
  if (at) {
    try {
      // Fetch a large page and filter — users endpoint doesn't support role
      // filtering yet. 200 users is well under the service's data-size budget.
      const res = await backendFetch("/users?page=1&limit=200", { accessToken: at });
      if (!res.ok) err = `Backend ${res.status}`;
      else {
        const body = (await res.json()) as { data?: { data?: UserRow[] } };
        const all = body.data?.data ?? [];
        rows = all.filter(
          (u) => u.roles.includes("admin") || u.roles.includes("super_admin"),
        );
      }
    } catch (e) {
      err = e instanceof Error ? e.message : "Network error";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">Admin Users</h2>
        <span className="rounded-pill bg-tcl-surface-2 px-2 py-0.5 text-[11px] text-tcl-muted">
          {rows.length}
        </span>
      </div>

      <NeonCard className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <ICONS.Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tcl-gold" />
          <p className="text-[12px] text-tcl-muted">
            To <strong className="text-tcl-white">create a new admin</strong> safely, have the
            person register via <code className="text-tcl-white">/signup</code>, then from a
            Railway shell run{" "}
            <code className="text-tcl-white">npm run admin:promote -- &lt;username&gt;</code>.
            This avoids default passwords ever landing in the database. Role
            toggles for existing accounts are in User Management.
          </p>
        </div>
      </NeonCard>

      {err ? (
        <NeonCard className="p-4 text-center text-tcl-red-bright">Could not load: {err}</NeonCard>
      ) : (
        <NeonCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-tcl-border-muted text-caption uppercase text-tcl-muted">
                  <th className="py-3 pl-4 pr-3 font-semibold">Admin</th>
                  <th className="py-3 pr-3 font-semibold">Email</th>
                  <th className="py-3 pr-3 font-semibold">Role</th>
                  <th className="py-3 pr-3 font-semibold">Status</th>
                  <th className="py-3 pr-4 font-semibold">Since</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const isSuper = u.roles.includes("super_admin");
                  return (
                    <tr key={u.id} className="border-b border-tcl-border-muted/50">
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-tcl-gold/20 text-tcl-gold">
                            <ICONS.Crown aria-hidden="true" className="size-4" />
                          </span>
                          <div>
                            <p className="text-tcl-white">{u.firstName} {u.lastName}</p>
                            <p className="text-[11px] text-tcl-muted">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-tcl-muted">{u.email ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${isSuper ? "bg-tcl-gold/20 text-tcl-gold" : "bg-tcl-red/20 text-tcl-red-bright"}`}>
                          {isSuper ? "Super Admin" : "Admin"}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${u.isActive ? "bg-tcl-success/20 text-tcl-success" : "bg-tcl-red/20 text-tcl-red-bright"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[11px] text-tcl-muted">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-tcl-muted">
                      No admin users yet. See the hint above to create the first one.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </NeonCard>
      )}
    </div>
  );
}
