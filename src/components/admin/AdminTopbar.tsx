"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ICONS } from "@/lib/icons";
import type { SessionUser } from "@/components/auth/AuthProvider";
import { isRestrictedStaff, roleLabel as roleLabelFor } from "@/lib/roles";

export function AdminTopbar({
  user,
  onOpenMobile,
}: {
  user: SessionUser;
  onOpenMobile: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const roleLabel = roleLabelFor(user.roles);
  // Admin and Sub Admin accounts have no profile page.
  const hasProfile = !isRestrictedStaff(user.roles);
  const displayEmail = user.email ?? `${user.username}@betboos365`;

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-tcl-border-muted bg-tcl-black/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenMobile}
          className="inline-flex size-10 items-center justify-center rounded-md text-tcl-white hover:bg-tcl-surface-2 lg:hidden cursor-pointer"
        >
          <ICONS.Menu aria-hidden="true" className="size-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate font-display text-heading-md uppercase text-tcl-white">
            {roleLabel} ড্যাশবোর্ড
          </h1>
          <p className="hidden truncate text-[11px] text-tcl-muted sm:block">
            সম্পূর্ণ নিয়ন্ত্রণ, বিশ্লেষণ ও প্ল্যাটফর্ম ব্যবস্থাপনা
          </p>
        </div>

        {/* Search */}
        <div className="ml-auto hidden flex-1 max-w-md items-center md:flex">
          <div className="relative w-full" title="Global search is not yet backed by an endpoint. See Settings → Platform capabilities.">
            <ICONS.Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted opacity-60" />
            <input
              type="search"
              placeholder="Search coming soon — use sidebar sections for now"
              disabled
              aria-disabled="true"
              aria-label="Global search — not yet available"
              className="h-10 w-full cursor-not-allowed rounded-pill border border-tcl-border-muted bg-tcl-surface-2/50 pl-10 pr-10 text-sm text-tcl-muted placeholder:text-tcl-muted focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          aria-label="Notifications — not yet available"
          aria-disabled="true"
          className="relative ml-auto inline-flex size-10 items-center justify-center rounded-md text-tcl-muted cursor-not-allowed md:ml-0"
          disabled
          title="Notifications panel is not yet backed by an endpoint. See Settings → Platform capabilities."
        >
          <ICONS.Info aria-hidden="true" className="size-5 opacity-50" />
        </button>

        <button
          type="button"
          aria-label="Messages — not yet available"
          aria-disabled="true"
          className="relative inline-flex size-10 items-center justify-center rounded-md text-tcl-muted cursor-not-allowed"
          disabled
          title="Messages panel is not yet backed by an endpoint. See Settings → Platform capabilities."
        >
          <ICONS.MessageCircle aria-hidden="true" className="size-5 opacity-50" />
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 items-center gap-2 rounded-pill border border-tcl-gold/40 bg-tcl-surface-2 px-2 text-sm text-tcl-white hover:border-tcl-gold cursor-pointer"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-tcl-gold/20 text-tcl-gold">
              <ICONS.Crown aria-hidden="true" className="size-4" />
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block font-semibold">{roleLabel}</span>
              <span className="block text-[10px] text-tcl-muted">{displayEmail}</span>
            </span>
            <ICONS.ChevronDown aria-hidden="true" className="size-3.5 text-tcl-muted" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-11 w-56 overflow-hidden rounded-md border border-tcl-border-muted bg-tcl-surface-1 shadow-lg"
            >
              <div className="border-b border-tcl-border-muted px-3 py-2">
                <p className="text-sm font-semibold text-tcl-white">{user.firstName}</p>
                <p className="truncate text-[11px] text-tcl-muted">@{user.username}</p>
              </div>
              {hasProfile ? (
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-tcl-white hover:bg-tcl-surface-2" role="menuitem">
                  আমার প্রোফাইল
                </Link>
              ) : null}
              <Link href="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-tcl-white hover:bg-tcl-surface-2" role="menuitem">
                সাইটে ফিরে যান
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full border-t border-tcl-border-muted px-3 py-2 text-left text-sm text-tcl-red-bright hover:bg-tcl-surface-2 cursor-pointer"
                role="menuitem"
              >
                লগ আউট
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
