import { forward } from "@/lib/bff";

/** Paid Telegram bonuses (Admin, or Sub Admin with transactions.view). */
export async function GET(req: Request) {
  return forward(req, "/admin/bonuses/telegram", { withQuery: true });
}
