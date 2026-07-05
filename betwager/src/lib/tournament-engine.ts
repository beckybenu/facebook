import { prisma } from "@/lib/db";
import { applyTransaction } from "@/lib/wallet";

export class TournamentError extends Error {}

export type BracketMatch = {
  p1: string | null; // userId (null = en attente / bye)
  p2: string | null;
  winner: string | null;
};
export type Bracket = { rounds: BracketMatch[][] };

export function parseBracket(json: string): Bracket | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Bracket;
  } catch {
    return null;
  }
}

export function prizePoolCents(t: {
  entryFeeCents: number;
  bonusPoolCents: number;
  entriesCount: number;
}): number {
  return t.entryFeeCents * t.entriesCount + t.bonusPoolCents;
}

/** Inscription d'un joueur (débite les frais d'entrée le cas échéant). */
export async function registerForTournament(
  tournamentId: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: { entries: true },
    });
    if (!tournament) throw new TournamentError("Tournoi introuvable");
    if (tournament.status !== "REGISTRATION")
      throw new TournamentError("Les inscriptions sont fermées");
    if (tournament.entries.length >= tournament.maxPlayers)
      throw new TournamentError("Le tournoi est complet");
    if (tournament.entries.some((e) => e.userId === userId))
      throw new TournamentError("Vous êtes déjà inscrit à ce tournoi");

    if (tournament.entryFeeCents > 0) {
      await applyTransaction(tx, {
        userId,
        type: "TOURNAMENT_ENTRY",
        amountCents: -tournament.entryFeeCents,
        reference: `Inscription — ${tournament.name}`,
      });
    }
    return tx.tournamentEntry.create({
      data: { tournamentId, userId },
    });
  });
}

/** Désinscription tant que le tournoi n'a pas démarré (remboursement). */
export async function unregisterFromTournament(
  tournamentId: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) throw new TournamentError("Tournoi introuvable");
    if (tournament.status !== "REGISTRATION")
      throw new TournamentError("Le tournoi a déjà démarré");

    const entry = await tx.tournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });
    if (!entry) throw new TournamentError("Vous n'êtes pas inscrit");

    await tx.tournamentEntry.delete({ where: { id: entry.id } });
    if (tournament.entryFeeCents > 0) {
      await applyTransaction(tx, {
        userId,
        type: "WAGER_REFUND",
        amountCents: tournament.entryFeeCents,
        reference: `Désinscription — ${tournament.name}`,
      });
    }
  });
}

/** Génère l'arbre à élimination directe et passe le tournoi en LIVE. */
export async function startTournament(tournamentId: string) {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: { entries: true },
    });
    if (!tournament) throw new TournamentError("Tournoi introuvable");
    if (tournament.status !== "REGISTRATION")
      throw new TournamentError("Ce tournoi a déjà démarré");
    if (tournament.entries.length < 2)
      throw new TournamentError("Il faut au moins 2 inscrits pour démarrer");

    const players = [...tournament.entries.map((e) => e.userId)];
    // Mélange (Fisher-Yates) pour un tirage au sort des têtes de série.
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    let size = 2;
    while (size < players.length) size *= 2;
    while (players.length < size) players.push(null as unknown as string);

    const firstRound: BracketMatch[] = [];
    for (let i = 0; i < size; i += 2) {
      const p1 = players[i] ?? null;
      const p2 = players[i + 1] ?? null;
      // Bye : qualification automatique.
      const winner = p1 && !p2 ? p1 : !p1 && p2 ? p2 : null;
      firstRound.push({ p1, p2, winner });
    }

    const rounds: BracketMatch[][] = [firstRound];
    let n = firstRound.length;
    while (n > 1) {
      n = Math.floor(n / 2);
      rounds.push(
        Array.from({ length: n }, () => ({ p1: null, p2: null, winner: null }))
      );
    }
    propagateWinners(rounds);

    return tx.tournament.update({
      where: { id: tournamentId },
      data: { status: "LIVE", bracketJson: JSON.stringify({ rounds }) },
    });
  });
}

function propagateWinners(rounds: BracketMatch[][]): void {
  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].forEach((m, i) => {
      if (!m.winner) return;
      const next = rounds[r + 1][Math.floor(i / 2)];
      if (i % 2 === 0) next.p1 = m.winner;
      else next.p2 = m.winner;
    });
  }
}

/**
 * Enregistre le vainqueur d'un match de l'arbre. Quand la finale est jouée,
 * distribue automatiquement la cagnotte (70 % / 30 %, ou 100 % à 2 joueurs).
 */
export async function setBracketWinner(
  tournamentId: string,
  round: number,
  matchIndex: number,
  winnerId: string
) {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: { entries: true },
    });
    if (!tournament) throw new TournamentError("Tournoi introuvable");
    if (tournament.status !== "LIVE")
      throw new TournamentError("Le tournoi n'est pas en cours");

    const bracket = parseBracket(tournament.bracketJson);
    if (!bracket) throw new TournamentError("Arbre du tournoi invalide");

    const match = bracket.rounds[round]?.[matchIndex];
    if (!match) throw new TournamentError("Match introuvable dans l'arbre");
    if (match.winner) throw new TournamentError("Ce match est déjà décidé");
    if (winnerId !== match.p1 && winnerId !== match.p2)
      throw new TournamentError("Le vainqueur doit être un joueur du match");

    match.winner = winnerId;
    propagateWinners(bracket.rounds);

    const finalRound = bracket.rounds[bracket.rounds.length - 1];
    const champion = finalRound[0]?.winner ?? null;

    if (!champion) {
      return tx.tournament.update({
        where: { id: tournamentId },
        data: { bracketJson: JSON.stringify(bracket) },
      });
    }

    // Finale jouée : paiement des prix.
    const finale = finalRound[0];
    const runnerUp = finale.p1 === champion ? finale.p2 : finale.p1;
    const pool = prizePoolCents({
      entryFeeCents: tournament.entryFeeCents,
      bonusPoolCents: tournament.bonusPoolCents,
      entriesCount: tournament.entries.length,
    });

    const payFirst =
      runnerUp && tournament.entries.length >= 4
        ? Math.round(pool * 0.7)
        : pool;
    const paySecond = pool - payFirst;

    if (payFirst > 0) {
      await applyTransaction(tx, {
        userId: champion,
        type: "TOURNAMENT_PRIZE",
        amountCents: payFirst,
        reference: `1re place — ${tournament.name}`,
      });
    }
    if (runnerUp && paySecond > 0) {
      await applyTransaction(tx, {
        userId: runnerUp,
        type: "TOURNAMENT_PRIZE",
        amountCents: paySecond,
        reference: `2e place — ${tournament.name}`,
      });
    }

    await tx.tournamentEntry.updateMany({
      where: { tournamentId, userId: champion },
      data: { placement: 1 },
    });
    if (runnerUp) {
      await tx.tournamentEntry.updateMany({
        where: { tournamentId, userId: runnerUp },
        data: { placement: 2 },
      });
    }
    await tx.user.update({
      where: { id: champion },
      data: { xp: { increment: 100 } },
    });
    await tx.notification.create({
      data: {
        userId: champion,
        title: "Champion de tournoi ! 🏆",
        body: `Vous remportez « ${tournament.name} ». Vos gains sont crédités.`,
        href: `/tournaments/${tournament.id}`,
      },
    });

    return tx.tournament.update({
      where: { id: tournamentId },
      data: { bracketJson: JSON.stringify(bracket), status: "COMPLETED" },
    });
  });
}
