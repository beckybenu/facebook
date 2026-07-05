import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import {
  adminResolveDispute,
  applyTx,
  prizePool,
  setBracketWinner,
  startTournament,
} from "../engine";
import {
  Avatar,
  BackLink,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  formatDate,
  formatMoney,
} from "../ui";

function useAdminGuard() {
  const { me } = useStore();
  return me && me.role === "ADMIN" ? me : null;
}

function Denied() {
  return (
    <EmptyState
      title="Accès administrateur requis"
      subtitle="Connectez-vous avec le compte admin@betwager.gg pour accéder à cette page."
      action={<Link to="/login" className="btn-primary">Connexion</Link>}
    />
  );
}

export function AdminDashboard() {
  const { state } = useStore();
  const admin = useAdminGuard();
  if (!admin) return <Denied />;

  const openDisputes = state.disputes.filter((d) => d.status === "OPEN").length;
  const activeTournaments = state.tournaments.filter((t) =>
    ["REGISTRATION", "LIVE"].includes(t.status)
  ).length;
  const volume = state.transactions
    .filter((t) => t.type === "WAGER_STAKE")
    .reduce((sum, t) => sum + Math.abs(t.amountCents), 0);
  const deposits = state.transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amountCents, 0);

  const sections = [
    {
      to: "/admin/disputes",
      icon: "⚖️",
      title: "Litiges",
      description: "Arbitrer les matchs contestés : trancher ou rembourser.",
      count: `${openDisputes} en attente`,
      urgent: openDisputes > 0,
    },
    {
      to: "/admin/tournaments",
      icon: "🏆",
      title: "Tournois",
      description: "Démarrer les tournois et saisir les vainqueurs des matchs.",
      count: `${activeTournaments} actifs`,
      urgent: false,
    },
    {
      to: "/admin/users",
      icon: "👥",
      title: "Joueurs",
      description: "Gérer les comptes : statut Elite, crédits bonus.",
      count: `${state.users.length} inscrits`,
      urgent: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Pilotage de la plateforme : arbitrage, tournois et gestion des joueurs."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Joueurs" value={String(state.users.length)} />
        <StatCard
          label="Matchs ouverts"
          value={String(state.matches.filter((m) => m.status === "OPEN").length)}
        />
        <StatCard label="Litiges ouverts" value={String(openDisputes)} accent={openDisputes > 0} />
        <StatCard label="Tournois actifs" value={String(activeTournaments)} />
        <StatCard label="Volume misé" value={formatMoney(volume)} />
        <StatCard label="Dépôts totaux" value={formatMoney(deposits)} />
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className={`card group p-6 transition-colors hover:border-accent/50 ${
              s.urgent ? "border-danger/50" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{s.icon}</span>
              <span className={`badge ${s.urgent ? "bg-danger/15 text-danger" : "bg-elevated text-slate-300"}`}>
                {s.count}
              </span>
            </div>
            <p className="mt-4 text-lg font-bold text-white group-hover:text-accent">{s.title}</p>
            <p className="mt-1 text-sm text-muted">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AdminDisputes() {
  const { state, mutate } = useStore();
  const admin = useAdminGuard();
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  if (!admin) return <Denied />;

  const open = state.disputes.filter((d) => d.status === "OPEN");
  const resolved = state.disputes.filter((d) => d.status === "RESOLVED").slice(0, 10);

  function resolve(disputeId: string, action: "SETTLE" | "VOID", winnerId: string | null) {
    setError(null);
    const res = mutate((s) =>
      adminResolveDispute(s, disputeId, action, winnerId, resolutions[disputeId] ?? "")
    );
    if (!res.ok) setError(res.error);
  }

  return (
    <div>
      <BackLink to="/admin" label="Administration" />
      <PageHeader
        title="Arbitrage des litiges"
        subtitle="Matchs aux déclarations contradictoires : attribuez la victoire ou annulez avec remboursement."
      />
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      {open.length === 0 ? (
        <EmptyState
          title="Aucun litige en cours 🎉"
          subtitle="Tous les matchs se règlent à l'amiable pour le moment."
        />
      ) : (
        <div className="space-y-6">
          {open.map((d) => {
            const m = state.matches.find((x) => x.id === d.matchId)!;
            const game = state.games.find((g) => g.slug === m.gameSlug)!;
            const creator = state.users.find((u) => u.id === m.creatorId)!;
            const opponent = state.users.find((u) => u.id === m.opponentId)!;
            const openedBy = state.users.find((u) => u.id === d.openedById);
            return (
              <div key={d.id} className="card border-danger/40 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{game.icon}</span>
                    <div>
                      <Link to={`/wagers/${m.id}`} className="font-bold text-white hover:text-accent">
                        {m.title}
                      </Link>
                      <p className="text-sm text-muted">
                        {game.name} · mise {formatMoney(m.entryFeeCents)} · ouvert le{" "}
                        {formatDate(d.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="DISPUTED" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { player: creator, report: m.creatorReport },
                    { player: opponent, report: m.opponentReport },
                  ].map(({ player, report }) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-4 py-3"
                    >
                      <Avatar username={player.username} color={player.avatarColor} size={36} />
                      <div>
                        <p className="font-semibold text-white">{player.username}</p>
                        <p className="text-sm text-muted">
                          {report === "WIN"
                            ? "revendique la victoire"
                            : report === "LOSS"
                              ? "reconnaît la défaite"
                              : "n'a pas encore déclaré"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-slate-300">
                  <span className="font-semibold text-muted">Motif :</span> {d.reason} —
                  signalé par {openedBy?.username ?? "—"}
                </p>

                <div className="mt-5 space-y-3">
                  <div>
                    <label className="label">Motif de la décision</label>
                    <input
                      className="input"
                      placeholder="Ex. : preuve vidéo fournie par le créateur"
                      value={resolutions[d.id] ?? ""}
                      onChange={(e) =>
                        setResolutions({ ...resolutions, [d.id]: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-primary"
                      onClick={() => resolve(d.id, "SETTLE", creator.id)}
                    >
                      Victoire de {creator.username}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => resolve(d.id, "SETTLE", opponent.id)}
                    >
                      Victoire de {opponent.username}
                    </button>
                    <button className="btn-danger" onClick={() => resolve(d.id, "VOID", null)}>
                      Annuler et rembourser les deux joueurs
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 ? (
        <details className="card mt-10 p-6">
          <summary className="cursor-pointer font-bold text-white">
            Litiges résolus récents ({resolved.length})
          </summary>
          <ul className="mt-4 space-y-3">
            {resolved.map((d) => {
              const m = state.matches.find((x) => x.id === d.matchId);
              const c = state.users.find((u) => u.id === m?.creatorId);
              const o = state.users.find((u) => u.id === m?.opponentId);
              return (
                <li key={d.id} className="rounded-lg border border-edge bg-surface px-4 py-3 text-sm">
                  <p className="font-semibold text-white">
                    {c?.username ?? "—"} vs {o?.username ?? "—"} ·{" "}
                    {m ? formatMoney(m.entryFeeCents) : ""}
                  </p>
                  <p className="mt-1 text-muted">Résolution : {d.resolution || "—"}</p>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function AdminTournaments() {
  const { state, mutate } = useStore();
  const admin = useAdminGuard();
  const [error, setError] = useState<string | null>(null);
  if (!admin) return <Denied />;

  const registration = state.tournaments.filter((t) => t.status === "REGISTRATION");
  const live = state.tournaments.filter((t) => t.status === "LIVE");
  const completed = state.tournaments.filter((t) => t.status === "COMPLETED").slice(0, 5);

  const nameOf = (id: string | null) =>
    state.users.find((u) => u.id === id)?.username ?? "?";

  function run(fn: Parameters<typeof mutate>[0]) {
    setError(null);
    const res = mutate(fn);
    if (!res.ok) setError(res.error);
  }

  return (
    <div>
      <BackLink to="/admin" label="Administration" />
      <PageHeader
        title="Gestion des tournois"
        subtitle="Démarrez les tournois prêts et saisissez les vainqueurs des matchs en cours."
      />
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <h2 className="mb-4 text-lg font-bold text-white">
        Inscriptions ouvertes ({registration.length})
      </h2>
      {registration.length === 0 ? (
        <p className="mb-8 text-sm text-muted">Aucun tournoi en phase d'inscription.</p>
      ) : (
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          {registration.map((t) => {
            const game = state.games.find((g) => g.slug === t.gameSlug)!;
            return (
              <div key={t.id} className="card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{game.icon}</span>
                    <div>
                      <Link to={`/tournaments/${t.id}`} className="font-bold text-white hover:text-accent">
                        {t.name}
                      </Link>
                      <p className="text-sm text-muted">
                        {t.entries.length}/{t.maxPlayers} inscrits · cagnotte{" "}
                        {formatMoney(prizePool(t))}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-4">
                  <button
                    className="btn-primary"
                    disabled={t.entries.length < 2}
                    onClick={() => run((s) => startTournament(s, t.id))}
                  >
                    Démarrer le tournoi
                  </button>
                  {t.entries.length < 2 ? (
                    <p className="mt-2 text-xs text-muted">
                      Il faut au moins 2 inscrits pour démarrer.
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold text-white">En direct ({live.length})</h2>
      {live.length === 0 ? (
        <p className="mb-8 text-sm text-muted">Aucun tournoi en cours.</p>
      ) : (
        <div className="mb-10 space-y-6">
          {live.map((t) => {
            const game = state.games.find((g) => g.slug === t.gameSlug)!;
            return (
              <div key={t.id} className="card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{game.icon}</span>
                    <Link to={`/tournaments/${t.id}`} className="font-bold text-white hover:text-accent">
                      {t.name}
                    </Link>
                  </div>
                  <StatusBadge status="LIVE" />
                </div>
                {t.bracket ? (
                  <div className="mt-5 space-y-5">
                    {t.bracket.rounds.map((round, r) => {
                      const decidable = round
                        .map((m, i) => ({ m, i }))
                        .filter(({ m }) => m.p1 && m.p2 && !m.winner);
                      if (decidable.length === 0) return null;
                      return (
                        <div key={r}>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                            Round {r + 1} — matchs à trancher
                          </p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {decidable.map(({ m, i }) => (
                              <div key={i} className="rounded-lg border border-edge bg-surface p-4">
                                <p className="mb-3 text-sm font-semibold text-white">
                                  {nameOf(m.p1)} <span className="text-muted">vs</span>{" "}
                                  {nameOf(m.p2)}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[m.p1!, m.p2!].map((pid) => (
                                    <button
                                      key={pid}
                                      className="btn-secondary !py-1.5 text-xs"
                                      onClick={() =>
                                        run((s) => setBracketWinner(s, t.id, r, i, pid))
                                      }
                                    >
                                      Victoire de {nameOf(pid)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold text-white">Terminés récemment</h2>
      {completed.length === 0 ? (
        <EmptyState title="Aucun tournoi terminé pour l'instant" />
      ) : (
        <ul className="space-y-2">
          {completed.map((t) => {
            const game = state.games.find((g) => g.slug === t.gameSlug)!;
            const champ = t.entries.find((e) => e.placement === 1);
            return (
              <li key={t.id} className="card flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <Link to={`/tournaments/${t.id}`} className="font-semibold text-white hover:text-accent">
                  {game.icon} {t.name}
                </Link>
                <span className="text-sm text-muted">
                  Champion :{" "}
                  <span className="font-semibold text-gold">
                    🏆 {champ ? nameOf(champ.userId) : "—"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function AdminUsers() {
  const { state, mutate } = useStore();
  const admin = useAdminGuard();
  const [error, setError] = useState<string | null>(null);
  if (!admin) return <Denied />;

  function run(fn: Parameters<typeof mutate>[0]) {
    setError(null);
    const res = mutate(fn);
    if (!res.ok) setError(res.error);
  }

  return (
    <div>
      <BackLink to="/admin" label="Administration" />
      <PageHeader
        title="Gestion des joueurs"
        subtitle="Statut Elite, crédits bonus et vue d'ensemble des comptes."
      />
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-6 py-3">Joueur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3 text-right">Solde</th>
                <th className="px-4 py-3 text-right">V / D</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((u) => (
                <tr key={u.id} className="border-b border-edge/50 hover:bg-surface">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar username={u.username} color={u.avatarColor} size={32} />
                      <div>
                        <p className="font-semibold text-white">
                          {u.username}
                          {u.elite ? <span className="ml-1.5 text-xs text-gold">★ ELITE</span> : null}
                        </p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        u.role === "ADMIN" ? "bg-gold/15 text-gold" : "bg-elevated text-slate-300"
                      }`}
                    >
                      {u.role === "ADMIN" ? "Admin" : "Joueur"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-accent">
                    {formatMoney(u.balanceCents)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-300">
                    {u.wins} / {u.losses}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                        onClick={() =>
                          run((s) => {
                            const target = s.users.find((x) => x.id === u.id)!;
                            target.elite = !target.elite;
                          })
                        }
                      >
                        {u.elite ? "Retirer Elite" : "Passer Elite"}
                      </button>
                      <button
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                        onClick={() =>
                          run((s) => applyTx(s, u.id, "BONUS", 1000, "Crédit administrateur"))
                        }
                      >
                        Créditer 10 €
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
