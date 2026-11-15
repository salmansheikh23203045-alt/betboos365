import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import type { PayoutAccount } from "@/lib/wallet-client";

/** Exact wording of the withdrawal rule, shown wherever a withdrawal is requested. */
export const WITHDRAW_NUMBER_NOTICE_BN =
  "শুধুমাত্র আপনার signup (মোবাইল নম্বর) টাকা উত্তোলন করা যাবে। অন্য কোনো নম্বরে টাকা উত্তোলন গ্রহণযোগ্য নয়।";

/** "+8801712345678" -> "+880 1712-345678" for reading; the stored value is unchanged. */
export function displayBdPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const m = /^\+880(\d{4})(\d{6})$/.exec(phone);
  return m ? `+880 ${m[1]}-${m[2]}` : phone;
}

/**
 * The one number a withdrawal can be paid to, with the rule in Bengali.
 * Display only: the backend never takes a payout number from the request and
 * refuses any other number.
 */
export function RegisteredNumberNotice({
  payout,
  compact = false,
  className,
}: {
  payout: PayoutAccount | null;
  compact?: boolean;
  className?: string;
}) {
  const verified = payout?.verified === true;
  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border bg-tcl-surface-2",
          compact ? "px-3 py-2" : "px-3 py-3",
          verified ? "border-tcl-success/40" : "border-tcl-border-muted",
        )}
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-tcl-gold/15 text-tcl-gold">
          <ICONS.Phone aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-tcl-muted">
            উত্তোলনের নম্বর · Registered signup number
          </p>
          <p className={cn("font-mono tabular-nums text-tcl-white", compact ? "text-sm" : "text-base")}>
            {payout === null ? "…" : payout.phone ? displayBdPhone(payout.phone) : "No registered number"}
          </p>
        </div>
        {payout?.phone ? (
          <span
            className={cn(
              "shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase",
              verified ? "bg-tcl-success/15 text-tcl-success" : "bg-tcl-gold/15 text-tcl-gold",
            )}
          >
            {verified ? "Verified" : "Not verified"}
          </span>
        ) : null}
      </div>

      <p
        role="note"
        lang="bn"
        className="flex items-start gap-2 rounded-md border border-tcl-gold/40 bg-tcl-gold/10 px-3 py-2 text-[12px] leading-relaxed text-tcl-white"
      >
        <ICONS.AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tcl-gold" />
        <span>{WITHDRAW_NUMBER_NOTICE_BN}</span>
      </p>

      {payout && !verified ? (
        <p role="alert" className="text-[11px] text-tcl-gold">
          {payout.hasValidPhone
            ? "Your registered number is not verified yet. Withdrawals are paid only to a verified registered number. Please contact support to verify it."
            : "Your account has no valid registered phone number. Please contact support."}
        </p>
      ) : null}
    </div>
  );
}
