"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ICONS } from "@/lib/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolveNext } from "@/lib/roles";
import { TG_POPUP_FLAG } from "@/components/promo/TelegramBonusPopup";

function friendlyLoginError(status: number, raw: string | undefined): string {
  // Backend process unreachable (our BFF synthesises 503 when fetch itself
  // fails — ECONNREFUSED / ENOTFOUND / aborted / DNS). Never leak the raw
  // "fetch failed" text to users.
  if (status === 503 || /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(raw ?? "")) {
    return "We can't reach the server right now. Please try again in a moment.";
  }
  if (status === 401) {
    return "Incorrect username or password.";
  }
  if (status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (status >= 500) {
    return "The server is having trouble. Please try again shortly.";
  }
  // Validation errors from the backend (400/409) — surface them if they
  // look user-friendly, otherwise fall back to a generic message.
  if (raw && raw.length < 180 && !/fetch failed/i.test(raw)) return raw;
  return "Sign-in failed. Please try again.";
}

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const search = useSearchParams();
  const { refresh } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Please enter both your username and password.");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
      setError("Username must be 3–32 characters: letters, numbers, dot, underscore or hyphen only.");
      return;
    }

    setSubmitting(true);
    // Hide the password as soon as the request leaves — reduces the window
    // where a credential can be read off the screen if the user walks away.
    setShowPw(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(friendlyLoginError(res.status, body.message));
        setSubmitting(false);
        return;
      }
      // Each role lands directly on its own area: Admin and Sub Admin on the
      // Admin Dashboard, Agent on the Agent Dashboard, players on their profile.
      const body = (await res.json().catch(() => ({}))) as {
        user?: { roles?: string[]; mustChangePassword?: boolean };
      };
      // Show the community bonus popup once for this sign-in (players only;
      // the popup re-checks eligibility with the backend).
      try {
        window.sessionStorage.setItem(TG_POPUP_FLAG, "1");
      } catch {
        /* storage blocked: no popup */
      }
      await refresh();
      // A temporary password must be replaced before anything else; the API
      // refuses other requests until it is.
      const next = body.user?.mustChangePassword
        ? "/change-password"
        : resolveNext(body.user?.roles ?? [], search.get("next"));
      startTransition(() => {
        router.replace(next);
        router.refresh();
      });
    } catch {
      setError("Network issue — please check your internet connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in-up flex min-h-[60vh] items-center justify-center px-4 py-8 sm:py-12">
      <NeonCard className="w-full max-w-md space-y-6 sm:space-y-7">
        <div className="text-center">
          <Logo size="md" className="mx-auto mb-4" />
          <h1 className="font-display text-display-xl uppercase text-gold-gradient">Log In</h1>
          <p className="mt-1 text-caption text-tcl-muted">Welcome back! Sign in to your account.</p>
        </div>

        {search.get("changed") === "1" && !error ? (
          <div
            role="status"
            className="rounded-md border border-tcl-gold/40 bg-tcl-gold/10 px-3 py-2.5 text-caption text-tcl-white"
          >
            Password changed. Sign in with your new password.
          </div>
        ) : null}

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
            <label htmlFor="login-username" className="text-caption font-semibold text-tcl-white">
              Username
            </label>
            <div className="relative">
              <ICONS.User aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
              <input
                id="login-username"
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
            <label htmlFor="login-pw" className="text-caption font-semibold text-tcl-white">
              Password
            </label>
            <div className="relative">
              <ICONS.Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
              <input
                id="login-pw"
                name="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
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

          <div className="-mt-1 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-caption text-tcl-gold transition-colors hover:text-tcl-gold-bright hover:underline"
            >
              Forgot password?
            </Link>
          </div>

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
                Signing in…
              </span>
            ) : (
              "Log In"
            )}
          </PrimaryButton>
        </form>

        <p className="text-center text-caption text-tcl-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-tcl-gold transition-colors hover:text-tcl-gold-bright hover:underline"
          >
            Sign up
          </Link>
        </p>
      </NeonCard>
    </div>
  );
}
