import Link from "next/link";
import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";

export interface MobileSectionHeadingProps {
  title: string;
  icon: IconName;
  iconClassName?: string;
  viewAllHref?: string;
}

/** Mobile panel heading: mixed-case title with a filled icon and "View All →" (reference: mobile Popular / Featured Games). */
export function MobileSectionHeading({ title, icon, iconClassName, viewAllHref }: MobileSectionHeadingProps) {
  const Icon = ICONS[icon];
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[17px] font-bold leading-none text-tcl-white">
        <Icon aria-hidden="true" className={cn("size-5 shrink-0", iconClassName)} />
        {title}
      </h2>
      {viewAllHref ? (
        <Link
          href={viewAllHref}
          prefetch={false}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-tcl-white/90 transition-colors hover:text-tcl-gold"
        >
          View All
          <ICONS.ArrowRight aria-hidden="true" className="size-3.5 text-tcl-gold" />
        </Link>
      ) : null}
    </div>
  );
}
