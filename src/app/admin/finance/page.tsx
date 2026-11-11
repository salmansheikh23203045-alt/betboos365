import type { Metadata } from "next";
import { backendFetch } from "@/lib/api";
import { FinanceManager } from "@/components/admin/FinanceManager";
import type { PaymentProvider } from "@/types/wallet";

export const metadata: Metadata = { title: "Wallet & Finance | TCL11 Admin" };
export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  let providers: Pick<PaymentProvider, "code" | "name">[] = [];
  try {
    const res = await backendFetch("/wallet/providers");
    if (res.ok) {
      const body = (await res.json()) as { data?: PaymentProvider[] };
      providers = (body.data ?? []).map((p) => ({ code: p.code, name: p.name }));
    }
  } catch {
    /* fall through to empty providers list */
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">
          Wallet & Finance
        </h2>
      </div>
      <p className="text-caption text-tcl-muted">
        Review and action deposit and withdrawal requests. Every decision is
        recorded in the audit log. Deposits credit the wallet only on explicit
        approval; withdrawals debit the wallet only when marked{" "}
        <span className="text-tcl-white">Completed</span> after the payout has
        been sent.
      </p>
      <FinanceManager providers={providers} />
    </div>
  );
}
