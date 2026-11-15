import type { Metadata } from "next";
import Link from "next/link";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";

export const metadata: Metadata = { title: "পাসওয়ার্ড রিসেট | BetBoos365" };

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fade-in-up mx-auto grid min-h-[calc(100dvh-180px)] w-full max-w-md items-center px-4 py-10">
      <NeonCard className="space-y-5">
        <div className="text-center">
          <ICONS.Lock aria-hidden="true" className="mx-auto mb-3 size-10 text-tcl-gold" />
          <h1 className="font-display text-heading-lg uppercase text-tcl-white">
            {BN.auth.resetPassword}
          </h1>
          <p className="mt-1 text-caption text-tcl-muted">{BN.auth.resetInstructions}</p>
        </div>

        <div className="rounded-md border border-tcl-gold/40 bg-tcl-gold/10 px-3 py-2 text-caption text-tcl-gold">
          <p className="font-semibold">{BN.auth.forgotPendingTitle}</p>
          <p className="mt-1 text-tcl-muted">{BN.auth.forgotPendingBody}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="fp-phone" className="text-caption font-semibold text-tcl-white">
            {BN.auth.phone}
          </label>
          <div className="relative">
            <ICONS.Phone
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tcl-muted"
            />
            <input
              id="fp-phone"
              type="tel"
              inputMode="tel"
              placeholder="01XXXXXXXXX"
              className="h-11 w-full rounded-md border border-tcl-border-muted bg-tcl-surface-2 pl-10 pr-4 text-sm text-tcl-white placeholder:text-tcl-muted focus:border-tcl-gold focus:outline-none"
            />
          </div>
        </div>

        <PrimaryButton href="/contact" size="md" fullWidth icon="Headset">
          {BN.common.contactSupport}
        </PrimaryButton>

        <div className="flex items-center justify-center gap-2 text-caption text-tcl-muted">
          <ICONS.ChevronLeft aria-hidden="true" className="size-4" />
          <Link href="/login" className="text-tcl-gold hover:underline">
            {BN.auth.signInInstead}
          </Link>
        </div>

        <p className="text-[11px] text-tcl-muted text-center">
          {BN.auth.noAccount}{" "}
          <Link href="/signup" className="text-tcl-gold hover:underline">
            {BN.auth.createAccount}
          </Link>
        </p>
      </NeonCard>
    </div>
  );
}
