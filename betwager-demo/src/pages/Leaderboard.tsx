import { Link } from "react-router-dom";
import { useStore } from "../store";
import { Avatar, PageHeader, formatMoney } from "../ui";

function ratio(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)} %`;
}

export default function Leaderboard() {
  const { state, me } = useStore();
  const players = state.users
    .filter((u) => u.role !== "ADMIN")
    .sort((a, b) => b.wins - a.wins || b.xp - a.xp)
    .slice(0, 25);

  const gains = new Map<string, number>();
  for (const t of state.transactions) {
    if (t.type === "WAGER_PAYOUT" || t.type === "TOURNAMENT_PRIZE") {
      gains.set(t.userId, (gains.get(t.userId) ?? 0) + t.amountCents);
    }
  }
  const gainsRows = [...gains.entries()]
    .map(([userId, total]) => ({
      user: state.users.find((u) => u.id === userId && u.role !== "ADMIN"),
      total,
    }))
    .filter((r) => r.user)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const podium = players.slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];
  const podiumOrder = [1, 0, 2];

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
                to={`/players/${p.username}`}
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
                    <span className="ml-1.5 align-middle text-xs text-gold">★ ELITE</span>
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
                {players.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-edge/50 transition-colors hover:bg-surface ${
                      me?.id === p.id ? "border-l-2 border-l-accent bg-accent-soft/40" : ""
                    }`}
                  >
                    <td className="px-6 py-3 font-bold text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/players/${p.username}`}
                        className="flex items-center gap-2.5 font-medium text-white hover:text-accent"
                      >
                        <Avatar username={p.username} color={p.avatarColor} size={28} />
                        {p.username}
                        {p.elite ? <span className="text-xs text-gold">★</span> : null}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-accent">{p.wins}</td>
                    <td className="px-4 py-3 text-right text-muted">{p.losses}</td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {ratio(p.wins, p.losses)}
                    </td>
                    <td className="px-6 py-3 text-right text-violet">{p.xp}</td>
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
              Aucun gain distribué pour l'instant.
            </p>
          ) : (
            <ul>
              {gainsRows.map((r, i) => (
                <li key={r.user!.id} className="border-b border-edge/50">
                  <Link
                    to={`/players/${r.user!.username}`}
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
