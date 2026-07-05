import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/money";
import {
  Avatar,
  BackLink,
  EmptyState,
  PlatformBadge,
  StatusBadge,
} from "@/components/ui";

export default async function GameDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const game = await prisma.game.findUnique({ where: { slug: params.slug } });
  if (!game) notFound();

  const [openMatches, tournaments] = await Promise.all([
    prisma.match.findMany({
      where: { gameId: game.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { creator: true },
    }),
    prisma.tournament.findMany({
      where: { gameId: game.id, status: { in: ["REGISTRATION", "LIVE"] } },
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { entries: true } } },
    }),
  ]);

  const platforms = game.platforms
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div>
      <BackLink href="/games" label="Tous les jeux" />

      {/* Bandeau du jeu */}
      <section
        className="card relative overflow-hidden p-8"
        style={{
          backgroundImage: `radial-gradient(circle at 15% 20%, ${game.color}2E, transparent 55%)`,
          borderColor: `${game.color}55`,
        }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-5xl"
              style={{ backgroundColor: `${game.color}22` }}
            >
              {game.icon}
            </span>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: game.color }}
              >
                {game.category}
              </p>
              <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
                {game.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {platforms.map((p) => (
                  <PlatformBadge key={p} platform={p} />
                ))}
              </div>
            </div>
          </div>
          <Link
            href={`/wagers/create?game=${game.slug}`}
            className="btn-primary shrink-0 px-6 py-3"
          >
            Créer un match
          </Link>
        </div>
        {game.description ? (
          <p className="mt-6 max-w-3xl leading-relaxed text-muted">
            {game.description}
          </p>
        ) : null}
      </section>

      {/* Matchs ouverts */}
      <section className="mt-12">
        <h2 className="section-title mb-6">
          Matchs ouverts{" "}
          <span className="text-accent">({openMatches.length})</span>
        </h2>
        {openMatches.length === 0 ? (
          <EmptyState
            title="Aucun match ouvert pour l'instant"
            subtitle={`Soyez le premier à lancer un défi sur ${game.name}.`}
            action={
              <Link
                href={`/wagers/create?game=${game.slug}`}
                className="btn-primary"
              >
                Créer un match
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openMatches.map((match) => (
              <Link
                key={match.id}
                href={`/wagers/${match.id}`}
                className="card group flex flex-col gap-4 p-5 transition-all hover:-translate-y-1 hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-white transition-colors group-hover:text-accent">
                    {match.title}
                  </p>
                  <StatusBadge status={match.status} />
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar
                    username={match.creator.username}
                    color={match.creator.avatarColor}
                    size={32}
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {match.creator.username}
                    </p>
                    <p className="text-xs text-muted">
                      {match.creator.wins} V — {match.creator.losses} D
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-edge pt-4">
                  <span className="text-lg font-extrabold text-accent">
                    {formatMoney(match.entryFeeCents)}
                  </span>
                  <PlatformBadge platform={match.platform} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tournois */}
      <section className="mt-12">
        <h2 className="section-title mb-6">
          Tournois <span className="text-violet">({tournaments.length})</span>
        </h2>
        {tournaments.length === 0 ? (
          <EmptyState
            title="Aucun tournoi programmé"
            subtitle={`Les prochains tournois ${game.name} apparaîtront ici. Revenez bientôt !`}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="card group flex flex-col gap-3 p-6 transition-all hover:-translate-y-1 hover:border-violet/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-bold text-white transition-colors group-hover:text-violet">
                    {t.name}
                  </p>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-sm text-muted">
                  Début : {formatDate(t.startsAt)}
                </p>
                <div className="flex flex-wrap items-center gap-3 border-t border-edge pt-4 text-sm">
                  <span className="font-bold text-gold">
                    {t.entryFeeCents === 0
                      ? "Entrée gratuite"
                      : `Entrée : ${formatMoney(t.entryFeeCents)}`}
                  </span>
                  <span className="text-muted">
                    {t._count.entries}/{t.maxPlayers} inscrits
                  </span>
                  <PlatformBadge platform={t.platform} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
