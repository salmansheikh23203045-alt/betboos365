"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ICONS } from "@/lib/icons";
import { useAuth, type SessionUser } from "@/components/auth/AuthProvider";

/**
 * Agent Dashboard frame. Same dark / red / gold identity as the Admin
 * Dashboard, but with no navigation: an agent has exactly one job here.
 * `data-admin-shell` hides the public header, footer and bottom nav.
 */
export function AgentShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div data-admin-shell="true" className="min-h-dvh bg-tcl-black text-tcl-white">
      <header className="sticky top-0 z-30 border-b border-tcl-red/30 bg-tcl-black/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Logo size="sm" href="/agent" />
          <span className="rounded-pill border border-tcl-red/40 bg-tcl-red/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tcl-red-bright">
            Agent
          </span>
          <span className="ml-auto hidden text-sm text-tcl-muted sm:block">@{user.username}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm font-semibold text-tcl-red-bright hover:border-tcl-red/60 sm:ml-0 cursor-pointer"
          >
            <ICONS.LogOut aria-hidden="true" className="size-4" />
            Log Out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4 lg:p-6">{children}</main>
    </div>
  );
}
