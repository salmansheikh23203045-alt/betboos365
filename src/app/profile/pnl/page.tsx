import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ProfitLossClient } from "./ProfitLossClient";

export const metadata = { title: "লাভ ও ক্ষতি — TCL11" };

export default async function ProfitLossPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/pnl");
  return <ProfitLossClient />;
}
