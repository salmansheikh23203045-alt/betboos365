"use client";

import { useState } from "react";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { BN } from "@/i18n/bn";

export function ReferralCard({ code }: { code: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(text: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignored */
    }
  }

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/signup?ref=${code}`
      : `/signup?ref=${code}`;

  return (
    <NeonCard className="space-y-4">
      <div className="space-y-1">
        <p className="text-caption uppercase tracking-wider text-tcl-muted">
          {BN.referral.yourCode}
        </p>
        <div className="flex items-stretch gap-2">
          <div className="flex-1 inline-flex items-center rounded-md border border-tcl-gold/50 bg-tcl-black px-4 text-heading-md font-display tracking-[0.3em] text-tcl-gold">
            {code}
          </div>
          <button
            type="button"
            onClick={() => copy(code, "code")}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-tcl-gold bg-tcl-gold/10 px-3 text-sm font-semibold text-tcl-gold hover:bg-tcl-gold/20 cursor-pointer tap-feedback"
          >
            {copied === "code" ? (
              <ICONS.Check aria-hidden="true" className="size-4" />
            ) : (
              <ICONS.Copy aria-hidden="true" className="size-4" />
            )}
            {copied === "code" ? BN.common.copied : BN.common.copy}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-caption uppercase tracking-wider text-tcl-muted">
          {BN.referral.shareLink}
        </p>
        <div className="flex items-stretch gap-2">
          <input
            type="text"
            value={link}
            readOnly
            className="h-11 flex-1 rounded-md border border-tcl-border-muted bg-tcl-surface-2 px-3 text-sm text-tcl-white"
          />
          <button
            type="button"
            onClick={() => copy(link, "link")}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-tcl-gold bg-tcl-gold/10 px-3 text-sm font-semibold text-tcl-gold hover:bg-tcl-gold/20 cursor-pointer tap-feedback"
          >
            {copied === "link" ? (
              <ICONS.Check aria-hidden="true" className="size-4" />
            ) : (
              <ICONS.Copy aria-hidden="true" className="size-4" />
            )}
            {copied === "link" ? BN.common.copied : BN.common.copy}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
        {(
          [
            {
              label: "WhatsApp",
              href: `https://wa.me/?text=${encodeURIComponent(link)}`,
            },
            {
              label: "Telegram",
              href: `https://t.me/share/url?url=${encodeURIComponent(link)}`,
            },
            {
              label: "Facebook",
              href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
            },
            {
              label: "Twitter / X",
              href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`,
            },
          ] as const
        ).map((s) => (
          <SecondaryButton
            key={s.label}
            variant="outline"
            size="md"
            href={s.href}
            fullWidth
            icon="Share2"
          >
            {s.label}
          </SecondaryButton>
        ))}
      </div>
    </NeonCard>
  );
}
