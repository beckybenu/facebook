import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Les conditions générales d'utilisation de la plateforme Betwager.",
};

const articles: { title: string; paragraphs: string[] }[] = [
  {
    title: "Article 1 — Objet",
    paragraphs: [
      "Les présentes conditions générales d'utilisation (les « Conditions ») régissent l'accès et l'utilisation de la plateforme Betwager (le « Service »), qui permet à ses utilisateurs de s'affronter dans des matchs de jeux vidéo à mise et des tournois dotés de cagnottes, sur la base exclusive de leur habileté.",
      "En créant un compte ou en utilisant le Service, vous acceptez sans réserve les présentes Conditions. Si vous n'acceptez pas tout ou partie de ces Conditions, vous ne devez pas utiliser le Service.",
    ],
  },
  {
    title: "Article 2 — Éligibilité",
    paragraphs: [
      "Le Service est réservé aux personnes physiques âgées d'au moins dix-huit (18) ans, disposant de la pleine capacité juridique et résidant dans une juridiction où la participation à des compétitions d'habileté à mise est licite.",
      "En créant un compte, vous certifiez remplir ces conditions. Betwager se réserve le droit de demander à tout moment un justificatif d'identité et d'âge, et de fermer sans préavis tout compte détenu par un mineur, les fonds déposés étant alors restitués.",
    ],
  },
  {
    title: "Article 3 — Compte utilisateur",
    paragraphs: [
      "Chaque utilisateur ne peut détenir qu'un seul compte. Les informations fournies lors de l'inscription doivent être exactes, complètes et tenues à jour. Le pseudo choisi ne doit être ni offensant, ni trompeur, ni usurper l'identité d'un tiers.",
      "Vous êtes seul responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre compte. Le prêt, la vente ou le partage de compte sont interdits. En cas d'utilisation non autorisée de votre compte, vous devez en informer immédiatement le support.",
    ],
  },
  {
    title: "Article 4 — Dépôts et retraits",
    paragraphs: [
      "Le porte-monnaie Betwager est libellé en euros. Les dépôts sont acceptés de 5 € à 1 000 € par opération et sont crédités immédiatement. Les retraits sont possibles à partir de 10 €, dans la limite du solde disponible, et ne sont soumis à aucuns frais.",
      "Les fonds déposés ne peuvent servir qu'à participer aux matchs et tournois du Service. Betwager ne verse aucun intérêt sur les soldes. En cas de fermeture du compte à l'initiative de l'utilisateur, le solde restant est restitué, déduction faite des sommes engagées dans des matchs en cours.",
    ],
  },
  {
    title: "Article 5 — Frais de service",
    paragraphs: [
      "Betwager prélève des frais de service uniquement sur les gains : dix pour cent (10 %) du gain brut pour les membres standard, et cinq pour cent (5 %) pour les membres bénéficiant du statut Elite. Aucun frais n'est prélevé sur les dépôts, les retraits ni les remboursements de matchs annulés.",
      "Le barème des frais en vigueur est affiché sur la page « Comment ça marche ». Toute évolution du barème sera notifiée aux utilisateurs au moins trente (30) jours avant son entrée en vigueur et ne s'appliquera qu'aux matchs créés après cette date.",
    ],
  },
  {
    title: "Article 6 — Fair-play et anti-triche",
    paragraphs: [
      "Les matchs organisés sur le Service sont des compétitions d'habileté. Chaque joueur s'engage à jouer loyalement, à respecter les règles convenues pour le match et à déclarer sincèrement le résultat de chaque partie.",
      "Sont notamment interdits : l'utilisation de logiciels tiers procurant un avantage (cheats, macros, aimbots), la manipulation de la connexion (lag switch), la falsification de preuves, la collusion entre joueurs, le boosting et le smurfing délibéré. Toute violation entraîne la perte du match concerné, la confiscation des gains associés et, selon la gravité, la suspension ou le bannissement définitif du compte.",
    ],
  },
  {
    title: "Article 7 — Litiges entre joueurs",
    paragraphs: [
      "Lorsque les déclarations de résultat des deux joueurs sont contradictoires, le match est placé en litige et les mises restent bloquées. Chaque joueur peut soumettre des preuves (captures d'écran, enregistrements vidéo, historiques de partie) à l'appui de sa déclaration.",
      "Un arbitre Betwager examine les éléments fournis et rend une décision : attribution de la victoire à l'un des joueurs, ou annulation du match avec remboursement intégral des deux mises. Les décisions d'arbitrage sont rendues de bonne foi sur la base des éléments disponibles et sont définitives au sein du Service.",
    ],
  },
  {
    title: "Article 8 — Responsabilité",
    paragraphs: [
      "Betwager met en œuvre des moyens raisonnables pour assurer la disponibilité et la sécurité du Service, sans garantir un fonctionnement ininterrompu ou exempt d'erreurs. Betwager n'est pas responsable des dysfonctionnements imputables aux jeux eux-mêmes, aux plateformes tierces (PlayStation Network, Xbox Live, etc.), à la connexion des utilisateurs ou à des cas de force majeure.",
      "La responsabilité de Betwager envers un utilisateur est, en tout état de cause, limitée au montant total des frais de service perçus auprès de cet utilisateur au cours des douze (12) derniers mois. Le jeu à mise doit rester un loisir : jouez de manière responsable et ne misez jamais plus que ce que vous pouvez vous permettre de perdre.",
    ],
  },
  {
    title: "Article 9 — Suspension et résiliation",
    paragraphs: [
      "Vous pouvez fermer votre compte à tout moment en contactant le support ; le solde restant vous est restitué conformément à l'article 4. Betwager peut suspendre ou résilier un compte, avec effet immédiat, en cas de violation des présentes Conditions, de fraude, de triche avérée ou d'exigence légale.",
      "En cas de résiliation pour faute, les gains obtenus frauduleusement peuvent être confisqués. Les sommes déposées licitement et non liées à la fraude sont restituées après vérification.",
    ],
  },
  {
    title: "Article 10 — Droit applicable et modification des Conditions",
    paragraphs: [
      "Les présentes Conditions sont régies par le droit français. Tout différend relatif à leur interprétation ou à leur exécution relèvera, après tentative de résolution amiable, de la compétence des tribunaux du ressort de Paris, sous réserve des dispositions impératives protectrices du consommateur.",
      "Betwager peut modifier les présentes Conditions à tout moment. Les utilisateurs seront informés de toute modification substantielle au moins trente (30) jours avant son entrée en vigueur. La poursuite de l'utilisation du Service après cette date vaut acceptation des Conditions modifiées.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Conditions d'utilisation"
        subtitle="Dernière mise à jour : 1er juin 2026 — merci de lire attentivement ces conditions avant d'utiliser Betwager."
      />
      <div className="space-y-6">
        {articles.map((article) => (
          <section key={article.title} className="card p-8">
            <h2 className="text-lg font-bold text-white">{article.title}</h2>
            <div className="mt-4 space-y-3">
              {article.paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-muted">
        Une question sur ces conditions ? Écrivez-nous à{" "}
        <span className="font-semibold text-accent">legal@betwager.gg</span>.
      </p>
    </div>
  );
}
