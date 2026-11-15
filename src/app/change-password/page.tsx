"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ICONS } from "@/lib/icons";
import { useAuth } from "@/components/auth/AuthProvider";

const POLICY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const inputClass =
  "h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted transition-colors focus:border-tcl-gold focus:outline-none focus:ring-1 focus:ring-tcl-gold/40 disabled:opacity-60";

/**
 * Password change. Accounts created with a temporary password are sent here
 * after sign-in and cannot use anything else until they finish; the backend
 * enforces that, this page only collects the new password.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const forced = Boolean(user?.mustChangePassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!current || !next || !confirm) return setError("Please fill in all three fields.");
    if (next.length < 8 || next.length > 64 || !POLICY.test(next)) {
      return setError("Use 8–64 characters with at least one uppercase letter, one lowercase letter and one digit.");
    }
    if (next !== confirm) return setError("The new passwords do not match.");
    if (next === current) return setError("The new password must be different from the current one.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        const msg = Array.isArray(body.message) ? body.message[0] : body.message;
        setError(
          res.status === 401
            ? "Your session has ended. Please sign in again."
            : msg || "Could not change the password. Please try again.",
        );
        setSubmitting(false);
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      await refresh();
      router.replace("/login?changed=1");
    } catch {
      setError("Network issue — please check your internet connection and try again.");
      setSubmitting(false);
    }
  }

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    autoComplete: string,
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-caption font-semibold text-tcl-white">
        {label}
      </label>
      <div className="relative">
        <ICONS.Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted" />
        <input
          id={id}
          type="password"
          value={value}
          onChange={(e) => set(e.target.value)}
          autoComplete={autoComplete}
          required
          maxLength={64}
          disabled={submitting}
          className={inputClass}
        />
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up flex min-h-[60vh] items-center justify-center px-4 py-8 sm:py-12">
      <NeonCard className="w-full max-w-md space-y-6 sm:space-y-7">
        <div className="text-center">
          <Logo size="md" className="mx-auto mb-4" />
          <h1 className="font-display text-display-xl uppercase text-gold-gradient">Change Password</h1>
          <p className="mt-1 text-caption text-tcl-muted">
            {forced
              ? "Your account uses a temporary password. Set a new one to continue."
              : "Choose a new password for your account."}
          </p>
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
          {field("cp-current", forced ? "Temporary password" : "Current password", current, setCurrent, "current-password")}
          {field("cp-new", "New password", next, setNext, "new-password")}
          {field("cp-confirm", "Confirm new password", confirm, setConfirm, "new-password")}
          <p className="text-caption text-tcl-muted">
            8–64 characters, with an uppercase letter, a lowercase letter and a digit. You will sign in again afterwards.
          </p>
          <PrimaryButton type="submit" fullWidth size="lg" className="mt-2" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Saving…" : "Save New Password"}
          </PrimaryButton>
        </form>
      </NeonCard>
    </div>
  );
}
