import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment Betwager collecte, utilise et protège vos données personnelles.",
};

const sections: { title: string; icon: string; content: React.ReactNode }[] = [
  {
    title: "1. Données que nous collectons",
    icon: "📋",
    content: (
      <>
        <p>
          Dans le cadre de l&apos;utilisation du service, nous collectons les
          données suivantes :
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-slate-300">Données de compte</span> :
            adresse email, pseudo, mot de passe (stocké sous forme hachée,
            jamais en clair), pays, biographie et gamertags renseignés
            (PSN, Xbox, Activision, Epic).
          </li>
          <li>
            <span className="font-semibold text-slate-300">Données financières</span> :
            solde du porte-monnaie, historique des dépôts, retraits, mises et
            gains. Aucune donnée bancaire n&apos;est stockée sur nos serveurs.
          </li>
          <li>
            <span className="font-semibold text-slate-300">Données de jeu</span> :
            matchs créés et joués, résultats déclarés, litiges, participations
            aux tournois, statistiques (victoires, défaites, XP).
          </li>
          <li>
            <span className="font-semibold text-slate-300">Données techniques</span> :
            journaux de connexion et informations nécessaires à la sécurité du
            service.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "2. Utilisation de vos données",
    icon: "⚙️",
    content: (
      <>
        <p>Vos données sont utilisées exclusivement pour :</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>fournir le service : gestion du compte, des matchs, des tournois et du porte-monnaie ;</li>
          <li>garantir l&apos;équité : arbitrage des litiges, détection de la triche et des comptes multiples ;</li>
          <li>assurer la sécurité : prévention de la fraude et des accès non autorisés ;</li>
          <li>respecter nos obligations légales, notamment la vérification de l&apos;âge ;</li>
          <li>vous adresser des notifications liées à votre activité (matchs, litiges, tournois, support).</li>
        </ul>
        <p className="mt-3">
          Nous ne vendons jamais vos données personnelles et ne les partageons
          avec aucun tiers à des fins publicitaires.
        </p>
      </>
    ),
  },
  {
    title: "3. Cookies",
    icon: "🍪",
    content: (
      <p>
        Betwager utilise uniquement des cookies strictement nécessaires au
        fonctionnement du service : un cookie de session sécurisé
        (authentification) et, le cas échéant, des cookies techniques de
        préférence d&apos;affichage. Aucun cookie publicitaire ni traceur tiers
        n&apos;est déposé. Ces cookies essentiels ne requièrent pas de
        consentement préalable ; leur suppression via votre navigateur entraîne
        la déconnexion de votre compte.
      </p>
    ),
  },
  {
    title: "4. Durée de conservation",
    icon: "🗓️",
    content: (
      <>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-slate-300">Données de compte</span> :
            conservées tant que le compte est actif, puis supprimées ou
            anonymisées dans les 30 jours suivant sa fermeture.
          </li>
          <li>
            <span className="font-semibold text-slate-300">Données financières</span> :
            conservées 5 ans après la dernière opération, conformément à nos
            obligations comptables et de lutte contre la fraude.
          </li>
          <li>
            <span className="font-semibold text-slate-300">Données de litige</span> :
            conservées 3 ans après la résolution du litige.
          </li>
          <li>
            <span className="font-semibold text-slate-300">Journaux techniques</span> :
            conservés 12 mois maximum.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Vos droits (RGPD)",
    icon: "🛡️",
    content: (
      <>
        <p>
          Conformément au Règlement général sur la protection des données
          (RGPD) et à la loi Informatique et Libertés, vous disposez des droits
          suivants sur vos données personnelles :
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>droit d&apos;accès : obtenir une copie des données que nous détenons sur vous ;</li>
          <li>droit de rectification : corriger des données inexactes ou incomplètes ;</li>
          <li>droit à l&apos;effacement : demander la suppression de vos données, dans les limites de nos obligations légales ;</li>
          <li>droit à la limitation du traitement et droit d&apos;opposition ;</li>
          <li>droit à la portabilité : recevoir vos données dans un format structuré et lisible.</li>
        </ul>
        <p className="mt-3">
          Vous pouvez exercer ces droits à tout moment en nous contactant (voir
          section 6). Vous disposez également du droit d&apos;introduire une
          réclamation auprès de la CNIL (www.cnil.fr).
        </p>
      </>
    ),
  },
  {
    title: "6. Contact",
    icon: "✉️",
    content: (
      <p>
        Pour toute question relative à cette politique ou pour exercer vos
        droits, contactez notre délégué à la protection des données à
        l&apos;adresse{" "}
        <span className="font-semibold text-accent">privacy@betwager.gg</span>,
        ou via la page Support de la plateforme. Nous nous engageons à répondre
        dans un délai maximum de 30 jours.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Politique de confidentialité"
        subtitle="Dernière mise à jour : 1er juin 2026 — votre vie privée est une priorité, voici comment nous protégeons vos données."
      />
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="card p-8">
            <h2 className="flex items-center gap-3 text-lg font-bold text-white">
              <span className="text-xl">{section.icon}</span>
              {section.title}
            </h2>
            <div className="mt-4 text-sm leading-relaxed text-muted">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
