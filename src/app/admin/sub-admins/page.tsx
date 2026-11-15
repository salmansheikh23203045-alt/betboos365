import type { Metadata } from "next";
import { StaffManager } from "@/components/admin/StaffManager";

export const metadata: Metadata = { title: "Sub Admin Management | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

export default function AdminSubAdminsPage() {
  return <StaffManager kind="sub-admins" />;
}
