import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatDate, serviceFeeCents } from "@/lib/money";
import {
  Avatar,
  BackLink,
  PlatformBadge,
  StatusBadge,
} from "@/components/ui";
import WagerActions from "@/components/wagers/WagerActions";

const REGION_LABELS: Record<string, string> = {
  EU: "Europe",
  NA: "Amérique du Nord",
  ASIA: "Asie",
};

function PlayerPanel({
  player,
  isWinner,
  roleLabel,
}: {
  player: {
    username: string;
    avatarColor: string;
    wins: number;
    losses: number;
  } | null;
  isWinner: boolean;
  roleLabel: string;
}) {
  if (!player) {
    return (
      <div className="flex flex-1 flex-col items-center gap-3 rounded-xl border border-dashed border-edge bg-surface px-6 py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-edge text-2xl text-muted">
          ?
        </span>
        <p className="font-semibold text-muted">En attente d&apos;un adversaire</p>
        <p className="text-xs text-muted">La place est libre — acceptez le défi !</p>
      </div>
    );
  }
  return (
    <div
      className={`relative flex flex-1 flex-col items-center gap-3 rounded-xl border px-6 py-8 text-center transition-colors ${
        isWinner
          ? "border-gold/60 bg-gold/5 shadow-glow"
          : "border-edge bg-surface"
      }`}
    >
      {isWinner ? (
        <span className="absolute -top-4 text-3xl" aria-hidden>
          👑
        </span>
      ) : null}
      <Avatar username={player.username} color={player.avatarColor} size={64} />
      <div>
        <Link
          href={`/players/${player.username}`}
          className="text-lg font-bold text-white transition-colors hover:text-accent"
        >
          {player.username}
        </Link>
        <p className="mt-0.5 text-xs uppercase tracking-wider text-muted">
          {roleLabel}
        </p>
      </div>
      <p className="text-sm text-muted">
        <span className="font-semibold text-accent">{player.wins} V</span>
        {" — "}
        <span className="font-semibold text-danger">{player.losses} D</span>
      </p>
      {isWinner ? (
        <span className="badge bg-gold/15 text-gold">Vainqueur</span>
      ) : null}
    </div>
  );
}

export default async function WagerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      game: true,
      creator: true,
      opponent: true,
      winner: true,
      dispute: true,
    },
  });
  if (!match) notFound();

  const viewer = await getCurrentUser();
  const isCreator = viewer?.id === match.creatorId;
  const isOpponent = viewer != null && viewer.id === match.opponentId;
  const viewerHasReported = isCreator
    ? match.creatorReport != null
    : isOpponent
      ? match.opponentReport != null
      : false;

  const grossCents = match.entryFeeCents * 2;
  const feeCents = serviceFeeCents(grossCents, match.winner?.elite ?? false);
  const payoutCents = grossCents - feeCents;

  return (
    <div>
      <BackLink href="/wagers" label="Tous les matchs" />

      {/* En-tête */}
      <section className="card p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/games/${match.game.slug}`}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl transition-transform hover:scale-105"
              style={{ backgroundColor: `${match.game.color}22` }}
            >
              {match.game.icon}
            </Link>
            <div>
              <Link
                href={`/games/${match.game.slug}`}
                className="text-xs font-semibold uppercase tracking-wider transition-colors hover:underline"
                style={{ color: match.game.color }}
              >
                {match.game.name}
              </Link>
              <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                {match.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={match.status} />
                <PlatformBadge platform={match.platform} />
                <span className="badge border border-edge bg-elevated text-slate-300">
                  {REGION_LABELS[match.region] ?? match.region}
                </span>
                <span className="badge border border-edge bg-elevated text-slate-300">
                  {match.teamSize}v{match.teamSize}
                </span>
              </div>
            </div>
          </div>
          <p className="shrink-0 text-sm text-muted">
            Créé le {formatDate(match.createdAt)}
          </p>
        </div>
      </section>

      {/* Face-à-face */}
      <section className="card mt-6 p-8">
        <div className="flex flex-col items-stretch gap-6 sm:flex-row sm:items-center">
          <PlayerPanel
            player={match.creator}
            isWinner={
              match.status === "COMPLETED" && match.winnerId === match.creatorId
            }
            roleLabel="Créateur"
          />
          <div className="flex items-center justify-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-edge bg-elevated text-lg font-extrabold tracking-wider text-accent">
              VS
            </span>
          </div>
          <PlayerPanel
            player={match.opponent}
            isWinner={
              match.status === "COMPLETED" &&
              match.winnerId != null &&
              match.winnerId === match.opponentId
            }
            roleLabel="Adversaire"
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Carte financière */}
        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Enjeu financier
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">
                Mise par joueur
              </p>
              <p className="mt-1 text-xl font-extrabold text-white">
                {formatMoney(match.entryFeeCents)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">
                Cagnotte totale
              </p>
              <p className="mt-1 text-xl font-extrabold text-gold">
                {formatMoney(grossCents)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">
                Gain net
              </p>
              <p className="mt-1 text-xl font-extrabold text-accent">
                {formatMoney(payoutCents)}
              </p>
            </div>
          </div>
          <p className="mt-5 border-t border-edge pt-4 text-xs leading-relaxed text-muted">
            Le vainqueur remporte la cagnotte totale moins{" "}
            {formatMoney(feeCents)} de frais de service Betwager.
          </p>
        </section>

        {/* Règles */}
        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Règles du match
          </h2>
          {match.rules ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {match.rules}
            </p>
          ) : (
            <p className="mt-4 text-sm italic text-muted">
              Aucune règle particulière — les règles standard du jeu s&apos;appliquent.
            </p>
          )}
        </section>
      </div>

      {/* Actions */}
      <section className="mt-6">
        <WagerActions
          matchId={match.id}
          status={match.status}
          entryFeeCents={match.entryFeeCents}
          isLoggedIn={viewer != null}
          isCreator={isCreator}
          isOpponent={isOpponent}
          viewerHasReported={viewerHasReported}
          disputeReason={match.dispute?.reason ?? null}
          winnerUsername={match.winner?.username ?? null}
          payoutCents={payoutCents}
        />
      </section>
    </div>
  );
}
