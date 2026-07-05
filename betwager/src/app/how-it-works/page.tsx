import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description:
    "Le guide complet de Betwager : créer un compte, déposer, défier, jouer et encaisser vos gains.",
};

const steps = [
  {
    num: 1,
    icon: "👤",
    title: "Créez votre compte",
    text: "L'inscription est gratuite et prend moins d'une minute : un email, un pseudo, un mot de passe. Renseignez ensuite vos gamertags (PSN, Xbox, Activision, Epic) dans votre profil pour que vos adversaires puissent vous retrouver en jeu.",
  },
  {
    num: 2,
    icon: "💳",
    title: "Déposez des fonds",
    text: "Alimentez votre porte-monnaie Betwager depuis votre tableau de bord (minimum 5 €, maximum 1 000 € par dépôt). Votre solde est crédité instantanément et reste disponible pour vos matchs et tournois.",
  },
  {
    num: 3,
    icon: "⚔️",
    title: "Créez ou acceptez un match",
    text: "Publiez un défi en fixant le jeu, la plateforme, les règles et la mise (de 1 € à 500 €), ou parcourez les matchs ouverts et acceptez celui qui vous convient. La mise des deux joueurs est bloquée automatiquement dès l'acceptation : personne ne peut se défiler.",
  },
  {
    num: 4,
    icon: "🎮",
    title: "Jouez et déclarez le résultat",
    text: "Retrouvez votre adversaire en jeu selon les règles convenues, puis déclarez le résultat (victoire ou défaite) depuis la page du match. Si les deux déclarations concordent, le match est réglé automatiquement. Sinon, un litige est ouvert et un arbitre tranche.",
  },
  {
    num: 5,
    icon: "💰",
    title: "Encaissez vos gains",
    text: "Le vainqueur reçoit le double de la mise, moins les frais de service, crédité immédiatement sur son solde. Vous pouvez rejouer aussitôt ou demander un retrait (minimum 10 €) à tout moment.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <PageHeader
        title="Comment ça marche"
        subtitle="De l'inscription à l'encaissement : tout ce qu'il faut savoir pour jouer sur Betwager."
      />

      {/* Étapes */}
      <div className="space-y-6">
        {steps.map((step) => (
          <div key={step.num} className="card flex gap-6 p-8">
            <div className="hidden shrink-0 sm:block">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-extrabold text-[#04150C] shadow-glow">
                {step.num}
              </span>
            </div>
            <div>
              <h2 className="flex items-center gap-3 text-xl font-bold text-white">
                <span className="text-2xl">{step.icon}</span>
                <span className="sm:hidden text-accent">{step.num}.</span>
                {step.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Encadrés litiges + frais */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="card border-danger/30 p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold text-white">
            <span className="text-2xl">🛡️</span> Litiges et arbitrage
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            Si les deux joueurs déclarent des résultats contradictoires, le
            match passe automatiquement en litige et les fonds restent bloqués.
            Un arbitre Betwager examine alors les preuves fournies (captures
            d&apos;écran, clips vidéo, historiques de partie) et attribue la
            victoire au joueur légitime — ou annule le match et rembourse les
            deux mises si aucune preuve n&apos;est concluante.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            Toute triche avérée (compte boosté, manipulation de preuves, lag
            switch, logiciel tiers) entraîne la perte du match, la confiscation
            des gains concernés et le bannissement définitif du compte.
          </p>
        </div>

        <div className="card border-gold/30 p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold text-white">
            <span className="text-2xl">💶</span> Les frais, en toute transparence
          </h2>
          <p className="mt-4 leading-relaxed text-muted">
            L&apos;inscription, les dépôts et les retraits sont gratuits.
            Betwager prélève uniquement des frais de service sur les gains :
          </p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between rounded-lg bg-elevated px-4 py-3">
              <span className="text-sm text-slate-300">Membres standard</span>
              <span className="font-bold text-white">10 % des gains</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-elevated px-4 py-3">
              <span className="text-sm text-slate-300">
                Membres <span className="font-semibold text-gold">Elite</span>
              </span>
              <span className="font-bold text-gold">5 % des gains</span>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Exemple : sur un match à 10 € de mise, le vainqueur touche 18 €
            (ou 19 € en Elite). En cas de match annulé, les mises sont
            intégralement remboursées, sans frais.
          </p>
        </div>
      </div>

      {/* CTA */}
      <section className="mt-16 rounded-2xl bg-gradient-to-r from-accent/20 via-accent/10 to-violet/20 px-8 py-14 text-center">
        <h2 className="text-3xl font-extrabold text-white">
          Vous savez tout. À vous de jouer.
        </h2>
        <p className="mt-3 text-lg text-muted">
          Créez votre compte gratuitement et lancez votre premier défi.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            Créer mon compte
          </Link>
          <Link href="/wagers" className="btn-secondary px-8 py-3 text-base">
            Parcourir les matchs
          </Link>
        </div>
      </section>
    </div>
  );
}
