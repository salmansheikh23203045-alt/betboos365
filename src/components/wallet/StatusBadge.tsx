import { cn } from "@/lib/cn";
import type { TransactionStatus } from "@/types/wallet";

const STATUS_STYLES: Record<TransactionStatus, string> = {
  PENDING: "bg-tcl-gold/15 text-tcl-gold border-tcl-gold/40",
  APPROVED: "bg-sky-500/15 text-sky-300 border-sky-400/40",
  COMPLETED: "bg-tcl-success/15 text-tcl-success border-tcl-success/40",
  REJECTED: "bg-tcl-red/15 text-tcl-red-bright border-tcl-red/40",
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
