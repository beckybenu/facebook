export type Role = "USER" | "ADMIN";
export type MatchStatus =
  | "OPEN"
  | "ACCEPTED"
  | "REPORTED"
  | "DISPUTED"
  | "COMPLETED"
  | "CANCELLED";
export type TournamentStatus =
  | "REGISTRATION"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";
export type TxType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "WAGER_STAKE"
  | "WAGER_PAYOUT"
  | "WAGER_REFUND"
  | "TOURNAMENT_ENTRY"
  | "TOURNAMENT_PRIZE"
  | "BONUS";

export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  avatarColor: string;
  bio: string;
  country: string;
  gamertagPsn: string;
  gamertagXbox: string;
  gamertagActivision: string;
  gamertagEpic: string;
  balanceCents: number;
  elite: boolean;
  xp: number;
  wins: number;
  losses: number;
  createdAt: string;
}

export interface Tx {
  id: string;
  userId: string;
  type: TxType;
  amountCents: number;
  balanceAfterCents: number;
  reference: string;
  createdAt: string;
}

export interface Game {
  slug: string;
  name: string;
  category: string;
  platforms: string[];
  color: string;
  icon: string;
  description: string;
}

export interface Match {
  id: string;
  gameSlug: string;
  creatorId: string;
  opponentId: string | null;
  winnerId: string | null;
  title: string;
  rules: string;
  platform: string;
  region: string;
  teamSize: number;
  entryFeeCents: number;
  status: MatchStatus;
  creatorReport: "WIN" | "LOSS" | null;
  opponentReport: "WIN" | "LOSS" | null;
  createdAt: string;
  completedAt: string | null;
}

export interface BracketMatch {
  p1: string | null;
  p2: string | null;
  winner: string | null;
}
export interface Bracket {
  rounds: BracketMatch[][];
}

export interface TournamentEntry {
  userId: string;
  placement: number | null;
}

export interface Tournament {
  id: string;
  gameSlug: string;
  name: string;
  description: string;
  platform: string;
  teamSize: number;
  entryFeeCents: number;
  bonusPoolCents: number;
  maxPlayers: number;
  startsAt: string;
  status: TournamentStatus;
  bracket: Bracket | null;
  entries: TournamentEntry[];
}

export interface Dispute {
  id: string;
  matchId: string;
  openedById: string;
  reason: string;
  status: "OPEN" | "RESOLVED";
  resolution: string;
  createdAt: string;
}

export interface Notif {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
}

export interface State {
  version: number;
  sessionUserId: string | null;
  users: User[];
  transactions: Tx[];
  games: Game[];
  matches: Match[];
  tournaments: Tournament[];
  disputes: Dispute[];
  notifications: Notif[];
}
