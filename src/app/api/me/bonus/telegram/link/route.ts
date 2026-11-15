import { forward } from "@/lib/bff";

/** One-time bot deep link that proves which Telegram account the player controls. */
export async function POST(req: Request) {
  return forward(req, "/bonus/telegram/link");
}
