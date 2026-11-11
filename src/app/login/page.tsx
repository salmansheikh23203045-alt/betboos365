"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ICONS } from "@/lib/icons";
import { useAuth } from "@/components/auth/AuthProvider";

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
      setError("Please enter your username and password.");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
      setError("Username must be 3–32 characters using letters, digits, dots, underscores, or hyphens.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ message: "Login failed" }))) as { message?: string };
        setError(body.message ?? "Login failed. Please try again.");
        setSubmitting(false);
        return;
      }
      await refresh();
      const next = search.get("next") || "/profile";
      startTransition(() => {
        router.replace(next);
        router.refresh();
      });
    } catch {
      setError("Network error. Please check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in-up flex min-h-[60vh] items-center justify-center px-4 py-10">
      <NeonCard className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo size="md" className="mx-auto mb-4" />
          <h1 className="font-display text-display-xl uppercase text-gold-gradient">Log In</h1>
          <p className="mt-1 text-caption text-tcl-muted">Welcome back! Sign in to your account.</p>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-tcl-red/40 bg-tcl-red/10 px-3 py-2 text-caption text-tcl-red-bright"
          >
            {error}
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
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none disabled:opacity-60"
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
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-10 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                disabled={submitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tcl-muted hover:text-tcl-white cursor-pointer disabled:opacity-60"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <ICONS.EyeOff className="size-4" /> : <ICONS.Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-1">
            <Link
              href="/forgot-password"
              className="text-caption text-tcl-gold hover:underline"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </Link>
          </div>

          <PrimaryButton type="submit" fullWidth size="lg" className="mt-2" disabled={submitting}>
            {submitting ? "Logging in…" : "লগ ইন"}
          </PrimaryButton>
        </form>

        <p className="text-center text-caption text-tcl-muted">
          অ্যাকাউন্ট নেই?{" "}
          <Link href="/signup" className="font-semibold text-tcl-gold hover:underline">
            সাইন আপ
          </Link>
        </p>
      </NeonCard>
    </div>
  );
}
