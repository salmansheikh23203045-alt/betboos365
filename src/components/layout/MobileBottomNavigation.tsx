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
 * MobileBottomNavigation — five-tab bottom bar (Home, Casino, Deposit, Promotion, Profile). Visible below lg.
 *
 * Black outer strip holding a rounded dark-grey track. The active tab sits on an orange pill, a single
 * element that slides to the active column when the route changes. Inactive tabs keep a grey icon and label.
 * Total height stays 64px (border 1 + pt 5 + track 52 + pb 6), matching the body's `max-lg:pb-16` clearance in
 * app/layout.tsx. The bottom safe-area inset is added on top of the 6px bottom padding.
 */
export function MobileBottomNavigation({ items }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  // The most specific matching tab wins, so /profile/deposit lights Deposit, not Profile.
  const matches = (item: NavItem) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
  const activeItem = items.filter(matches).sort((a, b) => b.href.length - a.href.length)[0];
  const isActive = (item: NavItem) => item === activeItem;
  const activeIndex = activeItem ? items.indexOf(activeItem) : -1;

  return (
    <nav
      aria-label="Mobile"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 rounded-t-[20px] border-t border-white/[0.06] bg-tcl-black lg:hidden",
        // pt is 5px because the 1px top border completes the 6px.
        "px-2 pt-[5px] pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]",
        "shadow-[0_-10px_28px_-6px_rgb(0_0_0/0.85)]",
      )}
    >
      <ul
        className="relative mx-auto grid h-[52px] max-w-md rounded-2xl bg-[#1b1b1e] p-1 ring-1 ring-inset ring-white/[0.05]"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {/* Sliding orange pill. Hidden when the current route is not one of the tabs. */}
        <li
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-1 left-1 px-0.5",
            "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            activeIndex < 0 && "opacity-0",
          )}
          style={{
            width: `calc((100% - 0.5rem) / ${items.length})`,
            transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
          }}
        >
          <span className="block h-full rounded-full bg-[linear-gradient(180deg,#ff7a2f_0%,#f05a1a_100%)] shadow-[0_4px_14px_-4px_rgb(255_106_26/0.75),inset_0_1px_0_rgb(255_255_255/0.22)]" />
        </li>

        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item);
          return (
            <li key={item.id} className="relative z-10 flex min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full px-0.5 tap-feedback",
                  "transition-colors duration-300 motion-reduce:transition-none",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/80",
                  active ? "text-tcl-white" : "text-tcl-muted hover:text-tcl-white/85",
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                <span
                  className={cn(
                    "max-w-full truncate text-[11px] leading-[1.25]",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
