import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import type { VipStatus } from "@/types";

export interface VIPProgressCardProps {
  status: VipStatus;
  /** Where the locked-state CTA goes. */
  loginHref?: string;
}

/**
 * VIPProgressCard — current VIP level, next level, gold progress bar, and the login CTA when locked.
 * Reference: right rail (desktop) and full-width card (mobile).
 * The reference bar fill (~25%) and "0 Left To Upgrade" disagree. Both are driven by data here.
 */
export function VIPProgressCard({ status, loginHref = "/login" }: VIPProgressCardProps) {
  const percent = Math.round(Math.min(Math.max(status.progress, 0), 1) * 100);

  return (
    <NeonCard as="section" aria-label="VIP status" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-heading-sm font-bold uppercase tracking-wide text-tcl-white">
          <ICONS.Crown aria-hidden="true" className="size-5 text-tcl-gold" />
          VIP Level: <span className="text-tcl-gold">VIP {status.level}</span>
        </p>
        <p className="text-caption font-semibold text-tcl-white">Next: VIP {status.nextLevel}</p>
      </div>

      <div
        role="progressbar"
        aria-label="VIP progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-pill bg-tcl-black border border-tcl-red/40"
      >
        <div className="h-full rounded-pill bg-gold-gradient glow-gold" style={{ width: `${percent}%` }} />
      </div>

      <p className="text-caption font-semibold text-tcl-gold">{status.remainingToUpgrade} Left To Upgrade</p>

      {status.locked ? (
        <SecondaryButton href={loginHref} fullWidth icon="Crown" size="md">
          Login To View VIP Status
        </SecondaryButton>
      ) : null}
    </NeonCard>
  );
}
