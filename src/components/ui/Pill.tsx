import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PillVariant = "live" | "success" | "win" | "free" | "neutral" | "gold";

const VARIANT: Record<PillVariant, string> = {
  live: "bg-tcl-red text-tcl-white",
  success: "bg-tcl-success text-tcl-white",
  win: "bg-tcl-gold text-tcl-black",
  free: "bg-tcl-red text-tcl-white",
  neutral: "bg-tcl-surface-2 text-tcl-muted",
  gold: "bg-transparent text-tcl-gold border border-tcl-gold",
};

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  children: ReactNode;
  /** Show a small pulsing dot (used for LIVE). Opacity-only animation. */
  dot?: boolean;
}

/**
 * Pill — small uppercase status label.
 * Reference: LIVE (red), SUCCESS (green), WIN (gold), FREE (red corner badge).
 */
export function Pill({ variant = "neutral", dot = false, className, children, ...rest }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-[3px] text-label font-bold uppercase tracking-wider leading-none",
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span aria-hidden="true" className="size-1.5 rounded-pill bg-current motion-safe:animate-pulse" />
      ) : null}
      {children}
    </span>
  );
}
