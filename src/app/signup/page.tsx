"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ICONS } from "@/lib/icons";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SignupPage() {
  const [showPw, setShowPw] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !username || !phone || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
      setError("Username must be 3–32 characters using letters, digits, dots, underscores, or hyphens.");
      return;
    }
    if (!acceptTerms) {
      setError("You must accept the Terms and Privacy Policy to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("Password must contain an uppercase letter, lowercase letter and digit.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          phone,
          password,
          acceptTerms,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({ message: "Signup failed" }))) as { message?: string };
        setError(body.message ?? "Signup failed. Please try again.");
        setSubmitting(false);
        return;
      }
      await refresh();
      startTransition(() => {
        router.replace("/profile");
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
          <h1 className="font-display text-display-xl uppercase text-gold-gradient">Sign Up</h1>
          <p className="mt-1 text-caption text-tcl-muted">Create your free account to get started.</p>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="signup-first" className="text-caption font-semibold text-tcl-white">
                First Name
              </label>
              <input
                id="signup-first"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                autoComplete="given-name"
                required
                disabled={submitting}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="signup-last" className="text-caption font-semibold text-tcl-white">
                Last Name
              </label>
              <input
                id="signup-last"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                autoComplete="family-name"
                required
                disabled={submitting}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

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
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none disabled:opacity-60"
              />
            </div>
            <p className="text-[11px] text-tcl-muted">3–32 characters. Letters, digits, dots, underscores, or hyphens.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-phone" className="text-caption font-semibold text-tcl-white">
              Phone
            </label>
            <div className="relative">
              <ICONS.Phone aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX XXXXXX"
                autoComplete="tel"
                required
                disabled={submitting}
                className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none disabled:opacity-60"
              />
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
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                minLength={8}
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

          <label className="flex items-start gap-2 text-caption text-tcl-muted">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 accent-tcl-gold"
            />
            <span>
              I am 18+ and agree to the{" "}
              <Link href="/terms" className="text-tcl-gold hover:underline">Terms & Conditions</Link> and{" "}
              <Link href="/privacy" className="text-tcl-gold hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          <PrimaryButton type="submit" fullWidth size="lg" disabled={submitting}>
            {submitting ? "Creating account…" : "Create Account"}
          </PrimaryButton>
        </form>

        <p className="text-center text-caption text-tcl-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-tcl-gold hover:underline">
            Log In
          </Link>
        </p>
      </NeonCard>
    </div>
  );
}
