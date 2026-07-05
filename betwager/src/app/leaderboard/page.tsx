import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { PageHeader, Avatar } from "@/components/ui";

export const metadata = { title: "Classement" };

function ratio(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)} %`;
}

export default async function LeaderboardPage() {
  const [topPlayers, gainsGroups, currentUser] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      orderBy: [{ wins: "desc" }, { xp: "desc" }],
      take: 25,
    }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where: { type: { in: ["WAGER_PAYOUT", "TOURNAMENT_PRIZE"] } },
      _sum: { amountCents: true },
      orderBy: { _sum: { amountCents: "desc" } },
      take: 12,
    }),
    getCurrentUser(),
  ]);

  const gainsUsers = await prisma.user.findMany({
    where: {
      id: { in: gainsGroups.map((g) => g.userId) },
      role: { not: "ADMIN" },
    },
  });
  const gainsRows = gainsGroups
    .map((g) => ({
      user: gainsUsers.find((u) => u.id === g.userId),
      total: g._sum.amountCents ?? 0,
    }))
    .filter((r) => r.user)
    .slice(0, 10);

  const podium = topPlayers.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];
  const podiumOrder = [1, 0, 2]; // 2e — 1er — 3e visuellement

  return (
    <div>
      <PageHeader
        title="Classement des joueurs"
        subtitle="Les meilleurs compétiteurs de Betwager, classés par victoires et par gains."
      />

      {podium.length === 3 ? (
        <div className="mb-10 grid gap-4 sm:grid-cols-3 sm:items-end">
          {podiumOrder.map((idx) => {
            const p = podium[idx];
            return (
              <Link
                key={p.id}
                href={`/players/${p.username}`}
                className={`card flex flex-col items-center gap-2 p-6 text-center transition-colors hover:border-accent/50 ${
                  idx === 0 ? "border-gold/50 sm:py-10" : ""
                }`}
              >
                <span className="text-3xl">{medals[idx]}</span>
                <Avatar
                  username={p.username}
                  color={p.avatarColor}
                  size={idx === 0 ? 64 : 48}
                />
                <p className="font-bold text-white">
                  {p.username}
                  {p.elite ? (
                    <span className="ml-1.5 align-middle text-xs text-gold">
                      ★ ELITE
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted">
                  <span className="font-bold text-accent">{p.wins}</span>{" "}
                  victoires · ratio {ratio(p.wins, p.losses)}
                </p>
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-edge px-6 py-4">
            <h2 className="font-bold text-white">Top 25 — victoires</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-6 py-3">#</th>
                  <th className="px-4 py-3">Joueur</th>
                  <th className="px-4 py-3 text-right">V</th>
                  <th className="px-4 py-3 text-right">D</th>
                  <th className="px-4 py-3 text-right">Ratio</th>
                  <th className="px-6 py-3 text-right">XP</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-edge/50 transition-colors hover:bg-surface ${
                      currentUser?.id === p.id
                        ? "border-l-2 border-l-accent bg-accent-soft/40"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-3 font-bold text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/players/${p.username}`}
                        className="flex items-center gap-2.5 font-medium text-white hover:text-accent"
                      >
                        <Avatar
                          username={p.username}
                          color={p.avatarColor}
                          size={28}
                        />
                        {p.username}
                        {p.elite ? (
                          <span className="text-xs text-gold">★</span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-accent">
                      {p.wins}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {p.losses}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {ratio(p.wins, p.losses)}
                    </td>
                    <td className="px-6 py-3 text-right text-violet">
                      {p.xp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-edge px-6 py-4">
            <h2 className="font-bold text-white">Top gains 💰</h2>
          </div>
          {gainsRows.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted">
              Aucun gain distribué pour l&apos;instant.
            </p>
          ) : (
            <ul>
              {gainsRows.map((r, i) => (
                <li key={r.user!.id} className="border-b border-edge/50">
                  <Link
                    href={`/players/${r.user!.username}`}
                    className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-surface"
                  >
                    <span className="w-5 font-bold text-muted">{i + 1}</span>
                    <Avatar
                      username={r.user!.username}
                      color={r.user!.avatarColor}
                      size={28}
                    />
                    <span className="truncate font-medium text-white">
                      {r.user!.username}
                    </span>
                    <span className="ml-auto font-bold text-gold">
                      {formatMoney(r.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
