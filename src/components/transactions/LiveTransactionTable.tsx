import { NeonCard } from "@/components/ui/NeonCard";
import { Pill, type PillVariant } from "@/components/ui/Pill";
import type { Transaction, TransactionStatus } from "@/types";

export interface LiveTransactionTableProps {
  transactions: Transaction[];
  /** Max rows shown. Reference shows 5. */
  limit?: number;
}

const STATUS_VARIANT: Record<TransactionStatus, PillVariant> = {
  SUCCESS: "success",
  WIN: "win",
  PENDING: "neutral",
  FAILED: "live",
};

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * LiveTransactionTable — "LIVE TRANSACTION" feed: masked user, type, gold amount, status pill.
 * Reference: desktop right rail. Mobile placement is an open question.
 */
export function LiveTransactionTable({ transactions, limit = 5 }: LiveTransactionTableProps) {
  const rows = transactions.slice(0, limit);

  return (
    <NeonCard as="section" aria-label="Live transactions" padding="sm" className="p-3">
      <header className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-heading-sm font-extrabold uppercase tracking-wide">
          <span className="text-tcl-gold">Live</span> <span className="text-tcl-white">Transaction</span>
        </h2>
        <Pill variant="live" dot>
          Live
        </Pill>
      </header>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[260px] border-separate border-spacing-0 text-caption">
          <caption className="sr-only">Recent deposits and wins</caption>
          <thead>
            <tr className="text-label font-bold uppercase tracking-wider text-tcl-muted">
              <th scope="col" className="px-2 py-2 text-left font-bold">User ID</th>
              <th scope="col" className="px-2 py-2 text-left font-bold">Type</th>
              <th scope="col" className="px-2 py-2 text-left font-bold">Amount</th>
              <th scope="col" className="px-2 py-2 text-left font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <tr key={tx.id} className="odd:bg-tcl-surface-2/40">
                <td className="border-t border-tcl-border-muted px-2 py-2 font-medium text-tcl-white">{tx.userId}</td>
                <td className="border-t border-tcl-border-muted px-2 py-2 text-tcl-white">{tx.type}</td>
                <td className="border-t border-tcl-border-muted px-2 py-2 font-semibold text-tcl-gold">
                  {formatAmount(tx.amount, tx.currency)}
                </td>
                <td className="border-t border-tcl-border-muted px-2 py-2">
                  <Pill variant={STATUS_VARIANT[tx.status]}>{tx.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NeonCard>
  );
}
