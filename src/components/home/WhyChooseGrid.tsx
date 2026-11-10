import { ICONS, type IconName } from "@/lib/icons";
import { NeonCard } from "@/components/ui/NeonCard";
import { WHY_CHOOSE_FEATURES } from "@/data/mock";

/**
 * WhyChooseGrid — "Why Choose TCL11?" with four gold icon tiles.
 * Reference: desktop right rail, bottom. Mobile placement is inferred (see CLAUDE_PROJECT_STATE.md).
 */
export function WhyChooseGrid() {
  return (
    <NeonCard as="section" aria-label="Why choose TCL11" className="space-y-4">
      <h2 className="text-heading-sm font-extrabold uppercase tracking-wide text-tcl-white">
        Why Choose TCL11?
      </h2>
      <ul className="grid grid-cols-4 gap-2">
        {WHY_CHOOSE_FEATURES.map((feature) => {
          const Icon = ICONS[feature.icon as IconName];
          return (
            <li key={feature.id} className="flex flex-col items-center gap-2 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-tile bg-red-gradient neon-border-red">
                <Icon aria-hidden="true" className="size-6 text-tcl-gold" />
              </span>
              <span className="text-[10px] font-semibold leading-tight text-tcl-white">{feature.label}</span>
            </li>
          );
        })}
      </ul>
    </NeonCard>
  );
}
