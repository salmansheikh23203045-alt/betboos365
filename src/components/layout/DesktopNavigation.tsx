"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/types";

export interface DesktopNavigationProps {
  items: NavItem[];
}

/**
 * DesktopNavigation — icon-over-label top menu.
 * Active item: red filled tile with gold label (reference: "Home").
 */
export function DesktopNavigation({ items }: DesktopNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-stretch gap-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 min-w-[64px] flex-col items-center justify-center gap-1 rounded-tile px-3",
                  "text-label font-semibold uppercase tracking-wide transition-colors",
                  active
                    ? "bg-red-gradient neon-border-red text-tcl-gold"
                    : "text-tcl-white hover:text-tcl-gold",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
