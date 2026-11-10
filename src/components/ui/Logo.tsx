import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export const LOGO_SRC = "/brand/tcl11-logo.png";

export interface LogoProps {
  /** Logo file. Defaults to the official TCL11 logo in /public/brand. */
  src?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

/* The logo is a wide emblem (1000 × 410), so heights are larger than a plain wordmark would need. */
const SIZE_CLASS = {
  sm: "h-11", // mobile header (56px bar)
  md: "h-12", // desktop header (64px bar) and footer
  lg: "h-16",
} as const;

/**
 * TCL11 logo — transparent PNG cut from the supplied artwork (public/brand/tcl11-logo.png).
 */
export function Logo({ src = LOGO_SRC, size = "md", href = "/", className }: LogoProps) {
  return (
    <Link href={href} aria-label="TCL11 home" className={cn("inline-flex shrink-0 items-center", className)}>
      <Image src={src} alt="TCL11" width={1000} height={410} priority className={cn("w-auto", SIZE_CLASS[size])} />
    </Link>
  );
}
