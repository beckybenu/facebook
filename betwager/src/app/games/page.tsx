import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHeader, PlatformBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Jeux",
  description:
    "Tous les jeux disponibles sur Betwager : FPS, Battle Royale, Sport, Combat et Course.",
};

export default async function GamesPage() {
  const [games, openMatches, upcomingTournaments] = await Promise.all([
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    prisma.match.groupBy({
      by: ["gameId"],
      where: { status: "OPEN" },
      _count: { _all: true },
    }),
    prisma.tournament.groupBy({
      by: ["gameId"],
      where: { status: "REGISTRATION" },
      _count: { _all: true },
    }),
  ]);

  const openCounts = new Map(openMatches.map((m) => [m.gameId, m._count._all]));
  const tournamentCounts = new Map(
    upcomingTournaments.map((t) => [t.gameId, t._count._all])
  );

  return (
    <div>
      <PageHeader
        title="Nos jeux"
        subtitle="Choisissez votre jeu et trouvez un adversaire à votre mesure. Matchs à mise et tournois cash sur toutes les plateformes."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const platforms = game.platforms
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
          const open = openCounts.get(game.id) ?? 0;
          const tournaments = tournamentCounts.get(game.id) ?? 0;
          return (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="card group flex flex-col gap-4 border-t-4 p-6 transition-all hover:-translate-y-1"
              style={{ borderTopColor: game.color }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
                  style={{ backgroundColor: `${game.color}22` }}
                >
                  {game.icon}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white transition-colors group-hover:text-accent">
                    {game.name}
                  </h2>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {game.category}
                  </p>
                </div>
              </div>
              {game.description ? (
                <p className="line-clamp-2 text-sm text-muted">{game.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {platforms.map((p) => (
                  <PlatformBadge key={p} platform={p} />
                ))}
              </div>
              <div className="mt-auto flex items-center gap-2 border-t border-edge pt-4">
                <span className="badge bg-accent-soft text-accent">
                  {open} match{open > 1 ? "s" : ""} ouvert{open > 1 ? "s" : ""}
                </span>
                <span className="badge bg-violet-soft text-violet">
                  {tournaments} tournoi{tournaments > 1 ? "s" : ""} à venir
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
