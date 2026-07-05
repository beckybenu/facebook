import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { acceptMatch, MatchError, WalletError } from "@/lib/match-engine";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const match = await acceptMatch(params.id, user.id);
    return jsonOk(match);
  } catch (e) {
    if (e instanceof MatchError || e instanceof WalletError)
      return jsonError(e.message, 400);
    return handleApiError(e);
  }
}
