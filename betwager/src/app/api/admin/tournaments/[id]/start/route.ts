import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import {
  startTournament,
  TournamentError,
} from "@/lib/tournament-engine";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const tournament = await startTournament(params.id);
    return jsonOk(tournament);
  } catch (e) {
    if (e instanceof TournamentError) return jsonError(e.message, 400);
    return handleApiError(e);
  }
}
