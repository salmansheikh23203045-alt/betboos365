import Link from "next/link";
import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";

export interface SectionHeadingProps {
  title: string;
  /** Optional gold icon before the title (reference: flame, gamepad). */
  icon?: IconName;
  /** Optional right-aligned link (reference: "View All →"). */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Visual size. "lg" for page-level sections, "md" for panels. */
  size?: "md" | "lg";
  className?: string;
}

/**
 * SectionHeading — icon + title + optional "View All →" link.
 * Used by Popular Games, Featured Games, Why Choose, etc.
 */
export function SectionHeading({
  title,
  icon,
  viewAllHref,
  viewAllLabel = "View All",
  size = "md",
  className,
}: SectionHeadingProps) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2
        className={cn(
          "flex items-center gap-2 font-sans font-extrabold uppercase tracking-wide text-tcl-white",
          size === "lg" ? "text-heading-lg" : "text-heading-md",
        )}
      >
        {Icon ? <Icon aria-hidden="true" className="size-5 text-tcl-gold" /> : null}
        {title}
      </h2>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-caption font-semibold text-tcl-white hover:text-tcl-gold transition-colors"
        >
          {viewAllLabel}
          <ICONS.ChevronRight aria-hidden="true" className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
