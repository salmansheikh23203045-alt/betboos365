import { cn } from "@/lib/cn";

export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "pill" | "rect";

/** Shared sizing and typography for every button. Single source for button metrics. */
export const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 font-sans font-bold uppercase tracking-wide " +
  "select-none whitespace-nowrap leading-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tcl-gold " +
  "disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

export const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[11px]",
  md: "h-10 px-5 text-button",
  lg: "h-12 px-7 text-sm",
};

export const BUTTON_SHAPE: Record<ButtonShape, string> = {
  pill: "rounded-pill",
  rect: "rounded-md",
};

export function buttonClasses({
  size = "md",
  shape = "pill",
  fullWidth = false,
  className,
}: {
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  className?: string;
}): string {
  return cn(
    BUTTON_BASE,
    BUTTON_SIZE[size],
    BUTTON_SHAPE[shape],
    fullWidth && "w-full",
    className,
  );
}
