import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "La mission de Betwager : faire de chaque partie une compétition qui compte, dans un cadre équitable et sécurisé.",
};

const values = [
  {
    icon: "⚖️",
    title: "Fair-play avant tout",
    text: "Un match n'a de valeur que s'il est équitable. Nos règles sont claires, nos arbitres sont impartiaux et les tricheurs n'ont pas leur place ici. Chaque litige est traité avec sérieux, preuves à l'appui.",
  },
  {
    icon: "⚡",
    title: "Paiements rapides",
    text: "Votre argent vous appartient. Les gains sont crédités instantanément après chaque victoire, et les retraits sont traités sans délai artificiel. Aucun frais caché, jamais.",
  },
  {
    icon: "🤝",
    title: "Communauté",
    text: "Betwager, c'est avant tout des joueurs passionnés qui se retrouvent pour se mesurer les uns aux autres. Tournois quotidiens, classements, programme Elite : nous construisons la plateforme avec et pour notre communauté.",
  },
];

export default async function AboutPage() {
  const [playerCount, completedMatches, tournamentCount, payoutAgg] =
    await Promise.all([
      prisma.user.count(),
      prisma.match.count({ where: { status: "COMPLETED" } }),
      prisma.tournament.count(),
      prisma.transaction.aggregate({
        where: { type: { in: ["WAGER_PAYOUT", "TOURNAMENT_PRIZE"] } },
        _sum: { amountCents: true },
      }),
    ]);

  const stats = [
    { label: "Joueurs inscrits", value: playerCount.toLocaleString("fr-FR") },
    { label: "Matchs terminés", value: completedMatches.toLocaleString("fr-FR") },
    {
      label: "Gains distribués",
      value: formatMoney(payoutAgg._sum.amountCents ?? 0),
    },
    { label: "Tournois organisés", value: tournamentCount.toLocaleString("fr-FR") },
  ];

  return (
    <div>
      <PageHeader
        title="À propos de Betwager"
        subtitle="Nous croyons que le skill mérite d'être récompensé."
      />

      {/* Mission */}
      <section className="card bg-hero-grid p-10">
        <h2 className="section-title">Notre mission</h2>
        <div className="mt-5 max-w-3xl space-y-4 leading-relaxed text-muted">
          <p>
            Betwager est née d&apos;un constat simple : des millions de joueurs
            s&apos;affrontent chaque jour en ligne, mais leurs victoires ne
            comptent que pour un classement. Nous avons voulu donner un vrai
            enjeu à chaque partie — un cadre où votre skill se transforme en
            gains réels, en toute sécurité.
          </p>
          <p>
            Concrètement, Betwager permet à deux joueurs de s&apos;affronter en
            match à mise : chacun engage la même somme, le vainqueur remporte
            la cagnotte. Les fonds sont bloqués par la plateforme pendant le
            match, les résultats sont vérifiés et les litiges arbitrés par une
            équipe dédiée. Ni pari sur des tiers, ni hasard : uniquement votre
            performance.
          </p>
          <p>
            De la mise à 1 € entre amis aux tournois cash quotidiens, notre
            objectif reste le même : faire de chaque partie une compétition qui
            compte.
          </p>
        </div>
      </section>

      {/* Valeurs */}
      <section className="mt-12">
        <h2 className="section-title mb-8">Nos valeurs</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="card p-8 transition-colors hover:border-accent/50"
            >
              <span className="text-4xl">{v.icon}</span>
              <h3 className="mt-4 text-lg font-bold text-white">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="mt-12">
        <h2 className="section-title mb-8">Betwager en chiffres</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card px-6 py-8 text-center">
              <p className="text-3xl font-extrabold text-accent">{s.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-2xl bg-gradient-to-r from-accent/20 via-accent/10 to-violet/20 px-8 py-14 text-center">
        <h2 className="text-3xl font-extrabold text-white">
          Rejoignez la compétition
        </h2>
        <p className="mt-3 text-lg text-muted">
          Des milliers de joueurs vous attendent. Et vous, que vaut votre skill ?
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            Créer mon compte gratuit
          </Link>
          <Link href="/how-it-works" className="btn-secondary px-8 py-3 text-base">
            Comment ça marche
          </Link>
        </div>
      </section>
    </div>
  );
}
