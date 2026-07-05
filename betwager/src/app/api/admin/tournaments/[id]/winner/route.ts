import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import {
  setBracketWinner,
  TournamentError,
} from "@/lib/tournament-engine";
import { WalletError } from "@/lib/wallet";

const schema = z.object({
  round: z.number().int().min(0),
  matchIndex: z.number().int().min(0),
  winnerId: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { round, matchIndex, winnerId } = schema.parse(await req.json());
    const tournament = await setBracketWinner(
      params.id,
      round,
      matchIndex,
      winnerId
    );
    return jsonOk(tournament);
  } catch (e) {
    if (e instanceof TournamentError || e instanceof WalletError)
      return jsonError(e.message, 400);
    return handleApiError(e);
  }
}
