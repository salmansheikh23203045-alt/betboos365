import { redirect } from "next/navigation";

// Wallet & Finance is now two sections: Deposit Management and Withdrawal Management.
export default function AdminFinancePage() {
  redirect("/admin/deposits");
}
