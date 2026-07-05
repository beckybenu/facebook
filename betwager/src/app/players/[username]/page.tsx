import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/money";
import { Avatar, StatCard, EmptyState } from "@/components/ui";

export default async function PlayerPage({
  params,
}: {
  params: { username: string };
}) {
  const player = await prisma.user.findUnique({
    where: { username: decodeURIComponent(params.username) },
  });
  if (!player) notFound();

  const matches = await prisma.match.findMany({
    where: {
      status: "COMPLETED",
      OR: [{ creatorId: player.id }, { opponentId: player.id }],
    },
    orderBy: { completedAt: "desc" },
    take: 10,
    include: { game: true, creator: true, opponent: true },
  });

  const total = player.wins + player.losses;
  const ratio = total > 0 ? Math.round((player.wins / total) * 100) : 0;

  const gamertags = [
    { label: "PSN", icon: "🎮", value: player.gamertagPsn },
    { label: "Xbox", icon: "🟢", value: player.gamertagXbox },
    { label: "Activision", icon: "🎯", value: player.gamertagActivision },
    { label: "Epic Games", icon: "🚀", value: player.gamertagEpic },
  ].filter((g) => g.value);

  return (
    <div className="space-y-8">
      <div className="card flex flex-col gap-6 px-8 py-8 sm:flex-row sm:items-center">
        <Avatar
          username={player.username}
          color={player.avatarColor}
          size={80}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {player.username}
            </h1>
            {player.elite ? (
              <span className="badge bg-gold/15 text-gold">⭐ Elite</span>
            ) : null}
            <span className="badge border border-edge bg-elevated text-slate-300">
              {player.country}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Membre depuis le {formatDate(player.createdAt)}
          </p>
          {player.bio ? (
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              {player.bio}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Victoires" value={String(player.wins)} accent />
        <StatCard label="Défaites" value={String(player.losses)} />
        <StatCard label="Ratio" value={`${ratio} %`} />
        <StatCard label="XP" value={String(player.xp)} />
      </div>

      {gamertags.length > 0 ? (
        <div className="card px-8 py-6">
          <h2 className="mb-4 text-lg font-bold text-white">Gamertags</h2>
          <div className="flex flex-wrap gap-3">
            {gamertags.map((g) => (
              <div
                key={g.label}
                className="flex items-center gap-2 rounded-xl border border-edge bg-elevated px-4 py-2"
              >
                <span>{g.icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {g.label}
                </span>
                <span className="text-sm font-medium text-white">
                  {g.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 text-xl font-bold text-white">Derniers matchs</h2>
        {matches.length === 0 ? (
          <EmptyState
            title="Aucun match terminé"
            subtitle="Ce joueur n'a pas encore disputé de match sur Betwager."
          />
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const won = match.winnerId === player.id;
              const opponentUser =
                match.creatorId === player.id ? match.opponent : match.creator;
              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="card flex flex-col gap-3 px-6 py-4 transition-colors hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`badge shrink-0 ${
                        won
                          ? "bg-accent-soft text-accent"
                          : "bg-danger/15 text-danger"
                      }`}
                    >
                      {won ? "Victoire" : "Défaite"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {match.game.icon} {match.game.name} — {match.title}
                      </p>
                      <p className="text-sm text-muted">
                        contre{" "}
                        <span className="text-slate-300">
                          {opponentUser?.username ?? "Inconnu"}
                        </span>
                        {match.completedAt
                          ? ` · ${formatDate(match.completedAt)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 font-bold text-gold">
                    {formatMoney(match.entryFeeCents)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
