"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCenterSidebar } from "./UserCenterSidebar";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";

export function UserCenterShell({
  title,
  showSidebar = true,
  children,
}: {
  title?: string;
  showSidebar?: boolean;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="animate-fade-in-up mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
      {/* Mobile top bar — back link + title + drawer button */}
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-1.5 text-caption text-tcl-white/80 hover:text-tcl-white"
        >
          <ICONS.ChevronLeft aria-hidden="true" className="size-4" />
          {BN.common.back}
        </Link>
        {title ? (
          <h1 className="font-display text-sm uppercase tracking-wide text-tcl-white">
            {title}
          </h1>
        ) : (
          <span />
        )}
        {showSidebar ? (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={BN.nav.menu}
            className="inline-flex items-center gap-1.5 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-1.5 text-caption text-tcl-white/80 hover:text-tcl-white"
          >
            <ICONS.Menu aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <span />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[252px_minmax(0,1fr)] lg:gap-6">
        {showSidebar ? (
          <UserCenterSidebar className="hidden lg:flex lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]" />
        ) : null}

        <div className="min-w-0">{children}</div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && showSidebar ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="absolute inset-y-0 left-0 w-[260px] p-3">
            <div className="flex items-center justify-between pb-2">
              <span className="font-display text-sm uppercase text-tcl-gold">
                {BN.userCenter.title}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={BN.common.close}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md border border-tcl-border-muted text-tcl-white",
                )}
              >
                <ICONS.X aria-hidden="true" className="size-4" />
              </button>
            </div>
            <UserCenterSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
