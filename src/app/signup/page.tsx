"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Coins, UserPlus } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [currency, setCurrency] = useState("BDT");
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const national = phone.replace(/[\s-]/g, "").replace(/^(\+?880|0)/, "");
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
      return setError("Username must be 3–32 characters using letters, digits, dots, underscores, or hyphens.");
    }
    if (!/^1[3-9]\d{8}$/.test(national)) {
      return setError("Enter a valid Bangladeshi mobile number, for example 01712345678.");
    }
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return setError("Password must be at least 8 characters with an uppercase letter, a lowercase letter and a digit.");
    }
    if (!acceptTerms) {
      return setError("Please confirm you are 18 or older and accept the Terms & Conditions.");
    }

    setSubmitting(true);
    setShowPw(false);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username,
          phone: `+880${national}`,
          password,
          acceptTerms,
          currency,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(
          res.status >= 500
            ? "We can't reach the server right now. Please try again in a moment."
            : body.message ?? "Signup failed. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      await refresh();
      try {
        window.localStorage.setItem("tcl_show_onboarding", "1");
      } catch {
        /* ignore storage failures */
      }
      startTransition(() => {
        router.replace("/profile");
        router.refresh();
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in-up flex min-h-[60vh] items-center justify-center px-4 py-8 sm:py-12">
      <NeonCard className="w-full max-w-md space-y-6 sm:space-y-7">
        <div className="text-center">
          <Logo size="md" className="mx-auto mb-4" />
          <h1 className="font-display text-display-xl uppercase text-gold-gradient">Sign Up</h1>
          <p className="mt-1 text-caption text-tcl-muted">Create your account to get started.</p>
        </div>

        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2 rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2.5 text-caption text-tcl-red-bright"
          >
            <ICONS.AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="signup-username" className="text-caption font-semibold text-tcl-white">
              Username
            </label>
            <div className="relative">
              <ICONS.User aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
              <input
                id="signup-username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                minLength={3}
                maxLength={32}
                disabled={submitting}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted transition-colors focus:border-tcl-gold focus:outline-none focus:ring-1 focus:ring-tcl-gold/40 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-phone" className="text-caption font-semibold text-tcl-white">
              Phone Number
            </label>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
              <div className="flex h-11 items-center gap-2 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm font-semibold text-tcl-white">
                <Image
                  src="/images/flags/bangladesh.png"
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 rounded-full object-cover"
                />
                <span>+880</span>
              </div>
              <div className="relative">
                <ICONS.Phone aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
                <input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+-]/g, ""))}
                  placeholder="01712345678"
                  autoComplete="tel-national"
                  required
                  maxLength={16}
                  disabled={submitting}
                  className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted transition-colors focus:border-tcl-gold focus:outline-none focus:ring-1 focus:ring-tcl-gold/40 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-pw" className="text-caption font-semibold text-tcl-white">
              Password
            </label>
            <div className="relative">
              <ICONS.Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
              <input
                id="signup-pw"
                name="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="new-password"
                required
                maxLength={64}
                disabled={submitting}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-10 text-sm text-tcl-white placeholder:text-tcl-muted transition-colors focus:border-tcl-gold focus:outline-none focus:ring-1 focus:ring-tcl-gold/40 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                disabled={submitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tcl-muted transition-colors hover:text-tcl-white focus:text-tcl-white focus:outline-none disabled:opacity-60"
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
              >
                {showPw ? <ICONS.EyeOff className="size-4" /> : <ICONS.Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-currency" className="text-caption font-semibold text-tcl-white">
              Currency
            </label>
            <div className="relative">
              <Coins aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
              <select
                id="signup-currency"
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={submitting}
                className="h-11 w-full appearance-none rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-10 text-sm text-tcl-white transition-colors focus:border-tcl-gold focus:outline-none focus:ring-1 focus:ring-tcl-gold/40 disabled:opacity-60"
              >
                <option value="BDT">BDT</option>
              </select>
              <ICONS.ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setShowReferral((v) => !v)}
              aria-expanded={showReferral}
              className="flex w-full items-center justify-between rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 py-2.5 text-sm text-tcl-white hover:border-tcl-gold/50"
            >
              <span className="flex items-center gap-2">
                <ICONS.Tag aria-hidden="true" className="size-4 text-tcl-muted" />
                Referral Code (Optional)
              </span>
              <ICONS.ChevronDown
                aria-hidden="true"
                className={cn("size-4 text-tcl-muted transition-transform", showReferral && "rotate-180")}
              />
            </button>
            {showReferral ? (
              <input
                id="signup-referral"
                name="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code"
                autoCapitalize="characters"
                maxLength={32}
                disabled={submitting}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm text-tcl-white placeholder:text-tcl-muted transition-colors focus:border-tcl-gold focus:outline-none focus:ring-1 focus:ring-tcl-gold/40 disabled:opacity-60"
              />
            ) : null}
          </div>

          <label className="flex cursor-pointer items-start gap-2 pt-1">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={submitting}
              className="mt-1 size-4 shrink-0 cursor-pointer rounded border-tcl-border-muted bg-tcl-surface-2 accent-tcl-red checked:border-tcl-red focus:ring-0"
            />
            <span className="text-caption text-tcl-muted">
              I confirm that I am 18 years old and I have read the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-semibold text-tcl-gold transition-colors hover:text-tcl-gold-bright hover:underline"
              >
                Terms &amp; Conditions
              </Link>
            </span>
          </label>

          <PrimaryButton
            type="submit"
            fullWidth
            size="lg"
            className="mt-2"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <ICONS.Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Creating account…
              </span>
            ) : (
              "Sign Up"
            )}
          </PrimaryButton>
        </form>

        <p className="text-center text-caption text-tcl-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-tcl-gold transition-colors hover:text-tcl-gold-bright hover:underline"
          >
            Log In
          </Link>
        </p>
      </NeonCard>
    </div>
  );
}
