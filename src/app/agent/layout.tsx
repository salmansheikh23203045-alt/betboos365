import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canUseAdminDashboard, isAgent, isSuperAdmin } from "@/lib/roles";
import { AgentShell } from "@/components/agent/AgentShell";

export const dynamic = "force-dynamic";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login?next=/agent");

  // Second-line defense beyond the edge proxy: only Agent accounts get in.
  if (!isAgent(user.roles) || isSuperAdmin(user.roles)) {
    redirect(canUseAdminDashboard(user.roles) ? "/admin" : "/");
  }

  return <AgentShell user={user}>{children}</AgentShell>;
}
