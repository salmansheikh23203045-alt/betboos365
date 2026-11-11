import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { InviteFriendsClient } from "./InviteFriendsClient";

export const metadata = { title: "বন্ধুদের আমন্ত্রণ — TCL11" };

export default async function InviteFriendsPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/invite");
  return <InviteFriendsClient user={user} />;
}
