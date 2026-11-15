import { forward } from "@/lib/bff";

/** Active agents a payout can be assigned to. */
export async function GET(req: Request) {
  return forward(req, "/admin/finance/agents");
}
