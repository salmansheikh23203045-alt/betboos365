"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/types";

export interface MobileBottomNavigationProps {
  items: NavItem[];
}

/**
 * MobileBottomNavigation — five-tab bottom bar (Home, Casino, Sports, Promotion, Profile).
 * Reference: mobile frame bottom. Active tab is a red-gradient pill; others are muted.
 * Visible below lg.
 */
export function MobileBottomNavigation({ items }: MobileBottomNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 h-16 border-t border-tcl-red/40 bg-tcl-black lg:hidden"
    >
      <ul className="grid h-full grid-cols-5">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.id} className="flex">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 text-label font-semibold tap-feedback",
                  active ? "text-tcl-gold" : "text-tcl-muted",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className="size-5"
                  {...(active ? { fill: "currentColor", strokeWidth: 1.5 } : {})}
                />
                <span className="text-[10px] leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
