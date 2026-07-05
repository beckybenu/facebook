import { Link, useParams } from "react-router-dom";
import { useStore } from "../store";
import {
  Avatar,
  BackLink,
  EmptyState,
  PageHeader,
  PlatformBadge,
  StatusBadge,
  formatDate,
  formatMoney,
} from "../ui";

export function GamesList() {
  const { state } = useStore();
  return (
    <div>
      <PageHeader
        title="Jeux"
        subtitle="Choisissez votre jeu et lancez un défi — ou acceptez celui d'un adversaire."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {state.games.map((g) => {
          const open = state.matches.filter(
            (m) => m.gameSlug === g.slug && m.status === "OPEN"
          ).length;
          const tournaments = state.tournaments.filter(
            (t) => t.gameSlug === g.slug && ["REGISTRATION", "LIVE"].includes(t.status)
          ).length;
          return (
            <Link
              key={g.slug}
              to={`/games/${g.slug}`}
              className="card group overflow-hidden transition-colors hover:border-accent/50"
              style={{ borderTopColor: g.color, borderTopWidth: 3 }}
            >
              <div className="p-6">
                <span className="text-4xl">{g.icon}</span>
                <p className="mt-3 text-lg font-bold text-white group-hover:text-accent">
                  {g.name}
                </p>
                <p className="text-sm text-muted">{g.category}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {g.platforms.map((p) => (
                    <PlatformBadge key={p} platform={p} />
                  ))}
                </div>
                <div className="mt-4 flex gap-2 text-xs">
                  <span className="badge bg-accent-soft text-accent">
                    {open} match{open > 1 ? "s" : ""} ouvert{open > 1 ? "s" : ""}
                  </span>
                  <span className="badge bg-violet-soft text-violet">
                    {tournaments} tournoi{tournaments > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function GameDetail() {
  const { slug } = useParams();
  const { state } = useStore();
  const game = state.games.find((g) => g.slug === slug);
  if (!game)
    return <EmptyState title="Jeu introuvable" action={<Link to="/games" className="btn-secondary">Tous les jeux</Link>} />;

  const openMatches = state.matches.filter(
    (m) => m.gameSlug === game.slug && m.status === "OPEN"
  );
  const tournaments = state.tournaments.filter(
    (t) => t.gameSlug === game.slug && ["REGISTRATION", "LIVE"].includes(t.status)
  );

  return (
    <div>
      <BackLink to="/games" label="Tous les jeux" />
      <div
        className="card p-8"
        style={{ borderLeftColor: game.color, borderLeftWidth: 4 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{game.icon}</span>
            <div>
              <h1 className="text-3xl font-black text-white">{game.name}</h1>
              <p className="text-muted">{game.category}</p>
            </div>
          </div>
          <Link to={`/wagers/create?game=${game.slug}`} className="btn-primary">
            Créer un match
          </Link>
        </div>
        <p className="mt-5 max-w-2xl text-slate-300">{game.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {game.platforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
      </div>

      <h2 className="mb-4 mt-10 text-xl font-bold text-white">
        Matchs ouverts ({openMatches.length})
      </h2>
      {openMatches.length === 0 ? (
        <EmptyState
          title="Aucun match ouvert sur ce jeu"
          subtitle="Soyez le premier à lancer un défi !"
          action={
            <Link to={`/wagers/create?game=${game.slug}`} className="btn-primary">
              Créer un match
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {openMatches.map((m) => {
            const creator = state.users.find((u) => u.id === m.creatorId)!;
            return (
              <Link
                key={m.id}
                to={`/wagers/${m.id}`}
                className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar username={creator.username} color={creator.avatarColor} size={36} />
                  <div>
                    <p className="font-semibold text-white group-hover:text-accent">
                      {m.title}
                    </p>
                    <p className="text-xs text-muted">
                      {creator.username} · {formatDate(m.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">{formatMoney(m.entryFeeCents)}</p>
                  <PlatformBadge platform={m.platform} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {tournaments.length > 0 ? (
        <>
          <h2 className="mb-4 mt-10 text-xl font-bold text-white">
            Tournois à venir
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                to={`/tournaments/${t.id}`}
                className="card group flex items-center justify-between gap-4 p-5 transition-colors hover:border-accent/50"
              >
                <div>
                  <p className="font-semibold text-white group-hover:text-accent">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(t.startsAt)} · {t.entries.length}/{t.maxPlayers} inscrits
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
