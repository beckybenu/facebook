import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../store";
import {
  Avatar,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  formatDate,
  formatMoney,
} from "../ui";

export function MyProfile() {
  const { me, mutate } = useStore();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(() => ({
    bio: me?.bio ?? "",
    country: me?.country ?? "FR",
    avatarColor: me?.avatarColor ?? "#00E67F",
    gamertagPsn: me?.gamertagPsn ?? "",
    gamertagXbox: me?.gamertagXbox ?? "",
    gamertagActivision: me?.gamertagActivision ?? "",
    gamertagEpic: me?.gamertagEpic ?? "",
  }));

  if (!me)
    return (
      <EmptyState
        title="Connectez-vous pour voir votre profil"
        action={<Link to="/login" className="btn-primary">Connexion</Link>}
      />
    );

  const total = me.wins + me.losses;
  const ratio = total === 0 ? "—" : `${Math.round((me.wins / total) * 100)} %`;

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const res = mutate((s) => {
      const u = s.users.find((x) => x.id === me!.id)!;
      Object.assign(u, form);
    });
    if (res.ok) setSaved(true);
  }

  const field = (key: keyof typeof form, label: string, placeholder = "") => (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div>
      <div className="card flex flex-wrap items-center gap-5 p-8">
        <Avatar username={me.username} color={me.avatarColor} size={72} />
        <div>
          <h1 className="text-2xl font-black text-white">
            {me.username}
            {me.elite ? (
              <span className="ml-2 align-middle text-sm text-gold">★ ELITE</span>
            ) : null}
          </h1>
          <p className="text-sm text-muted">
            Membre depuis {formatDate(me.createdAt)} ·{" "}
            <Link to={`/players/${me.username}`} className="text-accent hover:underline">
              Voir mon profil public
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Victoires" value={String(me.wins)} accent />
        <StatCard label="Défaites" value={String(me.losses)} />
        <StatCard label="Ratio" value={ratio} />
        <StatCard label="XP" value={String(me.xp)} />
        <StatCard label="Solde" value={formatMoney(me.balanceCents)} accent />
      </div>

      <form onSubmit={save} className="card mt-8 space-y-5 p-7">
        <h2 className="text-lg font-bold text-white">Modifier mon profil</h2>
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input min-h-20"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("country", "Pays", "FR")}
          <div>
            <label className="label">Couleur d'avatar</label>
            <input
              type="color"
              className="input h-11 cursor-pointer p-1"
              value={form.avatarColor}
              onChange={(e) => setForm({ ...form, avatarColor: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("gamertagPsn", "Gamertag PSN")}
          {field("gamertagXbox", "Gamertag Xbox")}
          {field("gamertagActivision", "ID Activision")}
          {field("gamertagEpic", "Pseudo Epic Games")}
        </div>
        <button type="submit" className="btn-primary">Enregistrer</button>
        {saved ? <p className="text-sm text-accent">Profil mis à jour ✓</p> : null}
      </form>
    </div>
  );
}

export function PublicProfile() {
  const { username } = useParams();
  const { state } = useStore();
  const user = state.users.find(
    (u) => u.username.toLowerCase() === (username ?? "").toLowerCase()
  );
  if (!user)
    return (
      <EmptyState
        title="Joueur introuvable"
        action={<Link to="/leaderboard" className="btn-secondary">Voir le classement</Link>}
      />
    );

  const total = user.wins + user.losses;
  const ratio = total === 0 ? "—" : `${Math.round((user.wins / total) * 100)} %`;
  const matches = state.matches
    .filter(
      (m) =>
        m.status === "COMPLETED" &&
        (m.creatorId === user.id || m.opponentId === user.id)
    )
    .slice(0, 10);

  const gamertags = [
    { label: "PSN", value: user.gamertagPsn },
    { label: "Xbox", value: user.gamertagXbox },
    { label: "Activision", value: user.gamertagActivision },
    { label: "Epic", value: user.gamertagEpic },
  ].filter((g) => g.value);

  return (
    <div>
      <div className="card flex flex-wrap items-center gap-5 p-8">
        <Avatar username={user.username} color={user.avatarColor} size={72} />
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">
            {user.username}
            {user.elite ? (
              <span className="ml-2 align-middle text-sm text-gold">★ ELITE</span>
            ) : null}
          </h1>
          <p className="text-sm text-muted">
            {user.country} · membre depuis {formatDate(user.createdAt)}
          </p>
          {user.bio ? <p className="mt-2 max-w-xl text-sm text-slate-300">{user.bio}</p> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Victoires" value={String(user.wins)} accent />
        <StatCard label="Défaites" value={String(user.losses)} />
        <StatCard label="Ratio" value={ratio} />
        <StatCard label="XP" value={String(user.xp)} />
      </div>

      {gamertags.length > 0 ? (
        <div className="card mt-6 p-6">
          <h2 className="font-bold text-white">Gamertags</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {gamertags.map((g) => (
              <span key={g.label} className="badge border border-edge bg-elevated text-slate-300">
                {g.label} : <span className="text-accent">{g.value}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="mb-4 mt-10 text-xl font-bold text-white">Derniers matchs</h2>
      {matches.length === 0 ? (
        <EmptyState title="Aucun match terminé pour l'instant" />
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const game = state.games.find((g) => g.slug === m.gameSlug)!;
            const oppId = m.creatorId === user.id ? m.opponentId : m.creatorId;
            const opp = state.users.find((u) => u.id === oppId);
            const won = m.winnerId === user.id;
            return (
              <Link
                key={m.id}
                to={`/wagers/${m.id}`}
                className="card flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:border-accent/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{game.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{m.title}</p>
                    <p className="text-xs text-muted">
                      contre {opp?.username ?? "—"} ·{" "}
                      {m.completedAt ? formatDate(m.completedAt) : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{formatMoney(m.entryFeeCents)}</span>
                  <span className={`badge ${won ? "bg-accent-soft text-accent" : "bg-danger/15 text-danger"}`}>
                    {won ? "Victoire" : "Défaite"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
