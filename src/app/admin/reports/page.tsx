import type { Metadata } from "next";
import { cookies } from "next/headers";
import { backendFetch } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-cookies";
import { NeonCard } from "@/components/ui/NeonCard";
import { ICONS, type IconName } from "@/lib/icons";
import { BN } from "@/i18n/bn";
import { formatBdt } from "@/lib/money";

export const metadata: Metadata = { title: `${BN.admin.reports} | BetBoos365 Admin` };
export const dynamic = "force-dynamic";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  recentRegistrations: number;
  totalGames: number;
  activePromotions: number;
  openTickets: number;
  connectedClients: number;
}

interface FinanceSummary {
  deposits: { pending: number; approved: number; rejected: number };
  withdrawals: { pending: number; approved: number; completed: number; rejected: number };
}

interface FinanceOverview {
  allTime: {
    deposits: { amount: number };
    withdrawals: { amount: number };
    netCashFlow: number;
    bonuses: { amount: number; count: number };
    adjustments: { credit: number; debit: number };
  };
  pending: { deposits: { amount: number }; withdrawals: { amount: number } };
  playerBalances: { available: number; reserved: number };
}

async function getJson<T>(path: string, token: string) {
  const res = await backendFetch(path, { accessToken: token });
  if (!res.ok) return null;
  const body = (await res.json().catch(() => ({}))) as { data?: T };
  return body.data ?? null;
}

export default async function AdminReportsPage() {
  const token = readAccessToken(await cookies()) ?? "";
  const [dashboard, finance, money] = await Promise.all([
    getJson<DashboardStats>("/admin/dashboard", token),
    getJson<FinanceSummary>("/admin/finance/summary", token),
    getJson<FinanceOverview>("/admin/finance/overview?days=30", token),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-heading-lg uppercase text-tcl-white">
          {BN.admin.reports}
        </h2>
      </div>
      <p className="text-caption text-tcl-muted">
        প্ল্যাটফর্মের মূল পরিসংখ্যান — ইউজার, গেম, প্রোমোশন, টিকিট এবং আর্থিক লেনদেনের
        রিয়েল-টাইম সারসংক্ষেপ।
      </p>

      <section className="space-y-3">
        <h3 className="font-display text-heading-md uppercase text-tcl-gold">
          প্ল্যাটফর্ম
        </h3>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          {dashboard ? (
            <>
              <ReportTile label="মোট ইউজার" value={dashboard.totalUsers} icon="Users" />
              <ReportTile label="সক্রিয় ইউজার" value={dashboard.activeUsers} icon="ShieldCheck" />
              <ReportTile label="সাম্প্রতিক রেজিস্ট্রেশন" value={dashboard.recentRegistrations} icon="TrendingUp" />
              <ReportTile label="মোট গেম" value={dashboard.totalGames} icon="Gamepad2" />
              <ReportTile label="সক্রিয় প্রোমোশন" value={dashboard.activePromotions} icon="Gift" />
              <ReportTile label="খোলা টিকিট" value={dashboard.openTickets} icon="MessageCircle" />
              <ReportTile label="লাইভ WS ক্লায়েন্ট" value={dashboard.connectedClients} icon="Zap" />
            </>
          ) : (
            <NeonCard className="md:col-span-3 lg:col-span-4 text-center text-caption text-tcl-red-bright">
              {BN.common.serverError} — ড্যাশবোর্ড ডেটা লোড হয়নি।
            </NeonCard>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-heading-md uppercase text-tcl-gold">
          আর্থিক লেনদেন
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {finance ? (
            <>
              <ReportTile label={BN.admin.pendingDeposits} value={finance.deposits.pending} icon="ArrowDownCircle" tone="pending" />
              <ReportTile label={BN.admin.approvedDeposits} value={finance.deposits.approved} icon="CheckCircle2" tone="ok" />
              <ReportTile label={BN.admin.pendingWithdrawals} value={finance.withdrawals.pending} icon="ArrowUpCircle" tone="pending" />
              <ReportTile label={BN.admin.completedWithdrawals} value={finance.withdrawals.completed} icon="CheckCircle2" tone="ok" />
              <ReportTile label="অনুমোদিত উত্তোলন" value={finance.withdrawals.approved} icon="ShieldCheck" />
              <ReportTile label="প্রত্যাখ্যাত ডিপোজিট" value={finance.deposits.rejected} icon="XCircle" tone="rejected" />
              <ReportTile label="প্রত্যাখ্যাত উত্তোলন" value={finance.withdrawals.rejected} icon="XCircle" tone="rejected" />
            </>
          ) : (
            <NeonCard className="md:col-span-2 lg:col-span-4 text-center text-caption text-tcl-red-bright">
              {BN.common.serverError} — ফাইন্যান্স সারাংশ লোড হয়নি।
            </NeonCard>
          )}
        </div>
      </section>

      {money ? (
        <section className="space-y-3">
          <h3 className="font-display text-heading-md uppercase text-tcl-gold">Money (BDT, all time)</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <ReportTile label="Deposits approved" value={formatBdt(money.allTime.deposits.amount)} icon="ArrowDownCircle" tone="ok" />
            <ReportTile label="Withdrawals paid" value={formatBdt(money.allTime.withdrawals.amount)} icon="ArrowUpCircle" />
            <ReportTile label="Net cash flow" value={formatBdt(money.allTime.netCashFlow)} icon="TrendingUp" />
            <ReportTile label="Wallet balances, players + agents (available + reserved)" value={formatBdt(money.playerBalances.available + money.playerBalances.reserved)} icon="Wallet" />
            <ReportTile label="Pending deposits" value={formatBdt(money.pending.deposits.amount)} icon="ArrowDownCircle" tone="pending" />
            <ReportTile label="Open withdrawals" value={formatBdt(money.pending.withdrawals.amount)} icon="ArrowUpCircle" tone="pending" />
            <ReportTile label={`Bonuses paid (${money.allTime.bonuses.count})`} value={formatBdt(money.allTime.bonuses.amount)} icon="Gift" />
            <ReportTile
              label="Manual adjustments (credit / debit)"
              value={`${formatBdt(money.allTime.adjustments.credit)} / ${formatBdt(money.allTime.adjustments.debit)}`}
              icon="Settings"
            />
          </div>
        </section>
      ) : null}

      <NeonCard className="border-tcl-gold/40 bg-tcl-gold/5 text-caption text-tcl-muted">
        <p>
          রিপোর্ট বিস্তারিতভাবে দেখতে ও অনুমোদন/প্রত্যাখ্যান করতে{" "}
          <a href="/admin/transactions" className="text-tcl-gold hover:underline">
            {BN.admin.walletFinance}
          </a>{" "}
          পৃষ্ঠায় যান। অডিট ট্রেইল{" "}
          <a href="/admin/audit-logs" className="text-tcl-gold hover:underline">
            {BN.admin.auditLogs}
          </a>{" "}
          থেকে দেখা যাবে।
        </p>
      </NeonCard>
    </div>
  );
}

function ReportTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | string | undefined;
  icon: IconName;
  tone?: "pending" | "ok" | "rejected";
}) {
  const displayValue =
    typeof value === "string" ? value
    : typeof value === "number" && Number.isFinite(value) ? value.toLocaleString()
    : "—";
  const Icon = ICONS[icon];
  const toneClass =
    tone === "pending"
      ? "border-tcl-gold/40 text-tcl-gold"
      : tone === "ok"
        ? "border-tcl-success/40 text-tcl-success"
        : tone === "rejected"
          ? "border-tcl-red/40 text-tcl-red-bright"
          : "border-tcl-border-muted text-tcl-white";
  return (
    <div className={`rounded-md border bg-tcl-surface-2 px-3 py-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className="size-5" />
        <span className="text-[10px] uppercase tracking-wider text-tcl-muted">{label}</span>
      </div>
      <p className="mt-1 font-display text-heading-lg uppercase">{displayValue}</p>
    </div>
  );
}
