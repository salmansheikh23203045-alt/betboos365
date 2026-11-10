"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/types";

const EXTRA_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
}

export function MobileDrawer({ open, onClose, navItems }: MobileDrawerProps) {
  const pathname = usePathname();

  const stableClose = useCallback(onClose, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") stableClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, stableClose]);

  useEffect(() => {
    if (open) stableClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        aria-label="Mobile menu"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-tcl-red/40 bg-tcl-black transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-tcl-border-muted px-4 py-4">
          <Logo size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex size-10 items-center justify-center text-tcl-muted hover:text-tcl-white cursor-pointer"
          >
            <ICONS.X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = ICONS[item.icon];
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "bg-tcl-red/20 text-tcl-gold"
                        : "text-tcl-muted hover:bg-tcl-surface-2 hover:text-tcl-white",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mx-3 my-4 h-px bg-tcl-border-muted" />

          <ul className="space-y-1 px-3">
            {EXTRA_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-tcl-muted transition-colors hover:bg-tcl-surface-2 hover:text-tcl-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 border-t border-tcl-border-muted px-4 py-4">
          <Link href="/terms" className="block text-[11px] text-tcl-muted transition-colors hover:text-tcl-white">
            Terms & Conditions
          </Link>
          <Link href="/privacy" className="block text-[11px] text-tcl-muted transition-colors hover:text-tcl-white">
            Privacy Policy
          </Link>
        </div>
      </nav>
    </>
  );
}
