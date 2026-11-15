import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { backendFetch } from "@/lib/api";
import { BN } from "@/i18n/bn";
import { MessagesClient } from "./MessagesClient";

export const metadata: Metadata = { title: `${BN.userCenter.internalMessages} | BetBoos365` };
export const dynamic = "force-dynamic";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

async function loadMessages(accessToken: string): Promise<{
  items: NotificationRow[];
  backendDown: boolean;
}> {
  const res = await backendFetch("/notifications", { accessToken });
  if (!res.ok) {
    return { items: [], backendDown: res.status === 503 };
  }
  const body = (await res.json().catch(() => ({}))) as {
    data?: NotificationRow[];
  };
  return { items: body.data ?? [], backendDown: false };
}

export default async function MessagesPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/profile/messages");

  const cookieStore = await (await import("next/headers")).cookies();
  const accessToken = cookieStore.get("tcl_at")?.value;
  const { items, backendDown } = accessToken
    ? await loadMessages(accessToken)
    : { items: [], backendDown: true };

  return <MessagesClient items={items} backendDown={backendDown} />;
}
