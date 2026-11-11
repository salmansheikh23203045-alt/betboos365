import type { Metadata } from "next";
import Link from "next/link";
import { NeonCard } from "@/components/ui/NeonCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ICONS } from "@/lib/icons";

export const metadata: Metadata = { title: "Transactions | TCL11 Admin" };
export const dynamic = "force-dynamic";

export default function AdminTransactionsPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-heading-lg uppercase text-tcl-white">
        Transactions
      </h2>
      <NeonCard className="space-y-3">
        <div className="flex items-center gap-2">
          <ICONS.History aria-hidden="true" className="size-5 text-tcl-gold" />
          <p className="font-semibold text-tcl-white">
            Deposits and withdrawals management
          </p>
        </div>
        <p className="text-caption text-tcl-muted">
          Deposit and withdrawal review, approval, rejection and completion are
          handled inside the Wallet & Finance workspace. Bet and payout ledgers
          will be added here once the wagering engine is online.
        </p>
        <div>
          <PrimaryButton href="/admin/finance" size="md" icon="Wallet">
            Open Wallet & Finance
          </PrimaryButton>
        </div>
        <p className="text-[11px] text-tcl-muted">
          Need API access? See <Link href="/admin/settings" className="text-tcl-gold hover:underline">System Settings</Link> for
          endpoint references.
        </p>
      </NeonCard>
    </div>
  );
}
