"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import type { SessionUser } from "@/components/auth/AuthProvider";

/**
 * Wraps every /admin/* page in the Super Admin shell:
 *   - fixed sidebar on desktop, drawer on mobile
 *   - sticky topbar with search + notification/profile cluster
 *   - main content area with page-level scroll
 *
 * The shell is a client component because the sidebar needs open/close
 * state on mobile; children can still be server components.
 */
export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSuperAdmin = user.roles.includes("super_admin");

  return (
    // `data-admin-shell` is a CSS marker the root layout's global rules key
    // off to hide the public Footer and MobileBottomNavigation on admin
    // routes (see src/app/globals.css).
    <div data-admin-shell="true" className="min-h-dvh bg-tcl-black text-tcl-white">
      <AdminSidebar
        user={user}
        isSuperAdmin={isSuperAdmin}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="lg:pl-72">
        <AdminTopbar user={user} onOpenMobile={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
