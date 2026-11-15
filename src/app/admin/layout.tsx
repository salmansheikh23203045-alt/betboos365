import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { SUB_ADMIN_SECTIONS, canUseAdminDashboard, isAdmin, isAgent } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login?next=/admin");

  // Second-line defense beyond the edge proxy — a fresh server-side check
  // against the current session every request.
  if (!canUseAdminDashboard(user.roles)) redirect(isAgent(user.roles) ? "/agent" : "/");

  // Sub Admins use this same dashboard, restricted to the sections their
  // permissions open. Any other /admin URL sends them to their first section.
  if (!isAdmin(user.roles)) {
    const permissions = user.permissions ?? [];
    const allowed = SUB_ADMIN_SECTIONS.filter((s) => permissions.includes(s.permission));
    const pathname = (await headers()).get("x-pathname") ?? "";
    const inAllowed = allowed.some((s) => pathname === s.href || pathname.startsWith(s.href + "/"));
    if (!inAllowed) {
      if (allowed.length === 0) redirect("/");
      redirect(allowed[0].href);
    }
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
