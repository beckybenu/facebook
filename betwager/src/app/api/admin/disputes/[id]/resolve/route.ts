import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  adminSettleMatch,
  adminVoidMatch,
  MatchError,
} from "@/lib/match-engine";
import { WalletError } from "@/lib/wallet";

const schema = z.object({
  action: z.enum(["SETTLE", "VOID"]),
  winnerId: z.string().optional(),
  resolution: z
    .string()
    .min(3, "Indiquez un motif de résolution (3 caractères minimum)"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { action, winnerId, resolution } = schema.parse(await req.json());

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
    });
    if (!dispute) return jsonError("Litige introuvable", 404);
    if (dispute.status !== "OPEN")
      return jsonError("Ce litige est déjà résolu", 400);

    if (action === "SETTLE") {
      if (!winnerId)
        return jsonError("Sélectionnez un vainqueur pour trancher", 400);
      const match = await adminSettleMatch(
        dispute.matchId,
        winnerId,
        resolution
      );
      return jsonOk(match);
    }

    const match = await adminVoidMatch(dispute.matchId, resolution);
    return jsonOk(match);
  } catch (e) {
    if (e instanceof MatchError || e instanceof WalletError)
      return jsonError(e.message, 400);
    return handleApiError(e);
  }
}
