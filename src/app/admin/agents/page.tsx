import type { Metadata } from "next";
import { StaffManager } from "@/components/admin/StaffManager";

export const metadata: Metadata = { title: "Agent Management | BetBoos365 Admin" };
export const dynamic = "force-dynamic";

export default function AdminAgentsPage() {
  return <StaffManager kind="agents" />;
}
