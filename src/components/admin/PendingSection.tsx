import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS, type IconName } from "@/lib/icons";

/**
 * Shared empty-state for admin sections whose backend endpoints don't
 * exist yet. The strict rule says we NEVER invent financial or operational
 * data, so these sections say so plainly instead of showing fake numbers.
 */
export function PendingSection({
  title,
  icon,
  summary,
  backendNeeded,
  nextStep,
}: {
  title: string;
  icon: IconName;
  summary: string;
  backendNeeded: string[];
  nextStep?: string;
}) {
  const Icon = ICONS[icon];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">{title}</h2>
        <span className="rounded-pill bg-tcl-muted/20 px-2 py-0.5 text-[10px] font-bold uppercase text-tcl-muted">
          Awaiting backend
        </span>
      </div>

      <NeonCard className="space-y-4 p-6 text-center">
        <Icon aria-hidden="true" className="mx-auto size-10 text-tcl-gold" />
        <p className="text-tcl-white">{summary}</p>
        <div className="mx-auto max-w-md space-y-2 text-left">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-tcl-muted">
            Backend endpoints needed
          </p>
          <ul className="space-y-1 text-[12px] text-tcl-white">
            {backendNeeded.map((e) => (
              <li key={e} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-full bg-tcl-red-bright" />
                <code className="text-tcl-white">{e}</code>
              </li>
            ))}
          </ul>
        </div>
        {nextStep ? (
          <p className="text-[11px] text-tcl-muted">{nextStep}</p>
        ) : null}
      </NeonCard>
    </div>
  );
}
