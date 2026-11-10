"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ICONS } from "@/lib/icons";
import { Logo } from "@/components/ui/Logo";
import { HeaderAuth } from "@/components/auth/HeaderAuth";
import { MobileDrawer } from "./MobileDrawer";
import { NAV_ITEMS } from "@/data/mock";

export function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleClose = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-tcl-red/40 bg-tcl-black lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex size-10 items-center justify-center text-tcl-gold transition-transform active:scale-90 cursor-pointer"
          >
            <ICONS.Menu aria-hidden="true" className="size-6" />
          </button>
          <Logo size="sm" />
          <Link
            href="/contact"
            aria-label="Customer support"
            className="inline-flex size-10 items-center justify-center text-tcl-gold transition-transform active:scale-90"
          >
            <ICONS.Headset aria-hidden="true" className="size-6" />
          </Link>
        </div>
        <HeaderAuth variant="mobile" />
      </header>
      <MobileDrawer open={drawerOpen} onClose={handleClose} navItems={NAV_ITEMS} />
    </>
  );
}
