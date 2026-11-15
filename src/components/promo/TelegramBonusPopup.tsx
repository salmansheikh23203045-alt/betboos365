"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { notifyWalletChanged } from "@/components/wallet/WalletBalanceProvider";
import { Logo } from "@/components/ui/Logo";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatBdt } from "@/lib/money";
import { isRestrictedStaff, isSuperAdmin } from "@/lib/roles";

/** Set by the login page; consumed here so the popup shows once per sign-in. */
export const TG_POPUP_FLAG = "bb365:tg-popup";
const ONBOARDING_FLAG = "tcl_show_onboarding";

interface BonusStatus {
  enabled: boolean;
  amount: number;
  groupUrl: string;
  linked: boolean;
  claimed: boolean;
}

type Phase = "intro" | "verify" | "linking" | "claiming" | "success" | "error";

async function api<T>(path: string, method: "GET" | "POST" = "GET") {
  const res = await fetch(path, { method, cache: "no-store", headers: { "content-type": "application/json" } });
  const body = (await res.json().catch(() => ({}))) as { data?: T; message?: string | string[] };
  const message = Array.isArray(body.message) ? body.message[0] : body.message;
  return res.ok ? { ok: true as const, data: body.data as T } : { ok: false as const, status: res.status, message };
}

/**
 * "Join our community" popup shown after a player signs in. The ৳30 is only
 * credited by the backend after Telegram confirms the player's linked
 * Telegram account is in the group; the buttons here never credit anything.
 */
export function TelegramBonusPopup() {
  const { user } = useAuth();
  const [status, setStatus] = useState<BonusStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pollStarted = useRef(0);

  const eligibleUser = Boolean(
    user && !isRestrictedStaff(user.roles) && !isSuperAdmin(user.roles) && !user.mustChangePassword,
  );

  // Decide whether to show: only right after a sign-in, only for players, only
  // when verification is live and the bonus has not been paid.
  useEffect(() => {
    if (!eligibleUser) return;
    let flagged = false;
    try {
      flagged = window.sessionStorage.getItem(TG_POPUP_FLAG) === "1";
      if (flagged) window.sessionStorage.removeItem(TG_POPUP_FLAG);
      if (window.localStorage.getItem(ONBOARDING_FLAG) === "1") flagged = false;
    } catch {
      return;
    }
    if (!flagged) return;
    let cancelled = false;
    void api<BonusStatus>("/api/me/bonus/telegram").then((r) => {
      if (cancelled || !r.ok) return;
      setStatus(r.data);
      if (r.data.enabled && !r.data.claimed) {
        setPhase("intro");
        setOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [eligibleUser, user?.id]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const prepareLink = useCallback(async () => {
    const r = await api<{ deepLink: string }>("/api/me/bonus/telegram/link", "POST");
    if (r.ok) {
      setDeepLink(r.data.deepLink);
      return true;
    }
    setError(r.message ?? "Could not start verification. Please try again.");
    setPhase("error");
    return false;
  }, []);

  const claim = useCallback(async () => {
    setPhase("claiming");
    setError(null);
    const r = await api<{ amount: number; balance: number }>("/api/me/bonus/telegram/claim", "POST");
    if (r.ok) {
      setBalance(r.data.balance);
      setStatus((s) => (s ? { ...s, claimed: true, linked: true } : s));
      setPhase("success");
      notifyWalletChanged();
      return;
    }
    setError(r.message ?? "Verification failed. Please try again.");
    setPhase("error");
  }, []);

  function onJoin() {
    // Plain link to the group; opening it proves nothing and records nothing.
    setPhase("verify");
    setError(null);
    if (status && !status.linked) void prepareLink();
  }

  function onVerifyLinked() {
    void claim();
  }

  function onOpenBot() {
    // The anchor opens the bot; wait here for the webhook to link the account.
    pollStarted.current = Date.now();
    setPhase("linking");
  }

  // While the player is in the bot, watch for the link, then claim.
  useEffect(() => {
    if (phase !== "linking") return;
    let stopped = false;
    const tick = async () => {
      const r = await api<BonusStatus>("/api/me/bonus/telegram");
      if (stopped || !r.ok) return;
      if (r.data.claimed) {
        setStatus(r.data);
        setPhase("success");
        notifyWalletChanged();
      } else if (r.data.linked) {
        setStatus(r.data);
        void claim();
      } else if (Date.now() - pollStarted.current > 5 * 60_000) {
        setError("We did not hear from the bot. Tap Verify & Claim again and press START in Telegram.");
        setDeepLink(null);
        setPhase("error");
      }
    };
    const id = window.setInterval(tick, 2500);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [phase, claim]);

  async function onRetry() {
    setError(null);
    const r = await api<BonusStatus>("/api/me/bonus/telegram");
    if (!r.ok) {
      setError(r.message ?? "Please try again.");
      return;
    }
    setStatus(r.data);
    if (r.data.claimed) return setPhase("success");
    if (r.data.linked) return void claim();
    setDeepLink(null);
    setPhase("verify");
    void prepareLink();
  }

  if (!open || !status || typeof window === "undefined") return null;
  const amount = formatBdt(status.amount);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div aria-hidden="true" className="tg-popup-backdrop absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tg-popup-title"
        tabIndex={-1}
        className={cn(
          "tg-popup-card relative w-full max-w-md overflow-hidden outline-none",
          "rounded-t-2xl border border-tcl-gold/40 sm:rounded-2xl",
          "bg-[radial-gradient(120%_80%_at_50%_0%,rgba(229,9,20,0.35)_0%,rgba(10,10,12,0.98)_55%)] bg-tcl-black",
          "shadow-[0_0_0_1px_rgba(255,215,0,0.08),0_24px_80px_-12px_rgba(229,9,20,0.55)]",
        )}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-tcl-gold/20 blur-3xl" />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full text-tcl-muted transition-colors hover:bg-white/5 hover:text-tcl-white cursor-pointer"
        >
          <ICONS.X aria-hidden="true" className="size-5" />
        </button>

        <div className="relative space-y-5 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 text-center sm:px-8 sm:pb-6">
          <Logo size="sm" className="mx-auto" />

          {phase === "success" ? (
            <SuccessBody amount={amount} balance={balance} onClose={close} />
          ) : (
            <>
              <div className="space-y-2">
                <h2 id="tg-popup-title" className="font-display text-3xl uppercase leading-none text-gold-gradient sm:text-4xl">
                  Join Our Community
                </h2>
                <p className="text-sm leading-relaxed text-tcl-white/80">
                  Join our official community and receive a {amount} welcome bonus.
                </p>
              </div>

              <div className="tg-reward mx-auto flex w-fit items-center gap-3 rounded-2xl border border-tcl-gold/50 bg-gradient-to-br from-tcl-gold/20 via-tcl-gold/5 to-transparent px-5 py-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-tcl-gold to-amber-500 text-tcl-black shadow-[0_0_20px_rgba(255,215,0,0.45)]">
                  <ICONS.Gift aria-hidden="true" className="size-5" />
                </span>
                <span className="text-left">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-tcl-gold/80">Welcome bonus</span>
                  <span className="block font-display text-3xl leading-none text-tcl-gold">
                    {amount} <span className="text-base text-tcl-white/70">BDT</span>
                  </span>
                </span>
              </div>

              {phase !== "intro" ? (
                <ol className="space-y-2 text-left text-sm">
                  <StepRow done label="Open the BetBoos365 Telegram group and tap Join" />
                  <StepRow
                    done={status.linked}
                    active={!status.linked}
                    label={status.linked ? "Telegram account linked" : "Tap Verify & Claim, then press START in our bot"}
                  />
                  <StepRow active={status.linked} label={`Membership checked and ${amount} credited`} />
                </ol>
              ) : null}

              {phase === "linking" ? (
                <p role="status" className="flex items-center justify-center gap-2 text-sm text-tcl-white/80">
                  <ICONS.Loader2 aria-hidden="true" className="size-4 animate-spin text-tcl-gold" />
                  Waiting for you to press START in Telegram…
                </p>
              ) : null}
              {phase === "claiming" ? (
                <p role="status" className="flex items-center justify-center gap-2 text-sm text-tcl-white/80">
                  <ICONS.Loader2 aria-hidden="true" className="size-4 animate-spin text-tcl-gold" />
                  Checking your membership with Telegram…
                </p>
              ) : null}
              {phase === "error" && error ? (
                <p role="alert" className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-left text-sm text-tcl-red-bright">
                  {error}
                </p>
              ) : null}

              <div className="space-y-2.5">
                {phase === "intro" ? (
                  <a
                    href={status.groupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onJoin}
                    className={ctaPrimary}
                  >
                    <ICONS.Send aria-hidden="true" className="size-5" />
                    Join Telegram Group
                  </a>
                ) : phase === "verify" && status.linked ? (
                  <button type="button" onClick={onVerifyLinked} className={ctaPrimary}>
                    <ICONS.ShieldCheck aria-hidden="true" className="size-5" />
                    Verify &amp; Claim {amount}
                  </button>
                ) : phase === "verify" ? (
                  deepLink ? (
                    <a href={deepLink} target="_blank" rel="noopener noreferrer" onClick={onOpenBot} className={ctaPrimary}>
                      <ICONS.ShieldCheck aria-hidden="true" className="size-5" />
                      Verify &amp; Claim {amount}
                    </a>
                  ) : (
                    <button type="button" disabled className={cn(ctaPrimary, "opacity-60")}>
                      <ICONS.Loader2 aria-hidden="true" className="size-5 animate-spin" />
                      Preparing verification…
                    </button>
                  )
                ) : phase === "error" ? (
                  <button type="button" onClick={() => void onRetry()} className={ctaPrimary}>
                    <ICONS.RefreshCw aria-hidden="true" className="size-5" />
                    Try Again
                  </button>
                ) : null}

                {phase !== "intro" ? (
                  <a
                    href={status.groupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs font-semibold text-[#36A9E1] underline-offset-2 hover:underline"
                  >
                    Open the Telegram group again
                  </a>
                ) : null}

                <button type="button" onClick={close} className={ctaSecondary}>
                  Close
                </button>
              </div>

              <p className="text-[11px] leading-relaxed text-tcl-muted">
                One {amount} bonus per player account and per Telegram account. Credited only after Telegram confirms you
                are a member of the official group. Leaving and re-joining does not earn another bonus.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const ctaPrimary = cn(
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold uppercase tracking-wide text-white",
  "bg-gradient-to-r from-[#229ED9] to-[#1E88C7] shadow-[0_8px_24px_-6px_rgba(34,158,217,0.7)]",
  "transition-[transform,filter] hover:brightness-110 active:scale-[0.98] cursor-pointer",
);
const ctaSecondary = cn(
  "flex h-11 w-full items-center justify-center rounded-xl border border-tcl-border-muted bg-tcl-surface-2/60 px-4",
  "text-sm font-semibold uppercase tracking-wide text-tcl-white/80 transition-colors hover:border-tcl-gold/50 hover:text-tcl-white cursor-pointer",
);

function StepRow({ label, done, active }: { label: string; done?: boolean; active?: boolean }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
          done ? "border-tcl-gold bg-tcl-gold text-tcl-black" : active ? "border-tcl-gold text-tcl-gold" : "border-tcl-border-muted text-tcl-muted",
        )}
      >
        {done ? <ICONS.Check aria-hidden="true" className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <span className={cn(done ? "text-tcl-white/60 line-through decoration-tcl-gold/40" : active ? "text-tcl-white" : "text-tcl-muted")}>
        {label}
      </span>
    </li>
  );
}

function SuccessBody({ amount, balance, onClose }: { amount: string; balance: number | null; onClose: () => void }) {
  return (
    <div className="space-y-4" role="status">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-tcl-gold to-amber-500 shadow-[0_0_28px_rgba(255,215,0,0.55)]">
        <ICONS.Check aria-hidden="true" className="size-9 text-tcl-black" />
      </span>
      <h2 id="tg-popup-title" className="font-display text-3xl uppercase text-gold-gradient">Bonus Credited</h2>
      <p className="text-sm text-tcl-white/80">
        Telegram confirmed your membership. {amount} has been added to your wallet.
      </p>
      {balance !== null ? (
        <p className="text-sm text-tcl-muted">
          New balance: <span className="font-semibold text-tcl-gold">{formatBdt(balance)}</span>
        </p>
      ) : null}
      <button type="button" onClick={onClose} className={ctaPrimary}>
        Done
      </button>
    </div>
  );
}
