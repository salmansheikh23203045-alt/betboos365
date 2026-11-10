import type { ButtonHTMLAttributes, Ref } from "react";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";

export interface CarouselArrowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  direction: "prev" | "next";
  /** Ref is passed so Swiper can bind the button as its navigation element (React 19: ref is a plain prop). */
  ref?: Ref<HTMLButtonElement>;
}

/**
 * CarouselArrow — round dark button with a gold ring. Reference: hero and game carousels.
 */
export function CarouselArrow({ direction, className, ...rest }: CarouselArrowProps) {
  const Icon = direction === "prev" ? ICONS.ChevronLeft : ICONS.ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous" : "Next"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-pill",
        "bg-tcl-black/80 text-tcl-gold border border-tcl-gold/70",
        "hover:bg-tcl-gold hover:text-tcl-black transition-colors cursor-pointer",
        "disabled:opacity-40 disabled:pointer-events-none",
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
