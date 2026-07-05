import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";
import { applySingleTransaction } from "@/lib/wallet";
import { prisma } from "@/lib/db";

const schema = z.object({
  amountCents: z
    .number()
    .int()
    .min(1000, "Le retrait minimum est de 10 €"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { amountCents } = schema.parse(await req.json());

    await applySingleTransaction({
      userId: user.id,
      type: "WITHDRAWAL",
      amountCents: -amountCents,
      reference: "Demande de retrait",
    });

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { balanceCents: true },
    });
    return jsonOk({ balanceCents: updated.balanceCents });
  } catch (e) {
    return handleApiError(e);
  }
}
