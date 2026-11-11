import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DepositPageClient } from "./DepositPageClient";

export const metadata = { title: "ডিপোজিট — TCL11" };

export default async function DepositPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/deposit");
  return <DepositPageClient />;
}
