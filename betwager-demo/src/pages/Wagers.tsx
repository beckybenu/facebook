import { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useStore } from "../store";
import {
  acceptMatch,
  cancelMatch,
  createMatch,
  reportResult,
  serviceFeeCents,
} from "../engine";
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

const PLATFORMS = ["PS5", "XBOX", "PC", "CROSS"];
const REGIONS = ["EU", "NA", "ASIA"];

export function WagersLobby() {
  const { state, me } = useStore();
  const [params] = useSearchParams();
  const gameFilter = params.get("game") ?? "";
  const platformFilter = params.get("platform") ?? "";

  const open = state.matches.filter(
    (m) =>
      m.status === "OPEN" &&
      (!gameFilter || m.gameSlug === gameFilter) &&
      (!platformFilter || m.platform === platformFilter)
  );
  const mine = me
    ? state.matches.filter(
        (m) =>
          (m.creatorId === me.id || m.opponentId === me.id) &&
          m.status !== "CANCELLED"
      )
    : [];

  const pill = (active: boolean) =>
    `badge border px-4 py-1.5 ${
      active
        ? "border-accent bg-accent-soft text-accent"
        : "border-edge bg-elevated text-slate-300 hover:border-accent/50"
    }`;

  const link = (game: string, platform: string) => {
    const q = new URLSearchParams();
    if (game) q.set("game", game);
    if (platform) q.set("platform", platform);
    const s = q.toString();
    return s ? `/wagers?${s}` : "/wagers";
  };

  return (
    <div>
      <PageHeader
        title="Matchs à mise"
        subtitle="Acceptez un défi ouvert ou créez le vôtre. La mise est bloquée jusqu'au résultat, le vainqueur encaisse."
        action={
          <Link to="/wagers/create" className="btn-primary">
            + Créer un match
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link to={link("", platformFilter)} className={pill(!gameFilter)}>
          Tous les jeux
        </Link>
        {state.games.map((g) => (
          <Link
            key={g.slug}
            to={link(g.slug, platformFilter)}
            className={pill(gameFilter === g.slug)}
          >
            {g.icon} {g.name}
          </Link>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        <Link to={link(gameFilter, "")} className={pill(!platformFilter)}>
          Toutes plateformes
        </Link>
        {PLATFORMS.map((p) => (
          <Link
            key={p}
            to={link(gameFilter, p)}
            className={pill(platformFilter === p)}
          >
            {p === "CROSS" ? "Cross-plateforme" : p}
          </Link>
        ))}
      </div>

      {me && mine.length > 0 ? (
        <>
          <h2 className="mb-4 text-lg font-bold text-white">Mes matchs</h2>
          <div className="mb-10 grid gap-3 md:grid-cols-2">
            {mine.slice(0, 10).map((m) => {
              const game = state.games.find((g) => g.slug === m.gameSlug)!;
              return (
                <Link
                  key={m.id}
                  to={`/wagers/${m.id}`}
                  className="card flex items-center justify-between gap-3 p-4 transition-colors hover:border-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{game.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{m.title}</p>
                      <p className="text-xs text-muted">
                        {formatMoney(m.entryFeeCents)} · {formatDate(m.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </Link>
              );
            })}
          </div>
        </>
      ) : null}

      <h2 className="mb-4 text-lg font-bold text-white">
        Défis ouverts ({open.length})
      </h2>
      {open.length === 0 ? (
        <EmptyState
          title="Aucun match ouvert pour ces filtres"
          subtitle="Créez le vôtre : les adversaires ne manquent pas."
          action={
            <Link to="/wagers/create" className="btn-primary">
              Créer un match
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {open.map((m) => {
            const game = state.games.find((g) => g.slug === m.gameSlug)!;
            const creator = state.users.find((u) => u.id === m.creatorId)!;
            const gain = m.entryFeeCents * 2 - serviceFeeCents(m.entryFeeCents * 2, false);
            return (
              <Link
                key={m.id}
                to={`/wagers/${m.id}`}
                className="card group p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{game.icon}</span>
                    <span className="text-sm text-muted">{game.name}</span>
                  </div>
                  <PlatformBadge platform={m.platform} />
                </div>
                <p className="mt-3 font-bold text-white group-hover:text-accent">
                  {m.title}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Avatar username={creator.username} color={creator.avatarColor} size={28} />
                  <div>
                    <p className="text-sm font-medium text-white">{creator.username}</p>
                    <p className="text-xs text-muted">
                      {creator.wins} V / {creator.losses} D
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-edge pt-3">
                  <div>
                    <p className="text-xs text-muted">Mise</p>
                    <p className="font-bold text-accent">{formatMoney(m.entryFeeCents)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Gain potentiel</p>
                    <p className="font-bold text-gold">{formatMoney(gain)}</p>
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

export function WagerCreate() {
  const { state, me, mutate } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [gameSlug, setGameSlug] = useState(params.get("game") ?? state.games[0].slug);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("CROSS");
  const [region, setRegion] = useState("EU");
  const [teamSize, setTeamSize] = useState(1);
  const [rules, setRules] = useState("");
  const [stake, setStake] = useState("10");
  const [error, setError] = useState<string | null>(null);

  const stakeCents = Math.round(Number(stake.replace(",", ".")) * 100) || 0;
  const gain = useMemo(
    () => stakeCents * 2 - serviceFeeCents(stakeCents * 2, me?.elite ?? false),
    [stakeCents, me]
  );

  if (!me)
    return (
      <EmptyState
        title="Connectez-vous pour créer un match"
        action={<Link to="/login" className="btn-primary">Connexion</Link>}
      />
    );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let createdId = "";
    const res = mutate((s) => {
      const m = createMatch(s, {
        creatorId: me!.id,
        gameSlug,
        title,
        rules,
        platform,
        region,
        teamSize,
        entryFeeCents: stakeCents,
      });
      createdId = m.id;
    });
    if (!res.ok) setError(res.error);
    else navigate(`/wagers/${createdId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to="/wagers" label="Tous les matchs" />
      <PageHeader
        title="Créer un match"
        subtitle="Définissez vos règles et votre mise — elle sera débitée immédiatement et remboursée si personne n'accepte."
      />
      <form onSubmit={submit} className="card space-y-5 p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Jeu</label>
            <select className="input" value={gameSlug} onChange={(e) => setGameSlug(e.target.value)}>
              {state.games.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.icon} {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Plateforme</label>
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p === "CROSS" ? "Cross-plateforme" : p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Titre du match</label>
          <input
            className="input"
            placeholder="Ex. : Recherche & Destruction BO5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">Région</label>
            <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Format</label>
            <select
              className="input"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}v{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Mise (€)</label>
            <input
              type="number"
              min={1}
              max={500}
              step="0.5"
              className="input"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="label">Règles du match</label>
          <textarea
            className="input min-h-24"
            placeholder="Mode de jeu, nombre de manches, restrictions…"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent-soft p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-300">Votre mise (débitée maintenant)</span>
            <span className="font-bold text-white">{formatMoney(stakeCents)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-slate-300">
              Gain net en cas de victoire ({me.elite ? "5" : "10"} % de frais)
            </span>
            <span className="font-bold text-accent">{formatMoney(gain)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Solde disponible : {formatMoney(me.balanceCents)}
          </p>
        </div>

        <button type="submit" className="btn-primary w-full">
          Publier le défi
        </button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </div>
  );
}

export function WagerDetail() {
  const { id } = useParams();
  const { state, me, mutate } = useStore();
  const [error, setError] = useState<string | null>(null);

  const m = state.matches.find((x) => x.id === id);
  if (!m)
    return (
      <EmptyState
        title="Match introuvable"
        action={<Link to="/wagers" className="btn-secondary">Tous les matchs</Link>}
      />
    );

  const game = state.games.find((g) => g.slug === m.gameSlug)!;
  const creator = state.users.find((u) => u.id === m.creatorId)!;
  const opponent = state.users.find((u) => u.id === m.opponentId) ?? null;
  const winner = state.users.find((u) => u.id === m.winnerId) ?? null;
  const dispute = state.disputes.find((d) => d.matchId === m.id) ?? null;

  const isCreator = me?.id === m.creatorId;
  const isOpponent = me?.id === m.opponentId;
  const isParticipant = isCreator || isOpponent;
  const myReport = isCreator ? m.creatorReport : isOpponent ? m.opponentReport : null;

  const gross = m.entryFeeCents * 2;
  const fee = serviceFeeCents(gross, winner?.elite ?? me?.elite ?? false);

  function run(fn: (s: Parameters<Parameters<typeof mutate>[0]>[0]) => void) {
    setError(null);
    const res = mutate(fn);
    if (!res.ok) setError(res.error);
  }

  const playerBox = (user: typeof creator | null, label: string) => (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-edge bg-surface p-6 text-center">
      {user ? (
        <>
          <div className="relative">
            <Avatar username={user.username} color={user.avatarColor} size={64} />
            {winner?.id === user.id ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</span>
            ) : null}
          </div>
          <Link
            to={`/players/${user.username}`}
            className="font-bold text-white hover:text-accent"
          >
            {user.username}
          </Link>
          <p className="text-xs text-muted">
            {user.wins} V / {user.losses} D
            {user.elite ? <span className="ml-1 text-gold">★</span> : null}
          </p>
        </>
      ) : (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-edge text-2xl text-muted">
            ?
          </span>
          <p className="font-semibold text-muted">{label}</p>
        </>
      )}
    </div>
  );

  return (
    <div>
      <BackLink to="/wagers" label="Tous les matchs" />
      <div className="card p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link to={`/games/${game.slug}`} className="text-2xl">{game.icon}</Link>
          <StatusBadge status={m.status} />
          <PlatformBadge platform={m.platform} />
          <span className="badge border border-edge bg-elevated text-slate-300">
            {m.region}
          </span>
          <span className="badge border border-edge bg-elevated text-slate-300">
            {m.teamSize}v{m.teamSize}
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-black text-white">{m.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {game.name} · créé le {formatDate(m.createdAt)}
        </p>

        <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          {playerBox(creator, "")}
          <span className="self-center text-2xl font-black text-muted">VS</span>
          {playerBox(opponent, "En attente d'un adversaire")}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-bold text-white">💰 Enjeux</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Mise par joueur</span>
              <span className="font-semibold text-white">{formatMoney(m.entryFeeCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cagnotte totale</span>
              <span className="font-semibold text-white">{formatMoney(gross)}</span>
            </div>
            <div className="flex justify-between border-t border-edge pt-2">
              <span className="text-muted">Gain net du vainqueur (après frais)</span>
              <span className="font-bold text-accent">{formatMoney(gross - fee)}</span>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-white">📋 Règles du match</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
            {m.rules || "Aucune règle particulière — format standard."}
          </p>
        </div>
      </div>

      {/* Zone d'actions */}
      <div className="card mt-6 p-6">
        {!me ? (
          <div className="text-center">
            <p className="text-muted">Connectez-vous pour accepter ce défi.</p>
            <Link to="/login" className="btn-primary mt-4">Connexion</Link>
          </div>
        ) : m.status === "OPEN" && !isCreator ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-slate-300">
              Acceptez ce défi : votre mise de{" "}
              <span className="font-bold text-white">{formatMoney(m.entryFeeCents)}</span>{" "}
              sera bloquée jusqu'au résultat.
            </p>
            <button
              className="btn-primary !px-8 !py-3"
              onClick={() => run((s) => acceptMatch(s, m.id, me.id))}
            >
              Accepter le défi ({formatMoney(m.entryFeeCents)})
            </button>
          </div>
        ) : m.status === "OPEN" && isCreator ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-muted">
              Votre défi attend un adversaire. Vous pouvez l'annuler et
              récupérer votre mise.
            </p>
            <button
              className="btn-danger"
              onClick={() => run((s) => cancelMatch(s, m.id, me.id))}
            >
              Annuler et récupérer ma mise
            </button>
          </div>
        ) : ["ACCEPTED", "REPORTED"].includes(m.status) && isParticipant && !myReport ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-slate-300">
              Match joué ? Déclarez votre résultat. Les deux déclarations
              doivent concorder pour le paiement automatique.
            </p>
            <div className="flex gap-3">
              <button
                className="btn-primary !px-8"
                onClick={() => run((s) => reportResult(s, m.id, me.id, "WIN"))}
              >
                🏆 J'ai gagné
              </button>
              <button
                className="btn-secondary !px-8"
                onClick={() => run((s) => reportResult(s, m.id, me.id, "LOSS"))}
              >
                J'ai perdu
              </button>
            </div>
          </div>
        ) : m.status === "REPORTED" && isParticipant && myReport ? (
          <p className="text-center text-muted">
            ⏳ Votre résultat est enregistré — en attente de la déclaration
            adverse.
          </p>
        ) : m.status === "DISPUTED" ? (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-5 text-center">
            <p className="font-bold text-danger">⚖️ Litige en cours</p>
            <p className="mt-2 text-sm text-slate-300">
              {dispute?.reason ?? "Déclarations contradictoires."} Un arbitre
              Betwager va trancher — les fonds restent bloqués.
            </p>
          </div>
        ) : m.status === "COMPLETED" && winner ? (
          <div className="rounded-lg border border-accent/40 bg-accent-soft p-5 text-center">
            <p className="font-bold text-accent">
              🏆 Victoire de {winner.username}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {formatMoney(gross - serviceFeeCents(gross, winner.elite))} crédités
              sur son portefeuille
              {m.completedAt ? ` le ${formatDate(m.completedAt)}` : ""}.
            </p>
          </div>
        ) : m.status === "CANCELLED" ? (
          <p className="text-center text-muted">
            Ce match a été annulé — les mises ont été remboursées.
          </p>
        ) : (
          <p className="text-center text-muted">Match en cours.</p>
        )}
        {error ? <p className="mt-3 text-center text-sm text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
