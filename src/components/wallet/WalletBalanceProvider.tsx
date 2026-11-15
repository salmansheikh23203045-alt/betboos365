"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isRestrictedStaff } from "@/lib/roles";

const WALLET_CHANGED = "bb365:wallet-changed";
const POLL_MS = 30_000;
// Focus, visibility and mount often fire together; one read covers them all.
const PASSIVE_GAP_MS = 2_000;

/**
 * Tell the header balance to re-read the wallet now (after a deposit request,
 * withdrawal, bonus claim…). The balance always comes from the backend; this
 * only triggers a fetch.
 */
export function notifyWalletChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(WALLET_CHANGED));
}

interface WalletBalanceState {
  /** Available balance in BDT, or null while unknown / not applicable. */
  balance: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<WalletBalanceState>({ balance: null, loading: false, refresh: async () => {} });

/**
 * Read-only view of the signed-in player's wallet balance for the header.
 * Refreshes on sign-in, on notifyWalletChanged(), when the tab regains focus,
 * and every 30s while visible (deposits are approved by staff elsewhere).
 */
export function WalletBalanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const applies = Boolean(user && !isRestrictedStaff(user.roles) && !user.mustChangePassword);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  const lastRead = useRef(0);

  const refresh = useCallback(async () => {
    if (!applies) {
      setBalance(null);
      return;
    }
    const mine = ++seq.current;
    lastRead.current = Date.now();
    setLoading(true);
    try {
      const res = await fetch("/api/me/wallet", { cache: "no-store" });
      if (mine !== seq.current) return;
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) setBalance(null);
        return;
      }
      const body = (await res.json()) as { data?: { availableBalance?: number } };
      const value = Number(body.data?.availableBalance);
      setBalance(Number.isFinite(value) ? value : null);
    } catch {
      /* keep the last known value on a network blip */
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [applies]);

  useEffect(() => {
    // Covers sign-in, sign-out and account switches.
    seq.current++;
    setBalance(null);
    if (!applies) return;
    void refresh();
    // A wallet change always re-reads; passive triggers skip if a read just happened.
    const onChange = () => void refresh();
    const passive = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRead.current > PASSIVE_GAP_MS) void refresh();
    };
    const onVisible = passive;
    const timer = window.setInterval(passive, POLL_MS);
    window.addEventListener(WALLET_CHANGED, onChange);
    window.addEventListener("focus", passive);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(WALLET_CHANGED, onChange);
      window.removeEventListener("focus", passive);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applies, user?.id, refresh]);

  const value = useMemo(() => ({ balance, loading, refresh }), [balance, loading, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWalletBalance = () => useContext(Ctx);
