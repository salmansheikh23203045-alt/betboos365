import type { Metadata } from "next";
import { backendFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { FinanceManager } from "@/components/admin/FinanceManager";
import type { PaymentProvider } from "@/types/wallet";

export const metadata: Metadata = { title: "Deposit Management | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
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
      <h2 className="font-display text-heading-lg uppercase text-tcl-white">Deposit Management</h2>
      <p className="text-caption text-tcl-muted">Review deposit requests. A deposit credits the wallet only when it is explicitly approved, each request can be decided once, and every decision is recorded in the audit log with the staff member who made it.</p>
      <FinanceManager providers={providers} only="deposits" permissions={user?.permissions ?? []} />
    </div>
  );
}
