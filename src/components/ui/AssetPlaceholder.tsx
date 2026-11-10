import { cn } from "@/lib/cn";

export interface AssetPlaceholderProps {
  /** The asset this slot is waiting for, e.g. "Hero banner — desktop". */
  label: string;
  className?: string;
}

/**
 * AssetPlaceholder — labelled neutral slot for a missing image.
 * Roadmap rule: never fill a missing asset with a random or stock image.
 * Replace each use with the real asset when it is supplied.
 */
export function AssetPlaceholder({ label, className }: AssetPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`Asset pending: ${label}`}
      className={cn(
        "flex size-full min-h-full items-center justify-center rounded-tile p-2 text-center",
        "bg-tcl-charcoal border border-dashed border-tcl-gold/40",
        className,
      )}
    >
      <span className="text-label font-semibold uppercase tracking-wider text-tcl-muted">
        Asset pending
        <span className="block normal-case tracking-normal text-tcl-muted/80 font-normal">{label}</span>
      </span>
    </div>
  );
}
