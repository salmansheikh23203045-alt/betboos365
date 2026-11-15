import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AccountRecordsClient } from "./AccountRecordsClient";

export const metadata = { title: "অ্যাকাউন্ট রেকর্ড — BetBoos365" };

export default async function AccountRecordsPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/records");
  return <AccountRecordsClient />;
}
