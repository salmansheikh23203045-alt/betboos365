import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type NeonTone = "red" | "gold" | "none";
export type NeonPadding = "none" | "sm" | "md";

export interface NeonCardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article";
  tone?: NeonTone;
  padding?: NeonPadding;
  /** Brighten the red glow on hover (desktop-only effect in practice). */
  hoverGlow?: boolean;
  children: ReactNode;
}

const TONE: Record<NeonTone, string> = {
  red: "neon-border-red bg-card-dark",
  gold: "neon-border-gold bg-card-dark",
  none: "bg-card-dark border border-tcl-border-muted",
};

const PADDING: Record<NeonPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 md:p-5",
};

/**
 * NeonCard — the dark panel with a red (or gold) neon border and soft outer glow.
 * Reference: hero frame, VIP panel, live transactions, sports banner, featured games panel.
 */
export function NeonCard({
  as: Tag = "div",
  tone = "red",
  padding = "md",
  hoverGlow = false,
  className,
  children,
  ...rest
}: NeonCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-card",
        TONE[tone],
        PADDING[padding],
        hoverGlow && "hover-glow-red",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
