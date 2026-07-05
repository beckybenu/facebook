import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatDate } from "@/lib/money";
import { parseBracket, prizePoolCents } from "@/lib/tournament-engine";
import {
  StatusBadge,
  PlatformBadge,
  StatCard,
  Avatar,
  BackLink,
} from "@/components/ui";
import RegisterButton from "@/components/tournaments/RegisterButton";
import BracketView, {
  type BracketPlayer,
} from "@/components/tournaments/BracketView";

export const metadata = { title: "Tournoi" };

export default async function TournamentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [tournament, user] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        game: true,
        entries: { include: { user: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    getCurrentUser(),
  ]);
  if (!tournament) notFound();

  const pool = prizePoolCents({
    entryFeeCents: tournament.entryFeeCents,
    bonusPoolCents: tournament.bonusPoolCents,
    entriesCount: tournament.entries.length,
  });
  const splitPrizes = tournament.entries.length >= 4;
  const firstPrize = splitPrizes ? Math.round(pool * 0.7) : pool;
  const secondPrize = pool - firstPrize;

  const bracket = parseBracket(tournament.bracketJson);
  const players: Record<string, BracketPlayer> = {};
  for (const e of tournament.entries) {
    players[e.userId] = {
      username: e.user.username,
      avatarColor: e.user.avatarColor,
    };
  }
  const isRegistered = user
    ? tournament.entries.some((e) => e.userId === user.id)
    : false;

  return (
    <div>
      <BackLink href="/tournaments" label="Tous les tournois" />

      <div className="card bg-hero-grid p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-4xl">{tournament.game.icon}</span>
              <StatusBadge status={tournament.status} />
              <PlatformBadge platform={tournament.platform} />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {tournament.name}
            </h1>
            <p className="mt-2 text-muted">
              <Link
                href={`/games/${tournament.game.slug}`}
                className="text-accent hover:underline"
              >
                {tournament.game.name}
              </Link>{" "}
              · Format {tournament.teamSize}v{tournament.teamSize} · Début le{" "}
              {formatDate(tournament.startsAt)}
            </p>
            {tournament.description ? (
              <p className="mt-4 max-w-2xl text-slate-300">
                {tournament.description}
              </p>
            ) : null}
          </div>
          {tournament.status === "REGISTRATION" ? (
            <RegisterButton
              tournamentId={tournament.id}
              entryFeeCents={tournament.entryFeeCents}
              isRegistered={isRegistered}
              isFull={tournament.entries.length >= tournament.maxPlayers}
              isLoggedIn={Boolean(user)}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cagnotte totale" value={formatMoney(pool)} accent />
        <StatCard
          label="Frais d'entrée"
          value={
            tournament.entryFeeCents === 0
              ? "Gratuit"
              : formatMoney(tournament.entryFeeCents)
          }
        />
        <StatCard
          label="Inscrits"
          value={`${tournament.entries.length}/${tournament.maxPlayers}`}
        />
        <StatCard label="Début" value={formatDate(tournament.startsAt)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white">
            Répartition des prix
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
              <span className="font-semibold text-white">🥇 1re place</span>
              <span className="font-bold text-gold">
                {formatMoney(firstPrize)}
              </span>
            </div>
            {splitPrizes ? (
              <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                <span className="font-semibold text-white">🥈 2e place</span>
                <span className="font-bold text-slate-300">
                  {formatMoney(secondPrize)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Moins de 4 joueurs : le vainqueur remporte toute la cagnotte.
              </p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted">
            La cagnotte évolue avec les inscriptions (frais d&apos;entrée ×
            inscrits{tournament.bonusPoolCents > 0 ? " + bonus Betwager" : ""}).
            Les prix sont versés automatiquement après la finale.
          </p>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white">
            Participants ({tournament.entries.length})
          </h2>
          {tournament.entries.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Aucun inscrit pour l&apos;instant — soyez le premier !
            </p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {tournament.entries.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/players/${e.user.username}`}
                    className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-3 py-2.5 transition-colors hover:border-accent/50"
                  >
                    <Avatar
                      username={e.user.username}
                      color={e.user.avatarColor}
                      size={32}
                    />
                    <span className="font-medium text-white">
                      {e.user.username}
                    </span>
                    {e.placement === 1 ? (
                      <span className="ml-auto">🥇</span>
                    ) : e.placement === 2 ? (
                      <span className="ml-auto">🥈</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {bracket && tournament.status !== "REGISTRATION" ? (
        <div className="card mt-8 p-6">
          <h2 className="mb-6 text-lg font-bold text-white">
            Arbre du tournoi
          </h2>
          <BracketView bracket={bracket} players={players} />
        </div>
      ) : null}
    </div>
  );
}
