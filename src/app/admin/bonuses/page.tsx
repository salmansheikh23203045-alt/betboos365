import type { Metadata } from "next";
import { TelegramBonusesTable } from "@/components/admin/TelegramBonusesTable";

export const metadata: Metadata = { title: "Telegram Bonuses | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

export default function AdminBonusesPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-heading-lg uppercase text-tcl-white">Telegram Bonuses</h2>
      <TelegramBonusesTable />
    </div>
  );
}
