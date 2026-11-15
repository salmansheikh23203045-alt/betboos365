import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BettingRecordsClient } from "./BettingRecordsClient";

export const metadata = { title: "বেটিং রেকর্ড — BetBoos365" };

export default async function BettingRecordsPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/betting");
  return <BettingRecordsClient />;
}
