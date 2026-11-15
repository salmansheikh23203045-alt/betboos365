import type { Metadata } from "next";
import { LedgerTable } from "@/components/admin/LedgerTable";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export const metadata: Metadata = { title: "Transactions | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

/**
 * The wallet ledger: every balance movement for every player, as recorded by
 * the backend in the same database transaction as the balance change.
 */
export default function AdminTransactionsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">Transactions</h2>
        <div className="flex gap-2">
          <PrimaryButton href="/admin/deposits" size="sm" icon="ArrowDownCircle">
            Deposits
          </PrimaryButton>
          <PrimaryButton href="/admin/withdrawals" size="sm" icon="ArrowUpCircle">
            Withdrawals
          </PrimaryButton>
        </div>
      </div>
      <p className="text-caption text-tcl-muted">
        Wallet ledger for all players. Deposit and withdrawal requests are reviewed on their own pages; every approved
        movement, bonus and manual adjustment appears here.
      </p>
      <LedgerTable />
    </div>
  );
}
