import { forward } from "@/lib/bff";

/** The registered number withdrawals are paid to, and whether it is verified. */
export async function GET(req: Request) {
  return forward(req, "/wallet/payout-account");
}
