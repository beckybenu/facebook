import { Avatar } from "@/components/ui";
import type { Bracket, BracketMatch } from "@/lib/tournament-engine";

export type BracketPlayer = { username: string; avatarColor: string };

function roundTitle(matchCount: number, roundIndex: number): string {
  switch (matchCount) {
    case 1:
      return "Finale";
    case 2:
      return "Demi-finales";
    case 4:
      return "Quarts de finale";
    case 8:
      return "Huitièmes de finale";
    default:
      return `Round ${roundIndex + 1}`;
  }
}

function PlayerRow({
  userId,
  match,
  players,
}: {
  userId: string | null;
  match: BracketMatch;
  players: Record<string, BracketPlayer>;
}) {
  // Slot vide : "Bye" si le match est déjà décidé (qualification automatique),
  // sinon l'adversaire n'est pas encore connu.
  if (!userId) {
    return (
      <div className="flex items-center gap-2 rounded-md px-2.5 py-2 opacity-60">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-edge text-[10px] text-muted">
          ?
        </span>
        <span className="text-xs italic text-muted">
          {match.winner ? "Bye" : "À déterminer"}
        </span>
      </div>
    );
  }

  const player = players[userId];
  const isWinner = match.winner === userId;
  const eliminated = match.winner !== null && !isWinner;

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2.5 py-2 ${
        isWinner ? "bg-accent-soft" : eliminated ? "opacity-50" : ""
      }`}
    >
      <Avatar
        username={player?.username ?? "?"}
        color={player?.avatarColor}
        size={24}
      />
      <span
        className={`truncate text-sm ${
          isWinner ? "font-bold text-accent" : "font-medium text-white"
        }`}
      >
        {player?.username ?? "Joueur inconnu"}
      </span>
      {isWinner ? <span className="ml-auto text-xs text-accent">✓</span> : null}
    </div>
  );
}

/** Arbre à élimination directe : une colonne par round, scroll horizontal. */
export default function BracketView({
  bracket,
  players,
}: {
  bracket: Bracket;
  players: Record<string, BracketPlayer>;
}) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-8">
        {bracket.rounds.map((round, r) => (
          <div key={r} className="flex flex-col">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
              {roundTitle(round.length, r)}
            </p>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {round.map((match, i) => (
                <div
                  key={i}
                  className="w-56 shrink-0 rounded-lg border border-edge bg-surface p-1.5"
                >
                  <PlayerRow userId={match.p1} match={match} players={players} />
                  <div className="mx-2 my-0.5 border-t border-edge/60" />
                  <PlayerRow userId={match.p2} match={match} players={players} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
