import { prisma } from "@/lib/db";
import { applyTransaction, WalletError } from "@/lib/wallet";
import { serviceFeeCents } from "@/lib/money";

export class MatchError extends Error {}

/** Prend la mise du créateur et ouvre le match. */
export async function createMatch(params: {
  creatorId: string;
  gameId: string;
  title: string;
  rules: string;
  platform: string;
  region: string;
  teamSize: number;
  entryFeeCents: number;
}) {
  if (params.entryFeeCents < 100)
    throw new MatchError("La mise minimale est de 1 €");
  if (params.entryFeeCents > 50000)
    throw new MatchError("La mise maximale est de 500 €");

  return prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: {
        creatorId: params.creatorId,
        gameId: params.gameId,
        title: params.title,
        rules: params.rules,
        platform: params.platform,
        region: params.region,
        teamSize: params.teamSize,
        entryFeeCents: params.entryFeeCents,
        status: "OPEN",
      },
    });
    await applyTransaction(tx, {
      userId: params.creatorId,
      type: "WAGER_STAKE",
      amountCents: -params.entryFeeCents,
      reference: `Mise — match ${match.id}`,
    });
    return match;
  });
}

/** Un adversaire accepte le match : sa mise est bloquée à son tour. */
export async function acceptMatch(matchId: string, opponentId: string) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (!match) throw new MatchError("Match introuvable");
    if (match.status !== "OPEN")
      throw new MatchError("Ce match n'est plus ouvert");
    if (match.creatorId === opponentId)
      throw new MatchError("Vous ne pouvez pas accepter votre propre match");

    await applyTransaction(tx, {
      userId: opponentId,
      type: "WAGER_STAKE",
      amountCents: -match.entryFeeCents,
      reference: `Mise — match ${match.id}`,
    });
    const updated = await tx.match.update({
      where: { id: matchId },
      data: { opponentId, status: "ACCEPTED" },
    });
    await tx.notification.create({
      data: {
        userId: match.creatorId,
        title: "Défi accepté !",
        body: "Un adversaire a accepté votre match. Jouez puis déclarez le résultat.",
        href: `/wagers/${match.id}`,
      },
    });
    return updated;
  });
}

/** Annule un match encore ouvert et rembourse le créateur. */
export async function cancelMatch(matchId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (!match) throw new MatchError("Match introuvable");
    if (match.creatorId !== userId)
      throw new MatchError("Seul le créateur peut annuler ce match");
    if (match.status !== "OPEN")
      throw new MatchError("Seul un match ouvert peut être annulé");

    await applyTransaction(tx, {
      userId: match.creatorId,
      type: "WAGER_REFUND",
      amountCents: match.entryFeeCents,
      reference: `Remboursement — match ${match.id}`,
    });
    return tx.match.update({
      where: { id: matchId },
      data: { status: "CANCELLED" },
    });
  });
}

/**
 * Un joueur déclare le résultat ("WIN" ou "LOSS" de son point de vue).
 * - Déclarations concordantes → règlement automatique du match.
 * - Déclarations contradictoires → litige ouvert pour arbitrage admin.
 */
export async function reportResult(
  matchId: string,
  userId: string,
  report: "WIN" | "LOSS"
) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (!match) throw new MatchError("Match introuvable");
    if (!["ACCEPTED", "REPORTED"].includes(match.status))
      throw new MatchError("Ce match n'attend pas de résultat");
    if (userId !== match.creatorId && userId !== match.opponentId)
      throw new MatchError("Vous ne participez pas à ce match");

    const isCreator = userId === match.creatorId;
    const data = isCreator
      ? { creatorReport: report }
      : { opponentReport: report };

    const updated = await tx.match.update({
      where: { id: matchId },
      data: { ...data, status: "REPORTED" },
    });

    const { creatorReport, opponentReport } = updated;
    if (!creatorReport || !opponentReport) return updated;

    // Les deux ont déclaré : concordance = un WIN et un LOSS.
    if (creatorReport !== opponentReport) {
      const winnerId =
        creatorReport === "WIN" ? updated.creatorId : updated.opponentId!;
      return settleMatchInTx(tx, updated.id, winnerId);
    }

    // Contradiction (deux WIN ou deux LOSS) → litige.
    await tx.match.update({
      where: { id: matchId },
      data: { status: "DISPUTED" },
    });
    await tx.dispute.upsert({
      where: { matchId },
      create: {
        matchId,
        openedById: userId,
        reason:
          "Déclarations contradictoires : les deux joueurs revendiquent le même résultat.",
      },
      update: {},
    });
    return tx.match.findUniqueOrThrow({ where: { id: matchId } });
  });
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Verse les gains au vainqueur (2× la mise, moins les frais de service). */
async function settleMatchInTx(tx: Tx, matchId: string, winnerId: string) {
  const match = await tx.match.findUniqueOrThrow({ where: { id: matchId } });
  if (!match.opponentId) throw new MatchError("Match sans adversaire");

  const winner = await tx.user.findUniqueOrThrow({ where: { id: winnerId } });
  const loserId =
    winnerId === match.creatorId ? match.opponentId : match.creatorId;

  const gross = match.entryFeeCents * 2;
  const fee = serviceFeeCents(gross, winner.elite);
  const payout = gross - fee;

  await applyTransaction(tx, {
    userId: winnerId,
    type: "WAGER_PAYOUT",
    amountCents: payout,
    reference: `Gains — match ${match.id} (frais de service ${fee / 100} €)`,
  });

  await tx.user.update({
    where: { id: winnerId },
    data: { wins: { increment: 1 }, xp: { increment: 25 } },
  });
  await tx.user.update({
    where: { id: loserId },
    data: { losses: { increment: 1 }, xp: { increment: 5 } },
  });

  await tx.notification.createMany({
    data: [
      {
        userId: winnerId,
        title: "Victoire ! 🏆",
        body: `Vos gains ont été crédités sur votre portefeuille.`,
        href: `/wagers/${match.id}`,
      },
      {
        userId: loserId,
        title: "Match terminé",
        body: "Défaite enregistrée. Retentez votre chance !",
        href: `/wagers/${match.id}`,
      },
    ],
  });

  return tx.match.update({
    where: { id: matchId },
    data: { status: "COMPLETED", winnerId, completedAt: new Date() },
  });
}

/** Règlement forcé par un administrateur (résolution de litige). */
export async function adminSettleMatch(
  matchId: string,
  winnerId: string,
  resolution: string
) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (!match) throw new MatchError("Match introuvable");
    if (!["DISPUTED", "REPORTED", "ACCEPTED"].includes(match.status))
      throw new MatchError("Ce match ne peut pas être réglé");
    if (winnerId !== match.creatorId && winnerId !== match.opponentId)
      throw new MatchError("Le vainqueur doit être un participant du match");

    await tx.dispute.updateMany({
      where: { matchId },
      data: { status: "RESOLVED", resolution },
    });
    return settleMatchInTx(tx, matchId, winnerId);
  });
}

/** Annulation admin avec remboursement des deux joueurs. */
export async function adminVoidMatch(matchId: string, resolution: string) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId } });
    if (!match) throw new MatchError("Match introuvable");
    if (["COMPLETED", "CANCELLED"].includes(match.status))
      throw new MatchError("Ce match est déjà clôturé");

    await applyTransaction(tx, {
      userId: match.creatorId,
      type: "WAGER_REFUND",
      amountCents: match.entryFeeCents,
      reference: `Annulation admin — match ${match.id}`,
    });
    if (match.opponentId) {
      await applyTransaction(tx, {
        userId: match.opponentId,
        type: "WAGER_REFUND",
        amountCents: match.entryFeeCents,
        reference: `Annulation admin — match ${match.id}`,
      });
    }
    await tx.dispute.updateMany({
      where: { matchId },
      data: { status: "RESOLVED", resolution },
    });
    return tx.match.update({
      where: { id: matchId },
      data: { status: "CANCELLED" },
    });
  });
}

export { WalletError };
