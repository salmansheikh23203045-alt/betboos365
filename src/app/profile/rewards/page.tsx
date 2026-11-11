import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PrizeCenterClient } from "./PrizeCenterClient";

export const metadata = { title: "পুরস্কার কেন্দ্র — TCL11" };

export default async function PrizeCenterPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/rewards");
  return <PrizeCenterClient user={user} />;
}
