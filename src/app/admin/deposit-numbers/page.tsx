import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DepositNumbersClient } from "./DepositNumbersClient";

export const metadata: Metadata = { title: "Deposit & Agent Numbers | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDepositNumbersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-heading-lg uppercase text-tcl-white">Deposit Number Management</h1>
        <p className="text-caption text-tcl-muted">
          Configure active mobile banking numbers for user deposits and agent send money / cashout. Updates apply immediately.
        </p>
      </div>

      <DepositNumbersClient />
    </div>
  );
}
