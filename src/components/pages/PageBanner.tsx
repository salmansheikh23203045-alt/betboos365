import { ICONS, type IconName } from "@/lib/icons";
import { cn } from "@/lib/cn";

export interface PageBannerProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  className?: string;
}

export function PageBanner({ title, subtitle, icon, className }: PageBannerProps) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <section className={cn("bg-fire-glow neon-border-red rounded-card px-6 py-8 text-center lg:px-10 lg:py-12", className)}>
      {Icon ? <Icon aria-hidden="true" className="mx-auto mb-3 size-10 text-tcl-gold lg:size-12" /> : null}
      <h1 className="font-display text-display-xl uppercase text-gold-gradient">{title}</h1>
      {subtitle ? <p className="mt-2 text-body text-tcl-muted">{subtitle}</p> : null}
    </section>
  );
}
