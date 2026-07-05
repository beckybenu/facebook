import type {
  Bracket,
  BracketMatch,
  Match,
  State,
  Tournament,
  TxType,
  User,
} from "./types";

/** Erreur métier affichable telle quelle à l'utilisateur. */
export class BizError extends Error {}

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())).slice(0, 12);

export const now = () => new Date().toISOString();

export function serviceFeeCents(gross: number, elite: boolean): number {
  return Math.round(gross * (elite ? 0.05 : 0.1));
}

export function findUser(s: State, id: string | null): User | undefined {
  return s.users.find((u) => u.id === id);
}

/** Mouvement d'argent atomique : refuse tout solde négatif. */
export function applyTx(
  s: State,
  userId: string,
  type: TxType,
  amountCents: number,
  reference: string
): void {
  const user = findUser(s, userId);
  if (!user) throw new BizError("Utilisateur introuvable");
  const newBalance = user.balanceCents + amountCents;
  if (newBalance < 0) throw new BizError("Solde insuffisant");
  user.balanceCents = newBalance;
  s.transactions.unshift({
    id: uid(),
    userId,
    type,
    amountCents,
    balanceAfterCents: newBalance,
    reference,
    createdAt: now(),
  });
}

export function notify(
  s: State,
  userId: string,
  title: string,
  body: string,
  href: string
): void {
  s.notifications.unshift({
    id: uid(),
    userId,
    title,
    body,
    href,
    read: false,
    createdAt: now(),
  });
}

// ---------------------------------------------------------------- Matchs

export function createMatch(
  s: State,
  params: {
    creatorId: string;
    gameSlug: string;
    title: string;
    rules: string;
    platform: string;
    region: string;
    teamSize: number;
    entryFeeCents: number;
  }
): Match {
  if (params.entryFeeCents < 100)
    throw new BizError("La mise minimale est de 1 €");
  if (params.entryFeeCents > 50000)
    throw new BizError("La mise maximale est de 500 €");
  if (params.title.trim().length < 3)
    throw new BizError("Donnez un titre à votre match (3 caractères minimum)");

  applyTx(
    s,
    params.creatorId,
    "WAGER_STAKE",
    -params.entryFeeCents,
    "Mise — nouveau match"
  );
  const match: Match = {
    id: uid(),
    gameSlug: params.gameSlug,
    creatorId: params.creatorId,
    opponentId: null,
    winnerId: null,
    title: params.title.trim(),
    rules: params.rules.trim(),
    platform: params.platform,
    region: params.region,
    teamSize: params.teamSize,
    entryFeeCents: params.entryFeeCents,
    status: "OPEN",
    creatorReport: null,
    opponentReport: null,
    createdAt: now(),
    completedAt: null,
  };
  s.matches.unshift(match);
  return match;
}

export function acceptMatch(s: State, matchId: string, opponentId: string) {
  const m = s.matches.find((x) => x.id === matchId);
  if (!m) throw new BizError("Match introuvable");
  if (m.status !== "OPEN") throw new BizError("Ce match n'est plus ouvert");
  if (m.creatorId === opponentId)
    throw new BizError("Vous ne pouvez pas accepter votre propre match");
  applyTx(s, opponentId, "WAGER_STAKE", -m.entryFeeCents, `Mise — ${m.title}`);
  m.opponentId = opponentId;
  m.status = "ACCEPTED";
  notify(
    s,
    m.creatorId,
    "Défi accepté !",
    "Un adversaire a accepté votre match. Jouez puis déclarez le résultat.",
    `/wagers/${m.id}`
  );
}

export function cancelMatch(s: State, matchId: string, userId: string) {
  const m = s.matches.find((x) => x.id === matchId);
  if (!m) throw new BizError("Match introuvable");
  if (m.creatorId !== userId)
    throw new BizError("Seul le créateur peut annuler ce match");
  if (m.status !== "OPEN")
    throw new BizError("Seul un match ouvert peut être annulé");
  applyTx(
    s,
    m.creatorId,
    "WAGER_REFUND",
    m.entryFeeCents,
    `Remboursement — ${m.title}`
  );
  m.status = "CANCELLED";
}

function settleMatch(s: State, m: Match, winnerId: string) {
  const winner = findUser(s, winnerId);
  if (!winner || !m.opponentId) throw new BizError("Match invalide");
  const loserId = winnerId === m.creatorId ? m.opponentId : m.creatorId;
  const loser = findUser(s, loserId)!;

  const gross = m.entryFeeCents * 2;
  const fee = serviceFeeCents(gross, winner.elite);
  applyTx(
    s,
    winnerId,
    "WAGER_PAYOUT",
    gross - fee,
    `Gains — ${m.title} (frais ${(fee / 100).toFixed(2).replace(".", ",")} €)`
  );
  winner.wins += 1;
  winner.xp += 25;
  loser.losses += 1;
  loser.xp += 5;
  m.status = "COMPLETED";
  m.winnerId = winnerId;
  m.completedAt = now();
  notify(
    s,
    winnerId,
    "Victoire ! 🏆",
    "Vos gains ont été crédités sur votre portefeuille.",
    `/wagers/${m.id}`
  );
  notify(
    s,
    loserId,
    "Match terminé",
    "Défaite enregistrée. Retentez votre chance !",
    `/wagers/${m.id}`
  );
}

export function reportResult(
  s: State,
  matchId: string,
  userId: string,
  report: "WIN" | "LOSS"
) {
  const m = s.matches.find((x) => x.id === matchId);
  if (!m) throw new BizError("Match introuvable");
  if (!["ACCEPTED", "REPORTED"].includes(m.status))
    throw new BizError("Ce match n'attend pas de résultat");
  if (userId !== m.creatorId && userId !== m.opponentId)
    throw new BizError("Vous ne participez pas à ce match");

  if (userId === m.creatorId) m.creatorReport = report;
  else m.opponentReport = report;
  m.status = "REPORTED";

  if (!m.creatorReport || !m.opponentReport) return;

  if (m.creatorReport !== m.opponentReport) {
    const winnerId = m.creatorReport === "WIN" ? m.creatorId : m.opponentId!;
    settleMatch(s, m, winnerId);
    return;
  }

  // Contradiction → litige.
  m.status = "DISPUTED";
  if (!s.disputes.some((d) => d.matchId === m.id)) {
    s.disputes.unshift({
      id: uid(),
      matchId: m.id,
      openedById: userId,
      reason:
        "Déclarations contradictoires : les deux joueurs revendiquent le même résultat.",
      status: "OPEN",
      resolution: "",
      createdAt: now(),
    });
  }
}

export function adminResolveDispute(
  s: State,
  disputeId: string,
  action: "SETTLE" | "VOID",
  winnerId: string | null,
  resolution: string
) {
  const d = s.disputes.find((x) => x.id === disputeId);
  if (!d) throw new BizError("Litige introuvable");
  if (d.status !== "OPEN") throw new BizError("Ce litige est déjà résolu");
  if (resolution.trim().length < 3)
    throw new BizError("Indiquez un motif de résolution");
  const m = s.matches.find((x) => x.id === d.matchId);
  if (!m) throw new BizError("Match introuvable");

  if (action === "SETTLE") {
    if (!winnerId || (winnerId !== m.creatorId && winnerId !== m.opponentId))
      throw new BizError("Le vainqueur doit être un participant du match");
    settleMatch(s, m, winnerId);
  } else {
    applyTx(s, m.creatorId, "WAGER_REFUND", m.entryFeeCents, `Annulation admin — ${m.title}`);
    if (m.opponentId)
      applyTx(s, m.opponentId, "WAGER_REFUND", m.entryFeeCents, `Annulation admin — ${m.title}`);
    m.status = "CANCELLED";
  }
  d.status = "RESOLVED";
  d.resolution = resolution.trim();
}

// ------------------------------------------------------------- Tournois

export function prizePool(t: Tournament): number {
  return t.entryFeeCents * t.entries.length + t.bonusPoolCents;
}

export function registerTournament(s: State, tournamentId: string, userId: string) {
  const t = s.tournaments.find((x) => x.id === tournamentId);
  if (!t) throw new BizError("Tournoi introuvable");
  if (t.status !== "REGISTRATION")
    throw new BizError("Les inscriptions sont fermées");
  if (t.entries.length >= t.maxPlayers)
    throw new BizError("Le tournoi est complet");
  if (t.entries.some((e) => e.userId === userId))
    throw new BizError("Vous êtes déjà inscrit à ce tournoi");
  if (t.entryFeeCents > 0)
    applyTx(s, userId, "TOURNAMENT_ENTRY", -t.entryFeeCents, `Inscription — ${t.name}`);
  t.entries.push({ userId, placement: null });
}

export function unregisterTournament(s: State, tournamentId: string, userId: string) {
  const t = s.tournaments.find((x) => x.id === tournamentId);
  if (!t) throw new BizError("Tournoi introuvable");
  if (t.status !== "REGISTRATION")
    throw new BizError("Le tournoi a déjà démarré");
  const idx = t.entries.findIndex((e) => e.userId === userId);
  if (idx === -1) throw new BizError("Vous n'êtes pas inscrit");
  t.entries.splice(idx, 1);
  if (t.entryFeeCents > 0)
    applyTx(s, userId, "WAGER_REFUND", t.entryFeeCents, `Désinscription — ${t.name}`);
}

function propagate(rounds: BracketMatch[][]) {
  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].forEach((m, i) => {
      if (!m.winner) return;
      const next = rounds[r + 1][Math.floor(i / 2)];
      if (i % 2 === 0) next.p1 = m.winner;
      else next.p2 = m.winner;
    });
  }
}

export function startTournament(s: State, tournamentId: string) {
  const t = s.tournaments.find((x) => x.id === tournamentId);
  if (!t) throw new BizError("Tournoi introuvable");
  if (t.status !== "REGISTRATION")
    throw new BizError("Ce tournoi a déjà démarré");
  if (t.entries.length < 2)
    throw new BizError("Il faut au moins 2 inscrits pour démarrer");

  const players: (string | null)[] = t.entries.map((e) => e.userId);
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  let size = 2;
  while (size < players.length) size *= 2;
  while (players.length < size) players.push(null);

  const first: BracketMatch[] = [];
  for (let i = 0; i < size; i += 2) {
    const p1 = players[i];
    const p2 = players[i + 1];
    first.push({
      p1,
      p2,
      winner: p1 && !p2 ? p1 : !p1 && p2 ? p2 : null,
    });
  }
  const rounds: BracketMatch[][] = [first];
  let n = first.length;
  while (n > 1) {
    n = Math.floor(n / 2);
    rounds.push(
      Array.from({ length: n }, () => ({ p1: null, p2: null, winner: null }))
    );
  }
  propagate(rounds);
  t.bracket = { rounds };
  t.status = "LIVE";
}

export function setBracketWinner(
  s: State,
  tournamentId: string,
  round: number,
  matchIndex: number,
  winnerId: string
) {
  const t = s.tournaments.find((x) => x.id === tournamentId);
  if (!t) throw new BizError("Tournoi introuvable");
  if (t.status !== "LIVE" || !t.bracket)
    throw new BizError("Le tournoi n'est pas en cours");
  const m = t.bracket.rounds[round]?.[matchIndex];
  if (!m) throw new BizError("Match introuvable dans l'arbre");
  if (m.winner) throw new BizError("Ce match est déjà décidé");
  if (winnerId !== m.p1 && winnerId !== m.p2)
    throw new BizError("Le vainqueur doit être un joueur du match");

  m.winner = winnerId;
  propagate(t.bracket.rounds);

  const finalRound = t.bracket.rounds[t.bracket.rounds.length - 1];
  const champion = finalRound[0]?.winner ?? null;
  if (!champion) return;

  // Finale jouée : distribution des prix (70/30, ou 100 % à moins de 4 joueurs).
  const finale = finalRound[0];
  const runnerUp = finale.p1 === champion ? finale.p2 : finale.p1;
  const pool = prizePool(t);
  const first = runnerUp && t.entries.length >= 4 ? Math.round(pool * 0.7) : pool;
  const second = pool - first;

  if (first > 0)
    applyTx(s, champion, "TOURNAMENT_PRIZE", first, `1re place — ${t.name}`);
  if (runnerUp && second > 0)
    applyTx(s, runnerUp, "TOURNAMENT_PRIZE", second, `2e place — ${t.name}`);

  const champEntry = t.entries.find((e) => e.userId === champion);
  if (champEntry) champEntry.placement = 1;
  if (runnerUp) {
    const ruEntry = t.entries.find((e) => e.userId === runnerUp);
    if (ruEntry) ruEntry.placement = 2;
  }
  const champUser = findUser(s, champion);
  if (champUser) champUser.xp += 100;
  notify(
    s,
    champion,
    "Champion de tournoi ! 🏆",
    `Vous remportez « ${t.name} ». Vos gains sont crédités.`,
    `/tournaments/${t.id}`
  );
  t.status = "COMPLETED";
}

export type { Bracket };
