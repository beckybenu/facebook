import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Toutes les réponses à vos questions sur Betwager : dépôts, retraits, frais, litiges, triche, programme Elite.",
};

const faqs: { q: string; a: string }[] = [
  {
    q: "Comment déposer de l'argent sur mon compte ?",
    a: "Rendez-vous dans votre porte-monnaie depuis le tableau de bord et choisissez le montant à déposer (minimum 5 €, maximum 1 000 € par opération). Le solde est crédité instantanément et reste disponible pour tous vos matchs et tournois.",
  },
  {
    q: "Comment retirer mes gains ?",
    a: "Les retraits se font depuis votre porte-monnaie, à partir de 10 € et dans la limite de votre solde disponible. Aucune condition de mise, aucun frais de retrait : vos gains vous appartiennent dès qu'ils sont crédités.",
  },
  {
    q: "Quels sont les frais de la plateforme ?",
    a: "L'inscription, les dépôts et les retraits sont gratuits. Betwager prélève uniquement des frais de service sur les gains : 10 % pour les membres standard, 5 % pour les membres Elite. Exemple : sur un match à 10 € de mise, le vainqueur touche 18 € (19 € en Elite).",
  },
  {
    q: "Que se passe-t-il si mon adversaire et moi déclarons des résultats différents ?",
    a: "Le match passe automatiquement en litige et les fonds restent bloqués. Un arbitre Betwager examine les preuves fournies par les deux joueurs (captures d'écran, clips, historiques de partie) puis attribue la victoire au joueur légitime, ou annule le match avec remboursement intégral des deux mises si aucune preuve n'est concluante.",
  },
  {
    q: "Comment luttez-vous contre la triche ?",
    a: "Chaque litige est arbitré manuellement avec analyse des preuves. Toute triche avérée — logiciel tiers, lag switch, manipulation de preuves, compte prêté ou boosté — entraîne la perte du match, la confiscation des gains concernés et le bannissement définitif du compte. Nous conseillons d'enregistrer vos parties pour appuyer vos déclarations.",
  },
  {
    q: "Quels jeux sont supportés ?",
    a: "Betwager couvre les principaux jeux compétitifs : FPS, Battle Royale, Sport, Combat et Course, sur PS5, Xbox, PC et en cross-plateforme. La liste complète est disponible sur la page Jeux, avec le nombre de matchs ouverts pour chacun.",
  },
  {
    q: "Qu'est-ce que le programme Elite ?",
    a: "Le statut Elite récompense nos joueurs les plus actifs : les frais de service sur les gains passent de 10 % à 5 %, soit deux fois moins. Sur un volume de jeu régulier, l'économie est considérable.",
  },
  {
    q: "Quel est l'âge minimum pour jouer ?",
    a: "Vous devez avoir au moins 18 ans pour créer un compte et participer à des matchs à mise. En créant un compte, vous certifiez être majeur ; tout compte détenu par un mineur sera fermé et les fonds restitués.",
  },
  {
    q: "Puis-je affronter un joueur sur une autre plateforme que la mienne ?",
    a: "Oui, si le jeu le permet : les matchs marqués « Cross-plateforme » sont ouverts à tous, quelle que soit votre machine. Sinon, chaque match précise sa plateforme (PS5, Xbox ou PC) et seuls les joueurs équipés peuvent l'accepter.",
  },
  {
    q: "Existe-t-il des tournois gratuits ?",
    a: "Oui. Certains tournois affichent une entrée gratuite (0 €) tout en distribuant une cagnotte bonus offerte par la maison. C'est le moyen idéal de découvrir la compétition sans risquer votre solde.",
  },
  {
    q: "Comment sont réparties les cagnottes de tournoi ?",
    a: "La cagnotte d'un tournoi est constituée des frais d'inscription de tous les participants, plus l'éventuel bonus ajouté par Betwager. Elle est répartie entre le vainqueur (70 %) et le finaliste (30 %), crédités automatiquement à la fin du tournoi.",
  },
  {
    q: "Puis-je annuler un match que j'ai créé ?",
    a: "Oui, tant que personne ne l'a accepté : votre mise vous est alors intégralement remboursée. Une fois le match accepté par un adversaire, les deux mises sont engagées et le match doit se jouer — sauf accord d'un arbitre en cas de circonstance exceptionnelle.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Questions fréquentes"
        subtitle="Tout ce que vous devez savoir avant de lancer votre premier défi."
      />
      <div className="space-y-3">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="card group overflow-hidden transition-colors open:border-accent/50"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-semibold text-white transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
              {item.q}
              <span className="shrink-0 text-accent transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="border-t border-edge px-6 py-5 text-sm leading-relaxed text-muted">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <div className="card mt-12 flex flex-col items-center gap-4 p-8 text-center">
        <span className="text-3xl">💬</span>
        <p className="text-lg font-bold text-white">
          Vous n&apos;avez pas trouvé votre réponse ?
        </p>
        <p className="text-sm text-muted">
          Notre équipe support répond en moins de 24 heures.
        </p>
        <Link href="/support" className="btn-primary">
          Contacter le support
        </Link>
      </div>
    </div>
  );
}
