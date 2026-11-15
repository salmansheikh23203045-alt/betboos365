import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { WithdrawPageClient } from "./WithdrawPageClient";

export const metadata = { title: "উত্তোলন — BetBoos365" };

export default async function WithdrawPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/withdraw");
  return <WithdrawPageClient />;
}
