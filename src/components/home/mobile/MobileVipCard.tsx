import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import type { VipStatus } from "@/types";

/**
 * VIP card (mobile): mixed-case copy as in the mobile reference ("VIP Level: VIP 0", "Login To View VIP Status").
 * Desktop keeps VIPProgressCard.
 */
export function MobileVipCard({ status, loginHref = "/login" }: { status: VipStatus; loginHref?: string }) {
  const percent = Math.round(Math.min(Math.max(status.progress, 0), 1) * 100);

  return (
    <NeonCard as="section" aria-label="VIP status" padding="none" className="space-y-2.5 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[15px] leading-none text-tcl-white">
          <ICONS.Crown
            aria-hidden="true"
            className="size-6 shrink-0 fill-tcl-gold/35 text-tcl-gold drop-shadow-[0_0_4px_rgb(255_194_26/0.6)]"
          />
          <span>
            VIP Level: <span className="font-bold">VIP {status.level}</span>
          </span>
        </p>
        <p className="text-[13px] leading-none text-tcl-white">
          Next: <span className="font-bold">VIP {status.nextLevel}</span>
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="VIP progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2.5 w-full overflow-hidden rounded-pill border border-tcl-red/60 bg-[#1a0404] shadow-[0_0_6px_rgb(225_15_15/0.45)]"
      >
        <div className="h-full rounded-pill bg-gold-gradient glow-gold" style={{ width: `${percent}%` }} />
      </div>

      <p className="text-[12px] leading-none text-tcl-white/85">{status.remainingToUpgrade} Left To Upgrade</p>

      {status.locked ? (
        <SecondaryButton href={loginHref} fullWidth className="mt-1 h-11! text-[15px]! normal-case! tracking-normal!">
          <ICONS.Crown aria-hidden="true" className="size-5 shrink-0 fill-tcl-black/20" />
          Login To View VIP Status
        </SecondaryButton>
      ) : null}
    </NeonCard>
  );
}
