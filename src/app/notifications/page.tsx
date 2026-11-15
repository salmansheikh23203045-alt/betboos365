import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { backendFetch } from "@/lib/api";
import { NeonCard } from "@/components/ui/NeonCard";
import { PageBanner } from "@/components/pages/PageBanner";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";

export const metadata: Metadata = { title: `${BN.notifications.title} | BetBoos365` };
export const dynamic = "force-dynamic";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

async function loadNotifications(accessToken: string): Promise<{
  items: NotificationRow[];
  backendDown: boolean;
}> {
  const res = await backendFetch("/notifications", { accessToken });
  if (!res.ok) {
    return { items: [], backendDown: res.status === 503 };
  }
  const body = (await res.json().catch(() => ({}))) as { data?: NotificationRow[] };
  return { items: body.data ?? [], backendDown: false };
}

export default async function NotificationsPage() {
  const user = await getSession();
  if (!user) redirect("/login?next=/notifications");

  // getSession already revalidated the access token; we re-read the cookie
  // here only because the backend call needs the Authorization header.
  const cookieStore = await (await import("next/headers")).cookies();
  const accessToken = cookieStore.get("tcl_at")?.value;
  const { items, backendDown } = accessToken
    ? await loadNotifications(accessToken)
    : { items: [], backendDown: true };

  return (
    <div className="animate-fade-in-up mx-auto max-w-[920px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner
        title={BN.notifications.title}
        subtitle="আপনার অ্যাকাউন্ট ও গেম সংক্রান্ত সর্বশেষ আপডেট"
        icon="Mail"
      />

      {backendDown ? (
        <NeonCard className="flex items-center gap-3 border-tcl-gold/40 bg-tcl-gold/5 text-caption text-tcl-gold">
          <ICONS.AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
          <span>
            {BN.common.serverError} — ব্যাকএন্ড পৌঁছানো যাচ্ছে না। পরে আবার চেষ্টা করুন।
          </span>
        </NeonCard>
      ) : null}

      {items.length === 0 ? (
        <NeonCard className="space-y-3 text-center">
          <ICONS.Mail aria-hidden="true" className="mx-auto size-10 text-tcl-muted" />
          <p className="text-tcl-white">{BN.notifications.empty}</p>
          <p className="text-caption text-tcl-muted">
            নতুন অফার ও প্রোমোশনের জন্য আমাদের{" "}
            <Link href="/promotion" className="text-tcl-gold hover:underline">
              প্রোমোশন
            </Link>{" "}
            পেজ দেখুন।
          </p>
        </NeonCard>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <NeonCard
                className={cn(
                  "flex gap-3 border-tcl-border-muted",
                  n.isRead ? "opacity-70" : "border-tcl-gold/40",
                )}
              >
                <div
                  className={cn(
                    "mt-1 size-2 shrink-0 rounded-full",
                    n.isRead ? "bg-tcl-muted" : "bg-tcl-gold",
                  )}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-tcl-white">{n.title}</p>
                    <span className="text-[11px] text-tcl-muted">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-caption text-tcl-muted">{n.message}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-tcl-muted">
                    {n.type}
                  </p>
                </div>
              </NeonCard>
            </li>
          ))}
        </ul>
      )}

      <div className="text-center">
        <SecondaryButton href="/profile" variant="outline" size="md" icon="ChevronLeft">
          {BN.nav.profile}
        </SecondaryButton>
      </div>
    </div>
  );
}
