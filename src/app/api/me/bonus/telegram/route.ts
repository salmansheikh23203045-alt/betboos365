import { forward } from "@/lib/bff";

/** Telegram bonus status for the signed-in player. */
export async function GET(req: Request) {
  return forward(req, "/bonus/telegram");
}
