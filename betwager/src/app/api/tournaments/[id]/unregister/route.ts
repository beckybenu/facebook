import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import {
  unregisterFromTournament,
  TournamentError,
} from "@/lib/tournament-engine";
import { WalletError } from "@/lib/wallet";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    await unregisterFromTournament(params.id, user.id);
    return jsonOk({ unregistered: true });
  } catch (e) {
    if (e instanceof TournamentError || e instanceof WalletError)
      return jsonError(e.message, 400);
    return handleApiError(e);
  }
}
