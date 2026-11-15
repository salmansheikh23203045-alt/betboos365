import { forward } from "@/lib/bff";

/** All wallet ledger movements (transactions.view). */
export async function GET(req: Request) {
  return forward(req, "/admin/finance/ledger", { withQuery: true });
}
