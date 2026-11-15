import type { Metadata } from "next";
import { AgentDashboard } from "@/components/agent/AgentDashboard";

export const metadata: Metadata = { title: "Agent Dashboard | BetBoos365" };
export const dynamic = "force-dynamic";

export default function AgentPage() {
  return <AgentDashboard />;
}
