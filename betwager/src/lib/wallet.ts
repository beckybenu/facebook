import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type TxType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "WAGER_STAKE"
  | "WAGER_PAYOUT"
  | "WAGER_REFUND"
  | "TOURNAMENT_ENTRY"
  | "TOURNAMENT_PRIZE"
  | "BONUS";

export class WalletError extends Error {}

/**
 * Applique un mouvement d'argent de façon atomique : met à jour le solde de
 * l'utilisateur et enregistre la transaction. `amountCents` est signé
 * (négatif = débit). Refuse tout débit qui rendrait le solde négatif.
 *
 * À utiliser dans un `prisma.$transaction` quand plusieurs mouvements doivent
 * réussir ou échouer ensemble (ex. paiement d'un match).
 */
export async function applyTransaction(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    type: TxType;
    amountCents: number;
    reference?: string;
  }
): Promise<void> {
  const user = await tx.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new WalletError("Utilisateur introuvable");

  const newBalance = user.balanceCents + params.amountCents;
  if (newBalance < 0) throw new WalletError("Solde insuffisant");

  await tx.user.update({
    where: { id: params.userId },
    data: { balanceCents: newBalance },
  });
  await tx.transaction.create({
    data: {
      userId: params.userId,
      type: params.type,
      amountCents: params.amountCents,
      balanceAfterCents: newBalance,
      reference: params.reference ?? "",
    },
  });
}

/** Raccourci hors transaction composée. */
export async function applySingleTransaction(params: {
  userId: string;
  type: TxType;
  amountCents: number;
  reference?: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await applyTransaction(tx, params);
  });
}
