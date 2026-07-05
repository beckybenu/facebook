import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { PlatformBadge } from "@/components/ui";

export default async function HomePage() {
  const user = await getCurrentUser();

  const [playerCount, matchCount, tournamentCount, payoutAgg, games, openByGame, latestOpen] =
    await Promise.all([
      prisma.user.count(),
      prisma.match.count(),
      prisma.tournament.count(),
      prisma.transaction.aggregate({
        where: { type: { in: ["WAGER_PAYOUT", "TOURNAMENT_PRIZE"] } },
        _sum: { amountCents: true },
      }),
      prisma.game.findMany({ orderBy: { name: "asc" } }),
      prisma.match.groupBy({
        by: ["gameId"],
        where: { status: "OPEN" },
        _count: { _all: true },
      }),
      prisma.match.findMany({
        where: { status: "OPEN" },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { game: true, creator: true },
      }),
    ]);

  const openCounts = new Map(openByGame.map((g) => [g.gameId, g._count._all]));
  const totalPaidCents = payoutAgg._sum.amountCents ?? 0;

  const stats = [
    { label: "Joueurs inscrits", value: playerCount.toLocaleString("fr-FR") },
    { label: "Matchs joués", value: matchCount.toLocaleString("fr-FR") },
    { label: "Gains distribués", value: formatMoney(totalPaidCents) },
    { label: "Tournois organisés", value: tournamentCount.toLocaleString("fr-FR") },
  ];

  const steps = [
    {
      num: "1",
      title: "Déposez",
      text: "Créez votre compte et alimentez votre porte-monnaie en quelques secondes. Vos fonds sont disponibles immédiatement.",
    },
    {
      num: "2",
      title: "Défiez",
      text: "Créez un match à mise sur votre jeu ou acceptez le défi d'un autre joueur. Mise de 1 € à 500 €, sur PS5, Xbox ou PC.",
    },
    {
      num: "3",
      title: "Encaissez",
      text: "Gagnez le match, déclarez le résultat, et le gain est crédité instantanément sur votre solde. Retirez quand vous voulez.",
    },
  ];

  const features = [
    {
      icon: "⚡",
      title: "Paiements instantanés",
      text: "Les gains sont crédités automatiquement dès la validation du résultat. Aucune attente, aucun intermédiaire.",
    },
    {
      icon: "🛡️",
      title: "Arbitrage anti-triche",
      text: "Chaque litige est examiné par notre équipe d'arbitres. Preuves, captures et historiques : les tricheurs sont bannis.",
    },
    {
      icon: "🏆",
      title: "Tournois quotidiens",
      text: "Des tournois cash à élimination directe tous les jours, avec cagnottes bonus ajoutées par la maison.",
    },
    {
      icon: "👑",
      title: "Programme Elite",
      text: "Les membres Elite ne paient que 5 % de frais de service au lieu de 10 %. Votre skill vaut plus.",
    },
  ];

  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="relative -mx-4 -mt-10 overflow-hidden bg-hero-grid px-4 pb-24 pt-20 text-center sm:-mx-6 sm:px-6 sm:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
          <span className="badge border border-accent/40 bg-accent-soft text-accent">
            🎮 Plateforme e-sport n°1 des matchs à mise
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Votre skill. Vos règles.{" "}
            <span className="text-accent">Vos gains.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Affrontez des joueurs du monde entier en matchs à mise sur vos jeux
            préférés. Vous gagnez la partie, vous encaissez — c&apos;est aussi
            simple que ça.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Link href="/wagers/create" className="btn-primary px-8 py-3 text-base">
                Créer un match
              </Link>
            ) : (
              <Link href="/register" className="btn-primary px-8 py-3 text-base">
                S&apos;inscrire gratuitement
              </Link>
            )}
            <Link href="/wagers" className="btn-secondary px-8 py-3 text-base">
              Voir les matchs
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card px-6 py-6 text-center">
            <p className="text-3xl font-extrabold text-accent">{s.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* JEUX */}
      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="section-title">Choisissez votre terrain</h2>
            <p className="mt-2 text-muted">
              Les jeux compétitifs les plus joués, sur toutes les plateformes.
            </p>
          </div>
          <Link
            href="/games"
            className="hidden text-sm font-semibold text-accent hover:underline sm:block"
          >
            Tous les jeux →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="card group flex flex-col gap-3 p-5 transition-all hover:-translate-y-1 hover:border-accent/50"
            >
              <span className="text-4xl">{game.icon}</span>
              <div>
                <p className="font-bold text-white transition-colors group-hover:text-accent">
                  {game.name}
                </p>
                <p className="text-xs text-muted">{game.category}</p>
              </div>
              <span className="badge mt-auto w-fit bg-accent-soft text-accent">
                {openCounts.get(game.id) ?? 0} match
                {(openCounts.get(game.id) ?? 0) > 1 ? "s" : ""} ouvert
                {(openCounts.get(game.id) ?? 0) > 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="section-title">Comment ça marche</h2>
          <p className="mt-2 text-muted">
            Trois étapes entre vous et vos premiers gains.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="card relative p-8">
              <span className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg font-extrabold text-[#04150C] shadow-glow">
                {step.num}
              </span>
              <h3 className="mt-3 text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{step.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/how-it-works" className="btn-secondary">
            Le guide complet
          </Link>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="section-title">Conçu pour les compétiteurs</h2>
          <p className="mt-2 text-muted">
            Tout ce qu&apos;il faut pour jouer sérieusement, en toute confiance.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="card p-6 transition-colors hover:border-accent/50"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DERNIERS MATCHS OUVERTS */}
      {latestOpen.length > 0 ? (
        <section>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="section-title">Matchs ouverts en ce moment</h2>
              <p className="mt-2 text-muted">
                Des adversaires vous attendent. Relevez le défi.
              </p>
            </div>
            <Link
              href="/wagers"
              className="hidden text-sm font-semibold text-accent hover:underline sm:block"
            >
              Tous les matchs →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latestOpen.map((match) => (
              <Link
                key={match.id}
                href="/wagers"
                className="card group flex flex-col gap-3 p-5 transition-all hover:-translate-y-1 hover:border-accent/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{match.game.icon}</span>
                  <span className="text-sm font-semibold text-white">
                    {match.game.name}
                  </span>
                </div>
                <p className="truncate text-sm text-muted">{match.title}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-extrabold text-accent">
                    {formatMoney(match.entryFeeCents)}
                  </span>
                  <PlatformBadge platform={match.platform} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* CTA FINAL */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent/20 via-accent/10 to-violet/20 px-8 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Prêt à transformer votre skill en gains ?
          </h2>
          <p className="mt-4 text-lg text-muted">
            Inscription gratuite, premier match en moins de deux minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {user ? (
              <Link href="/wagers/create" className="btn-primary px-8 py-3 text-base">
                Créer un match maintenant
              </Link>
            ) : (
              <Link href="/register" className="btn-primary px-8 py-3 text-base">
                Créer mon compte gratuit
              </Link>
            )}
            <Link href="/tournaments" className="btn-secondary px-8 py-3 text-base">
              Découvrir les tournois
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
