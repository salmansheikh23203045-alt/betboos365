import type { Metadata } from "next";
import { backendFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { FinanceManager } from "@/components/admin/FinanceManager";
import type { PaymentProvider } from "@/types/wallet";

export const metadata: Metadata = { title: "Withdrawal Management | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  const user = await getSession();
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
      <h2 className="font-display text-heading-lg uppercase text-tcl-white">Withdrawal Management</h2>
      <p className="text-caption text-tcl-muted">Review withdrawal requests. Payouts go only to the user\u2019s verified registered phone number. Approved payouts can be assigned to an agent; the wallet is debited only when the payout is marked completed.</p>
      <FinanceManager providers={providers} only="withdrawals" permissions={user?.permissions ?? []} />
    </div>
  );
}
