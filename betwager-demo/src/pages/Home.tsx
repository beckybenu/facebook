import { Link } from "react-router-dom";
import { useStore } from "../store";
import { Avatar, PlatformBadge, formatMoney } from "../ui";

export default function Home() {
  const { state, me } = useStore();
  const totalPayouts = state.transactions
    .filter((t) => t.type === "WAGER_PAYOUT" || t.type === "TOURNAMENT_PRIZE")
    .reduce((sum, t) => sum + t.amountCents, 0);
  const openMatches = state.matches.filter((m) => m.status === "OPEN");

  const stats = [
    { label: "Joueurs inscrits", value: String(state.users.length) },
    { label: "Matchs joués", value: String(state.matches.length) },
    { label: "Gains distribués", value: formatMoney(totalPayouts), accent: true },
    { label: "Tournois organisés", value: String(state.tournaments.length) },
  ];

  const steps = [
    {
      n: "1",
      title: "Déposez",
      body: "Créez votre compte et alimentez votre portemonnaie en quelques secondes. Vos fonds sont disponibles immédiatement.",
    },
    {
      n: "2",
      title: "Défiez",
      body: "Créez un match à mise sur votre jeu ou acceptez le défi d'un autre joueur. Mise de 1 € à 500 €, sur PS5, Xbox ou PC.",
    },
    {
      n: "3",
      title: "Encaissez",
      body: "Gagnez le match, déclarez le résultat, et le gain est crédité instantanément sur votre solde. Retirez quand vous voulez.",
    },
  ];

  const features = [
    {
      icon: "⚡",
      title: "Paiements instantanés",
      body: "Les gains sont crédités automatiquement dès la validation du résultat. Aucune attente, aucun intermédiaire.",
    },
    {
      icon: "🛡️",
      title: "Arbitrage anti-triche",
      body: "Chaque litige est examiné par notre équipe d'arbitres. Preuves, captures et historiques : les tricheurs sont bannis.",
    },
    {
      icon: "🏆",
      title: "Tournois quotidiens",
      body: "Des tournois cash à élimination directe tous les jours, avec cagnottes bonus ajoutées par la maison.",
    },
    {
      icon: "👑",
      title: "Programme Elite",
      body: "Les membres Elite ne paient que 5 % de frais de service au lieu de 10 %. Votre skill vaut plus.",
    },
  ];

  return (
    <div className="-mt-10">
      {/* Hero */}
      <section className="bg-hero-grid -mx-4 px-4 py-20 text-center sm:-mx-6 sm:px-6 sm:py-28">
        <span className="badge mx-auto border border-accent/40 bg-accent-soft text-accent">
          🎮 Plateforme e-sport n°1 des matchs à mise
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
          Votre skill. Vos règles.{" "}
          <span className="text-accent">Vos gains.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Affrontez des joueurs du monde entier en matchs à mise sur vos jeux
          préférés. Vous gagnez la partie, vous encaissez — c'est aussi simple
          que ça.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {me ? (
            <>
              <Link to="/wagers/create" className="btn-primary !px-7 !py-3">
                Créer un match
              </Link>
              <Link to="/wagers" className="btn-secondary !px-7 !py-3">
                Voir les matchs
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-primary !px-7 !py-3">
                S'inscrire gratuitement
              </Link>
              <Link to="/wagers" className="btn-secondary !px-7 !py-3">
                Voir les matchs
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card px-6 py-5 text-center">
            <p className={`text-3xl font-black ${s.accent ? "text-accent" : "text-white"}`}>
              {s.value}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* Jeux */}
      <section className="mt-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Choisissez votre terrain
            </h2>
            <p className="mt-2 text-muted">
              Les jeux compétitifs les plus joués, sur toutes les plateformes.
            </p>
          </div>
          <Link to="/games" className="text-sm font-semibold text-accent hover:underline">
            Tous les jeux →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {state.games.map((g) => {
            const count = openMatches.filter((m) => m.gameSlug === g.slug).length;
            return (
              <Link
                key={g.slug}
                to={`/games/${g.slug}`}
                className="card group p-6 transition-colors hover:border-accent/50"
              >
                <span className="text-3xl">{g.icon}</span>
                <p className="mt-3 font-bold text-white group-hover:text-accent">
                  {g.name}
                </p>
                <p className="text-xs text-muted">{g.category}</p>
                <span className="badge mt-3 bg-accent-soft text-accent">
                  {count} match{count > 1 ? "s" : ""} ouvert{count > 1 ? "s" : ""}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mt-20 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Comment ça marche
        </h2>
        <p className="mt-2 text-muted">Trois étapes entre vous et vos premiers gains.</p>
        <div className="mt-8 grid gap-4 text-left md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card relative p-6 pt-8">
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-accent font-black text-[#04150C] shadow-glow">
                {s.n}
              </span>
              <p className="font-bold text-white">{s.title}</p>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <Link to="/how-it-works" className="btn-secondary mt-8">
          Le guide complet
        </Link>
      </section>

      {/* Fonctionnalités */}
      <section className="mt-20 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Conçu pour les compétiteurs
        </h2>
        <p className="mt-2 text-muted">
          Tout ce qu'il faut pour jouer sérieusement, en toute confiance.
        </p>
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <span className="text-2xl">{f.icon}</span>
              <p className="mt-3 font-bold text-white">{f.title}</p>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Derniers matchs */}
      <section className="mt-20">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Matchs ouverts en ce moment
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {openMatches.slice(0, 4).map((m) => {
            const game = state.games.find((g) => g.slug === m.gameSlug)!;
            const creator = state.users.find((u) => u.id === m.creatorId)!;
            return (
              <Link
                key={m.id}
                to={`/wagers/${m.id}`}
                className="card group p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{game.icon}</span>
                  <span className="text-sm text-muted">{game.name}</span>
                </div>
                <p className="mt-2 line-clamp-1 font-semibold text-white group-hover:text-accent">
                  {m.title}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Avatar username={creator.username} color={creator.avatarColor} size={24} />
                  <span className="text-xs text-muted">{creator.username}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <PlatformBadge platform={m.platform} />
                  <span className="font-bold text-accent">
                    {formatMoney(m.entryFeeCents)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA final */}
      <section className="mt-20 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/15 via-card to-violet/15 p-10 text-center">
        <h2 className="text-2xl font-black text-white sm:text-4xl">
          Prêt à transformer votre skill en gains ?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Inscription gratuite, bonus de bienvenue de 5 €, premier match en
          moins de deux minutes.
        </p>
        <Link to={me ? "/wagers/create" : "/register"} className="btn-primary mt-6 !px-8 !py-3">
          {me ? "Créer un match" : "Créer mon compte"}
        </Link>
      </section>
    </div>
  );
}
