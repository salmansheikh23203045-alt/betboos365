"use client";

import { useState } from "react";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";
import type { SessionUser } from "@/components/auth/AuthProvider";
import type { WalletView } from "@/types/wallet";

interface Props {
  user: SessionUser;
  wallet: WalletView | null;
  joinedOn?: string | null;
  lastLoginIp?: string | null;
  lastLoginAt?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  variant?: "desktop" | "mobile";
}

export function UserInfoCard({
  user,
  wallet,
  joinedOn,
  lastLoginIp,
  lastLoginAt,
  onRefresh,
  refreshing = false,
  variant = "desktop",
}: Props) {
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }

  const balanceDisplay = hidden
    ? "******"
    : wallet
      ? `${wallet.currency} ${wallet.availableBalance.toLocaleString()}`
      : "— —";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-tcl-red/40 bg-gradient-to-br from-tcl-surface-2 to-tcl-black p-5 shadow-[0_0_20px_rgba(220,38,38,0.2)]",
        variant === "mobile" ? "space-y-4" : "space-y-5",
      )}
    >
      {/* Top: avatar + id + VIP + edit */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-tcl-gold bg-tcl-surface-2 shadow-[0_0_14px_rgba(255,215,0,0.35)]">
            <ICONS.User aria-hidden="true" className="size-9 text-tcl-gold" />
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-tcl-red to-tcl-red/70 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]">
              <ICONS.Crown aria-hidden="true" className="size-3 text-tcl-gold" />
              VIP0
            </span>
            {user.roles.includes("admin") || user.roles.includes("super_admin") ? (
              <span className="inline-flex rounded-md border border-tcl-gold/60 bg-tcl-gold/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tcl-gold">
                Admin
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-lg uppercase text-tcl-white">
              {user.username}
            </p>
            <button
              type="button"
              onClick={copyId}
              aria-label={BN.userCenter.copyUserId}
              className="rounded p-1 text-tcl-muted hover:text-tcl-gold"
            >
              <ICONS.Copy aria-hidden="true" className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={BN.userCenter.editProfile}
              className="rounded p-1 text-tcl-muted hover:text-tcl-gold"
            >
              <ICONS.Pencil aria-hidden="true" className="size-3.5" />
            </button>
            {copied ? (
              <span className="text-[10px] text-tcl-success">
                {BN.common.copied}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-tcl-muted">
            {BN.userCenter.nickname}: {user.firstName || user.username}
          </p>
          {joinedOn ? (
            <p className="text-[11px] text-tcl-muted">
              {BN.userCenter.joinedOn}:{" "}
              {new Date(joinedOn).toISOString().slice(0, 10)}
            </p>
          ) : null}
        </div>
      </div>

      {/* Balance row */}
      <div className="flex items-center gap-3">
        <p className="font-display text-3xl uppercase text-tcl-white">
          ৳ {balanceDisplay}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          aria-label={BN.userCenter.refreshBalance}
          className="rounded-full p-1.5 text-tcl-muted hover:text-tcl-gold"
        >
          <ICONS.History
            aria-hidden="true"
            className={cn("size-4", refreshing && "animate-spin")}
          />
        </button>
        <button
          type="button"
          onClick={() => setHidden((v) => !v)}
          aria-label={hidden ? BN.userCenter.showBalance : BN.userCenter.hideBalance}
          className="rounded-full p-1.5 text-tcl-muted hover:text-tcl-gold"
        >
          {hidden ? (
            <ICONS.Eye aria-hidden="true" className="size-4" />
          ) : (
            <ICONS.EyeOff aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      {/* Activity: pending + last login */}
      {variant === "desktop" ? (
        <ul className="space-y-2 text-caption">
          <li className="flex items-center gap-2 text-tcl-white/80">
            <ICONS.ArrowDownCircle
              aria-hidden="true"
              className="size-4 text-tcl-info"
            />
            <span className="flex-1">
              0 {BN.userCenter.pendingDepositRequest}
            </span>
            <span className="text-[11px] text-tcl-muted">
              {new Date().toLocaleDateString()}
            </span>
          </li>
          <li className="flex items-center gap-2 text-tcl-white/80">
            <ICONS.ArrowUpCircle
              aria-hidden="true"
              className="size-4 text-tcl-info"
            />
            <span className="flex-1">
              0 {BN.userCenter.pendingWithdrawRequest}
            </span>
            <span className="text-[11px] text-tcl-muted">
              {new Date().toLocaleDateString()}
            </span>
          </li>
          <li className="flex items-center gap-2 text-tcl-white/80">
            <ICONS.ShieldCheck
              aria-hidden="true"
              className="size-4 text-tcl-gold"
            />
            <div className="flex-1 space-y-0.5">
              <p className="leading-tight">
                {BN.userCenter.lastLoginTime}:{" "}
                <span className="text-tcl-white">
                  {lastLoginAt
                    ? new Date(lastLoginAt).toLocaleString()
                    : new Date().toLocaleString()}
                </span>
              </p>
              <p className="leading-tight text-tcl-muted">
                {BN.userCenter.lastLoginIp}:{" "}
                <span className="text-tcl-white/70">
                  {lastLoginIp ?? "—"}
                </span>
              </p>
            </div>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
