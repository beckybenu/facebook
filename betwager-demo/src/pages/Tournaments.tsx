import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../store";
import {
  prizePool,
  registerTournament,
  unregisterTournament,
} from "../engine";
import type { Bracket, BracketMatch, Tournament } from "../types";
import {
  Avatar,
  BackLink,
  EmptyState,
  PageHeader,
  PlatformBadge,
  StatCard,
  StatusBadge,
  formatDate,
  formatMoney,
} from "../ui";

const FILTERS = [
  { key: "", label: "Tous" },
  { key: "REGISTRATION", label: "Inscriptions ouvertes" },
  { key: "LIVE", label: "En direct" },
  { key: "COMPLETED", label: "Terminés" },
];

export function TournamentsList() {
  const { state } = useStore();
  const [params] = useSearchParams();
  const status = params.get("status") ?? "";
  const list = state.tournaments.filter((t) =>
    status ? t.status === status : t.status !== "CANCELLED"
  );

  return (
    <div>
      <PageHeader
        title="Tournois"
        subtitle="Inscrivez-vous, grimpez dans l'arbre et remportez la cagnotte. Élimination directe, prix versés automatiquement."
      />
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            to={f.key ? `/tournaments?status=${f.key}` : "/tournaments"}
            className={`badge border px-4 py-1.5 ${
              status === f.key
                ? "border-accent bg-accent-soft text-accent"
                : "border-edge bg-elevated text-slate-300 hover:border-accent/50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Aucun tournoi pour ce filtre"
          subtitle="Revenez bientôt : de nouveaux tournois sont organisés chaque semaine."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {list.map((t) => {
            const game = state.games.find((g) => g.slug === t.gameSlug)!;
            const pool = prizePool(t);
            const fillPct = Math.min(100, Math.round((t.entries.length / t.maxPlayers) * 100));
            return (
              <Link
                key={t.id}
                to={`/tournaments/${t.id}`}
                className="card group p-6 transition-colors hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{game.icon}</span>
                    <div>
                      <p className="font-bold text-white group-hover:text-accent">{t.name}</p>
                      <p className="text-sm text-muted">{game.name}</p>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <PlatformBadge platform={t.platform} />
                  {t.entryFeeCents === 0 ? (
                    <span className="badge bg-accent-soft text-accent">GRATUIT</span>
                  ) : (
                    <span className="badge border border-edge bg-elevated text-slate-300">
                      Entrée {formatMoney(t.entryFeeCents)}
                    </span>
                  )}
                  <span className="badge border border-edge bg-elevated text-slate-300">
                    {formatDate(t.startsAt)}
                  </span>
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <p className="mb-1.5 text-xs text-muted">
                      {t.entries.length}/{t.maxPlayers} inscrits
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-muted">Cagnotte</p>
                    <p className="text-xl font-bold text-gold">{formatMoney(pool)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function roundTitle(matchCount: number, roundIndex: number): string {
  switch (matchCount) {
    case 1: return "Finale";
    case 2: return "Demi-finales";
    case 4: return "Quarts de finale";
    case 8: return "Huitièmes de finale";
    default: return `Round ${roundIndex + 1}`;
  }
}

export function BracketView({
  bracket,
  players,
}: {
  bracket: Bracket;
  players: Record<string, { username: string; avatarColor: string }>;
}) {
  const row = (userId: string | null, m: BracketMatch) => {
    if (!userId)
      return (
        <div className="flex items-center gap-2 rounded-md px-2.5 py-2 opacity-60">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-edge text-[10px] text-muted">
            ?
          </span>
          <span className="text-xs italic text-muted">
            {m.winner ? "Bye" : "À déterminer"}
          </span>
        </div>
      );
    const p = players[userId];
    const isWinner = m.winner === userId;
    const eliminated = m.winner !== null && !isWinner;
    return (
      <div
        className={`flex items-center gap-2 rounded-md px-2.5 py-2 ${
          isWinner ? "bg-accent-soft" : eliminated ? "opacity-50" : ""
        }`}
      >
        <Avatar username={p?.username ?? "?"} color={p?.avatarColor} size={24} />
        <span
          className={`truncate text-sm ${
            isWinner ? "font-bold text-accent" : "font-medium text-white"
          }`}
        >
          {p?.username ?? "Joueur inconnu"}
        </span>
        {isWinner ? <span className="ml-auto text-xs text-accent">✓</span> : null}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-8">
        {bracket.rounds.map((round, r) => (
          <div key={r} className="flex flex-col">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
              {roundTitle(round.length, r)}
            </p>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {round.map((m, i) => (
                <div key={i} className="w-56 shrink-0 rounded-lg border border-edge bg-surface p-1.5">
                  {row(m.p1, m)}
                  <div className="mx-2 my-0.5 border-t border-edge/60" />
                  {row(m.p2, m)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TournamentDetail() {
  const { id } = useParams();
  const { state, me, mutate } = useStore();
  const [error, setError] = useState<string | null>(null);

  const t: Tournament | undefined = state.tournaments.find((x) => x.id === id);
  if (!t)
    return (
      <EmptyState
        title="Tournoi introuvable"
        action={<Link to="/tournaments" className="btn-secondary">Tous les tournois</Link>}
      />
    );

  const game = state.games.find((g) => g.slug === t.gameSlug)!;
  const pool = prizePool(t);
  const splitPrizes = t.entries.length >= 4;
  const firstPrize = splitPrizes ? Math.round(pool * 0.7) : pool;
  const secondPrize = pool - firstPrize;
  const isRegistered = me ? t.entries.some((e) => e.userId === me.id) : false;
  const isFull = t.entries.length >= t.maxPlayers;

  const players: Record<string, { username: string; avatarColor: string }> = {};
  for (const e of t.entries) {
    const u = state.users.find((x) => x.id === e.userId);
    if (u) players[u.id] = { username: u.username, avatarColor: u.avatarColor };
  }

  function run(fn: Parameters<typeof mutate>[0]) {
    setError(null);
    const res = mutate(fn);
    if (!res.ok) setError(res.error);
  }

  return (
    <div>
      <BackLink to="/tournaments" label="Tous les tournois" />
      <div className="card bg-hero-grid p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-4xl">{game.icon}</span>
              <StatusBadge status={t.status} />
              <PlatformBadge platform={t.platform} />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t.name}
            </h1>
            <p className="mt-2 text-muted">
              <Link to={`/games/${game.slug}`} className="text-accent hover:underline">
                {game.name}
              </Link>{" "}
              · Format {t.teamSize}v{t.teamSize} · Début le {formatDate(t.startsAt)}
            </p>
            {t.description ? (
              <p className="mt-4 max-w-2xl text-slate-300">{t.description}</p>
            ) : null}
          </div>
          {t.status === "REGISTRATION" ? (
            <div className="flex flex-col gap-2">
              {!me ? (
                <Link to="/login" className="btn-primary !px-6 !py-3">
                  Connectez-vous pour participer
                </Link>
              ) : isRegistered ? (
                <button
                  className="btn-danger !px-6 !py-3"
                  onClick={() => run((s) => unregisterTournament(s, t.id, me.id))}
                >
                  Se désinscrire
                </button>
              ) : (
                <button
                  className="btn-primary !px-6 !py-3"
                  disabled={isFull}
                  onClick={() => run((s) => registerTournament(s, t.id, me.id))}
                >
                  {isFull
                    ? "Tournoi complet"
                    : t.entryFeeCents > 0
                      ? `S'inscrire (${formatMoney(t.entryFeeCents)})`
                      : "S'inscrire gratuitement"}
                </button>
              )}
              {error ? <p className="text-sm text-danger">{error}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cagnotte totale" value={formatMoney(pool)} accent />
        <StatCard
          label="Frais d'entrée"
          value={t.entryFeeCents === 0 ? "Gratuit" : formatMoney(t.entryFeeCents)}
        />
        <StatCard label="Inscrits" value={`${t.entries.length}/${t.maxPlayers}`} />
        <StatCard label="Début" value={formatDate(t.startsAt)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white">Répartition des prix</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
              <span className="font-semibold text-white">🥇 1re place</span>
              <span className="font-bold text-gold">{formatMoney(firstPrize)}</span>
            </div>
            {splitPrizes ? (
              <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                <span className="font-semibold text-white">🥈 2e place</span>
                <span className="font-bold text-slate-300">{formatMoney(secondPrize)}</span>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Moins de 4 joueurs : le vainqueur remporte toute la cagnotte.
              </p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted">
            La cagnotte évolue avec les inscriptions. Les prix sont versés
            automatiquement après la finale.
          </p>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white">
            Participants ({t.entries.length})
          </h2>
          {t.entries.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Aucun inscrit pour l'instant — soyez le premier !
            </p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {t.entries.map((e) => {
                const u = state.users.find((x) => x.id === e.userId);
                if (!u) return null;
                return (
                  <li key={e.userId}>
                    <Link
                      to={`/players/${u.username}`}
                      className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-3 py-2.5 transition-colors hover:border-accent/50"
                    >
                      <Avatar username={u.username} color={u.avatarColor} size={32} />
                      <span className="font-medium text-white">{u.username}</span>
                      {e.placement === 1 ? (
                        <span className="ml-auto">🥇</span>
                      ) : e.placement === 2 ? (
                        <span className="ml-auto">🥈</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {t.bracket && t.status !== "REGISTRATION" ? (
        <div className="card mt-8 p-6">
          <h2 className="mb-6 text-lg font-bold text-white">Arbre du tournoi</h2>
          <BracketView bracket={t.bracket} players={players} />
        </div>
      ) : null}
    </div>
  );
}
