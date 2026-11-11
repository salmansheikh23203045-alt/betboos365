"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";

type Status = "needs_attention" | "ok" | "info";

interface Row {
  icon: IconName;
  tone: "red" | "cyan" | "pink" | "gray";
  title: string;
  description: string;
  status: Status;
  onClick?: () => void;
}

export function SecurityPanel({
  hasEmail,
  onLogout,
}: {
  hasEmail: boolean;
  onLogout?: () => void;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const rows: Row[] = [
    {
      icon: "User",
      tone: "red",
      title: BN.userCenter.personalInfo,
      description: BN.userCenter.accountSecure,
      status: hasEmail ? "ok" : "needs_attention",
      onClick: () => router.push("/profile"),
    },
    {
      icon: "Lock",
      tone: "cyan",
      title: BN.userCenter.loginPassword,
      description: BN.userCenter.passwordHealthy,
      status: "ok",
    },
    {
      icon: "Wallet",
      tone: "pink",
      title: BN.userCenter.bindEWallet,
      description: BN.userCenter.bindWalletForWithdraw,
      status: "needs_attention",
      onClick: () => router.push("/profile/withdraw"),
    },
    {
      icon: "LogOut",
      tone: "gray",
      title: BN.userCenter.logout,
      description: BN.userCenter.logoutSafely,
      status: "info",
      onClick: async () => {
        if (!onLogout) return;
        setLoggingOut(true);
        await onLogout();
        setLoggingOut(false);
      },
    },
  ];

  const toneBg: Record<Row["tone"], string> = {
    red: "bg-gradient-to-br from-amber-400 to-amber-600",
    cyan: "bg-gradient-to-br from-cyan-400 to-cyan-600",
    pink: "bg-gradient-to-br from-pink-400 to-pink-600",
    gray: "bg-gradient-to-br from-tcl-red to-tcl-red/60",
  };

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const Icon = ICONS[row.icon];
        return (
          <button
            key={row.title}
            type="button"
            onClick={row.onClick}
            disabled={loggingOut && row.icon === "LogOut"}
            className="group flex w-full items-start gap-3 rounded-md border border-tcl-border-muted bg-tcl-surface-2 p-3 text-left transition-colors hover:border-tcl-gold/40 disabled:opacity-60"
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-[0_0_14px_rgba(0,0,0,0.3)]",
                toneBg[row.tone],
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-tcl-white">
                  {row.title}
                </span>
                {row.status === "needs_attention" ? (
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-tcl-red text-[10px] font-bold text-white">
                    !
                  </span>
                ) : row.status === "ok" ? (
                  <ICONS.CheckCircle2
                    aria-hidden="true"
                    className="size-4 text-tcl-success"
                  />
                ) : null}
              </span>
              <span className="mt-0.5 block text-[11px] text-tcl-muted">
                {row.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
