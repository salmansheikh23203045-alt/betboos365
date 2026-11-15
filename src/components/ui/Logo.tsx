import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export const LOGO_SRC = "/brand/betboos365-logo.png";

export interface LogoProps {
  /** Logo file. Defaults to the official BetBoos365 logo in /public/brand. */
  src?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const SIZE_CLASS = {
  sm: {
    image: "h-11",
    text: "text-sm sm:text-base",
  },
  md: {
    image: "h-14",
    text: "text-base sm:text-lg",
  },
  lg: {
    image: "h-18",
    text: "text-xl sm:text-2xl",
  },
} as const;

/**
 * BetBoos365 logo — official logo image on the left with brand name "BetBoos365" on the right.
 * Adjusted: reduced horizontal gap between image and text, and slightly reduced wordmark text size.
 */
export function Logo({ src = LOGO_SRC, size = "md", href = "/", className }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="BetBoos365 home"
      className={cn("inline-flex shrink-0 items-center group cursor-pointer", className)}
    >
      <Image
        src={src}
        alt="BetBoos365"
        width={2172}
        height={724}
        priority
        className={cn("w-auto object-contain", SIZE_CLASS[size].image)}
      />
    </Link>
  );
}
