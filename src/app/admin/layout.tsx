import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login?next=/admin");

  const isAdmin = user.roles.includes("admin") || user.roles.includes("super_admin");
  // Second-line defense beyond the edge proxy — a fresh server-side check
  // against the current session every request.
  if (!isAdmin) redirect("/");

  return <AdminShell user={user}>{children}</AdminShell>;
}
