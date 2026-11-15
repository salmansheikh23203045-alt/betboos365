"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
}

export const USER_CENTER_NAV: SidebarNavItem[] = [
  { label: BN.userCenter.myAccount, href: "/profile", icon: "User" },
  { label: BN.userCenter.bettingRecord, href: "/profile/betting", icon: "History" },
  { label: BN.userCenter.accountRecord, href: "/profile/records", icon: "BookOpen" },
  { label: BN.userCenter.profitLoss, href: "/profile/pnl", icon: "TrendingUp" },
  { label: BN.userCenter.prizeCenter, href: "/profile/rewards", icon: "Gift", badge: 1 },
  { label: BN.userCenter.inviteFriends, href: "/profile/invite", icon: "Users" },
  { label: BN.userCenter.mission, href: "/profile/missions", icon: "Target", badge: 1 },
  { label: BN.userCenter.internalMessages, href: "/profile/messages", icon: "Mail", badge: 1 },
];

export function UserCenterSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-card border border-tcl-red/40 bg-tcl-black shadow-[0_0_28px_rgba(220,38,38,0.25)]",
        className,
      )}
    >
      <div className="bg-gradient-to-b from-tcl-red/35 to-tcl-red/5 px-5 py-6 text-center">
        <p className="font-display text-2xl leading-tight text-tcl-white">
          {BN.userCenter.title.split(" ")[0] ?? BN.userCenter.title}
        </p>
        <p className="font-display text-2xl leading-tight text-tcl-white">
          {BN.userCenter.title.split(" ").slice(1).join(" ") || " "}
        </p>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-1">
          {USER_CENTER_NAV.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              item.href === "/profile"
                ? pathname === "/profile"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-tcl-gold/15 text-tcl-gold shadow-[inset_3px_0_0_0_var(--color-tcl-gold)]"
                      : "text-tcl-white/80 hover:bg-tcl-surface-2 hover:text-tcl-white",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-4.5 shrink-0",
                      active ? "text-tcl-gold" : "text-tcl-white/70 group-hover:text-tcl-white",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-tcl-red text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
