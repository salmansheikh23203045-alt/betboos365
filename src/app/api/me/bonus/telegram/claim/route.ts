import { forward } from "@/lib/bff";

/** Ask the backend to verify group membership and credit the bonus once. */
export async function POST(req: Request) {
  return forward(req, "/bonus/telegram/claim");
}
