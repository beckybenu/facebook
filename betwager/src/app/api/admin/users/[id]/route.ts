import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { applySingleTransaction, WalletError } from "@/lib/wallet";

const schema = z.object({
  elite: z.boolean().optional(),
  creditCents: z.number().int().min(100).max(100000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { elite, creditCents } = schema.parse(await req.json());

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) return jsonError("Utilisateur introuvable", 404);

    if (typeof elite === "boolean") {
      await prisma.user.update({
        where: { id: target.id },
        data: { elite },
      });
    }
    if (creditCents) {
      await applySingleTransaction({
        userId: target.id,
        type: "BONUS",
        amountCents: creditCents,
        reference: "Crédit administrateur",
      });
    }

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: target.id },
      select: { id: true, elite: true, balanceCents: true },
    });
    return jsonOk(updated);
  } catch (e) {
    if (e instanceof WalletError) return jsonError(e.message, 400);
    return handleApiError(e);
  }
}
