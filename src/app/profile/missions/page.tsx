import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MissionsClient } from "./MissionsClient";

export const metadata = { title: "মিশন — TCL11" };

export default async function MissionsPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/missions");
  return <MissionsClient user={user} />;
}
