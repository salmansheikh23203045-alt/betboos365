import { forward } from "@/lib/bff";

/** Money totals and daily series (transactions.view). */
export async function GET(req: Request) {
  return forward(req, "/admin/finance/overview", { withQuery: true });
}
