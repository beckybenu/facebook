// Génère data/sectors.json : les « packs métiers » NeuralStark.
// Chaque domaine d'activité reçoit une sélection curée des 130 agents (les 7 agents
// du Cœur IA sont toujours inclus). Tous les ids sont validés contre data/agents.json —
// le script échoue bruyamment si un id n'existe pas.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS = JSON.parse(readFileSync(join(__dirname, "..", "data", "agents.json"), "utf8")).agents;
const VALID = new Set(AGENTS.map((a) => a.id));
const byCategory = (cat) => AGENTS.filter((a) => a.category === cat).map((a) => a.id);

// --- Briques réutilisables ---
const CORE = byCategory("core"); // toujours inclus (7)
const GESTION = ["generateur-de-devis-factures", "assistant-comptable", "gardien-de-tresorerie",
  "suiveur-de-kpi", "tableau-de-bord-pro", "surveillant-de-chiffre-d-affaires", "visualiseur-de-kpi"];
const BUREAU = ["assistant-email", "pilote-d-agenda", "gestionnaire-de-temps", "assistant-de-direction"];
const DOCS = ["analyste-de-documents", "moteur-de-synthese", "moteur-de-recherche",
  "ingesteur-de-connaissances", "assistant-faq"];
const CLIENTS = ["historien-client", "chuchoteur-client", "analyseur-de-clients", "analyseur-de-retours"];
const MARKETING_LOCAL = ["pilote-des-reseaux-sociaux", "boosteur-d-avis", "planificateur-de-contenu",
  "redacteur-publicitaire", "designer-visuel"];
const CHANTIER = ["pilote-de-planning", "gestionnaire-de-projet", "suiveur-de-projet",
  "enregistreur-de-temps", "rapporteur-sur-le-terrain", "observateur-de-securite", "controleur-qualite",
  "calculateur-de-materiaux", "gestionnaire-de-stock", "surveillant-de-stock",
  "visualiseur-de-rentabilite", "genie-des-prix", "analyseur-de-devis"];
const RH_BASE = ["assistant-rh", "pilote-de-paie", "chercheur-de-talents", "pilote-d-integration"];
const VENTE = ["coach-commercial", "qualificateur-de-prospects", "gestionnaire-d-objections",
  "moteur-d-upsell", "optimisateur-de-funnel-de-vente", "resumeur-d-appels"];
const PROCESSUS = ["organisateur-de-processus", "bibliotheque-des-bonnes-pratiques",
  "auditeur-de-procedures", "moteur-de-tutoriels", "guide-de-formation", "createur-de-glossaire", "generateur-q-r"];
const STRATEGIE = ["conseiller", "moteur-strategique", "moteur-de-croissance", "moteur-de-decision",
  "surveillant-de-concurrents", "simulateur-de-scenarios", "arbre-de-decision"];

// --- Packs métiers ---
// { id, icon, label, description, agents:[ids] } — CORE est ajouté automatiquement.
const SECTORS = [
  {
    id: "peinture", icon: "🎨", label: "Entreprise de peinture",
    description: "Devis en 1 clic, planning chantiers, stocks, photos avant/après, avis clients.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...DOCS, ...CLIENTS, ...MARKETING_LOCAL, ...CHANTIER,
      ...byCategory("vision"), "redacteur-de-contrats", "stratege-seo", "moteur-de-previsions"],
  },
  {
    id: "batiment", icon: "🧱", label: "Construction / BTP",
    description: "Suivi chantiers, devis, planning, matériaux, sécurité, rentabilité par projet.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...DOCS, ...CLIENTS, ...CHANTIER, ...RH_BASE,
      "analyste-d-images", "estimateur-de-surface", "inspecteur-de-surface", "galerie-de-chantier",
      "createur-d-avant-apres", "redacteur-de-contrats", "analyste-de-risques", "planificateur-de-maintenance",
      "boosteur-d-avis", "pilote-des-reseaux-sociaux", "moteur-de-previsions"],
  },
  {
    id: "menuiserie", icon: "🪚", label: "Menuiserie / Ébénisterie",
    description: "Devis, gestion bois et matériaux, planning atelier, photos de réalisations.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...DOCS, ...CLIENTS, ...CHANTIER, ...MARKETING_LOCAL,
      "analyste-d-images", "createur-d-avant-apres", "reconnaisseur-de-style", "galerie-de-chantier",
      "editeur-de-photos-de-stock", "redacteur-de-contrats", "traitement-de-commande"],
  },
  {
    id: "technique", icon: "🔧", label: "Plombier / Électricien / Maintenance",
    description: "Interventions, devis, stocks, planning, maintenance préventive, sécurité.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...DOCS, ...CLIENTS, ...CHANTIER,
      "planificateur-de-maintenance", "support-technique", "assistant-logistique",
      "boosteur-d-avis", "pilote-des-reseaux-sociaux", "lecteur-whatsapp", "analyste-d-images",
      "inspecteur-de-surface", "redacteur-de-contrats"],
  },
  {
    id: "avocats", icon: "⚖️", label: "Étude d'avocats / Notariat",
    description: "Analyse de contrats, rédaction juridique, synthèse de dossiers, archives, facturation.",
    agents: ["assistant-juridique", "redacteur-de-contrats", ...DOCS, ...PROCESSUS,
      "moteur-de-raisonnement", "graphe-des-connaissances", "nettoyeur-de-donnees",
      ...GESTION, ...BUREAU, ...CLIENTS, "resumeur-d-appels", "analyste-de-risques",
      "porte-parole", "pilote-de-newsletter", "stratege-seo", "moteur-de-decision",
      "arbre-de-decision", ...RH_BASE.slice(0, 2), "auto-apprenant"],
  },
  {
    id: "medecin", icon: "🩺", label: "Cabinet médical / Santé",
    description: "Agenda patients, facturation, dossiers, procédures, communication santé.",
    agents: [...GESTION, ...BUREAU, ...DOCS, ...PROCESSUS, ...CLIENTS.slice(0, 2),
      "pilote-de-planning", "resumeur-d-appels", "analyste-de-risques", "nettoyeur-de-donnees",
      "porte-parole", "pilote-de-newsletter", "boosteur-d-avis", ...RH_BASE,
      "moteur-de-decision", "analyseur-de-retours", "auto-apprenant"],
  },
  {
    id: "laboratoire", icon: "🧫", label: "Laboratoire / Pharmacie",
    description: "Gestion résultats et stocks, procédures qualité, facturation, sécurité des données.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...DOCS, ...PROCESSUS,
      "gestionnaire-de-stock", "surveillant-de-stock", "traitement-de-commande", "assistant-logistique",
      "controleur-qualite", "nettoyeur-de-donnees", "analyste-de-risques", "detecteur-de-motifs",
      ...RH_BASE.slice(0, 2), "analyseur-de-retours"],
  },
  {
    id: "commerce", icon: "🛒", label: "Commerce / Boutique / E-commerce",
    description: "Stocks, commandes, relances, promotions, avis Google, ventes additionnelles.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...DOCS.slice(0, 3), ...CLIENTS, ...MARKETING_LOCAL, ...VENTE,
      "gestionnaire-de-stock", "surveillant-de-stock", "traitement-de-commande", "assistant-logistique",
      "genie-des-prix", "stratege-seo", "pilote-de-newsletter", "generateur-de-leviers-de-prospection",
      "chasseur-de-tendances", "moteur-de-previsions", "lecteur-whatsapp"],
  },
  {
    id: "restauration", icon: "🍽️", label: "Hôtellerie / Restauration",
    description: "Réservations, planning équipe, commandes, stocks, avis clients, réseaux sociaux.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...CLIENTS, ...MARKETING_LOCAL,
      "pilote-de-planning", "gestionnaire-de-stock", "surveillant-de-stock", "traitement-de-commande",
      "reducteur-de-gaspillage", "controleur-qualite", ...RH_BASE, "moteur-de-motivation",
      "pilote-de-newsletter", "lecteur-whatsapp", "assistant-faq", "moteur-de-previsions"],
  },
  {
    id: "conseil", icon: "🧑‍💼", label: "Conseil / Expertise comptable",
    description: "Suivi clients, rapports, facturation, planning missions, veille et pitchs.",
    agents: [...GESTION, ...BUREAU, ...DOCS, ...CLIENTS, ...STRATEGIE,
      "narrateur-financier", "planificateur-budgetaire", "optimisateur-fiscal", "analyste-de-risques",
      "moteur-de-previsions", "concepteur-de-pitch", "orateur-public", "porte-parole",
      "pilote-de-newsletter", "stratege-seo", "redacteur-de-contrats", "resumeur-d-appels",
      "gestionnaire-de-projet", "qualificateur-de-prospects", "generateur-q-r"],
  },
  {
    id: "immobilier", icon: "🏘️", label: "Immobilier / Promotion",
    description: "Annonces, visites, dossiers, contrats, photos de biens, relances prospects.",
    agents: [...GESTION, ...BUREAU, ...DOCS, ...CLIENTS, ...VENTE, ...MARKETING_LOCAL,
      "redacteur-de-contrats", "analyste-d-images", "editeur-de-photos-de-stock", "reconnaisseur-de-style",
      "estimateur-de-surface", "analyseur-de-luminosite", "stratege-seo", "genie-des-prix",
      "gestionnaire-de-projet", "analyste-de-risques", "moteur-de-previsions"],
  },
  {
    id: "industrie", icon: "🏭", label: "Industrie / Production",
    description: "Production, maintenance, qualité, stocks, logistique, sécurité, KPI usine.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...DOCS, ...PROCESSUS.slice(0, 5), ...RH_BASE,
      ...byCategory("operations"), "analyste-de-risques", "detecteur-de-motifs",
      "moteur-d-optimisation", "moteur-de-previsions", "nettoyeur-de-donnees", "suiveur-de-performance"],
  },
  {
    id: "transport", icon: "🚚", label: "Transport / Livraison",
    description: "Suivi livraisons, planning tournées, relances, facturation, maintenance véhicules.",
    agents: [...GESTION, ...BUREAU.slice(0, 3), ...DOCS.slice(0, 3), ...CLIENTS.slice(0, 2),
      "assistant-logistique", "traitement-de-commande", "pilote-de-planning", "gestionnaire-de-projet",
      "planificateur-de-maintenance", "observateur-de-securite", "enregistreur-de-temps",
      "reducteur-de-couts", "reducteur-de-gaspillage", "lecteur-whatsapp", "resumeur-d-appels",
      "analyste-de-risques", "moteur-d-optimisation"],
  },
  {
    id: "agence-marketing", icon: "📢", label: "Agence marketing / Communication",
    description: "Contenus, calendriers éditoriaux, SEO, campagnes, pitchs, reporting client.",
    agents: [...byCategory("marketing"), ...GESTION, ...BUREAU.slice(0, 3), ...CLIENTS,
      "chasseur-de-tendances", "generateur-d-idees", "detecteur-de-motifs", "gestionnaire-de-projet",
      "pilote-de-planning", "qualificateur-de-prospects", "concepteur-de-pitch", "analyste-de-documents",
      "moteur-de-recherche", "analyseur-de-devis"],
  },
  {
    id: "education", icon: "🏫", label: "Éducation / Formation",
    description: "Parcours de formation, tutoriels, planning cours, suivi élèves, communication.",
    agents: [...GESTION.slice(0, 5), ...BUREAU, ...DOCS, ...PROCESSUS,
      "pilote-de-planning", "suiveur-de-performance", "guide-d-apprentissage", "moteur-de-motivation",
      "generateur-d-idees", "porte-parole", "pilote-de-newsletter", "pilote-des-reseaux-sociaux",
      "assistant-rh", "analyseur-de-retours", "generateur-de-questions"],
  },
  {
    id: "bien-etre", icon: "🧘", label: "Bien-être / Coaching",
    description: "Agenda clients, communication, avis, contenus, facturation simple.",
    agents: [...GESTION.slice(0, 5), ...BUREAU, ...CLIENTS.slice(0, 2), ...MARKETING_LOCAL,
      "pilote-de-newsletter", "stratege-seo", "generateur-de-leviers-de-prospection",
      "assistant-faq", "moteur-de-recherche", "coach", "moteur-de-motivation",
      "qualificateur-de-prospects", "lecteur-whatsapp", "generateur-de-questions"],
  },
  {
    id: "tourisme", icon: "🏞️", label: "Tourisme / Loisirs",
    description: "Réservations, marketing local, avis, planning, communication multilingue.",
    agents: [...GESTION.slice(0, 5), ...BUREAU.slice(0, 3), ...CLIENTS, ...MARKETING_LOCAL,
      "pilote-de-planning", "traitement-de-commande", "assistant-faq", "pilote-de-newsletter",
      "stratege-seo", "scenariste-video", "chasseur-de-tendances", "moteur-de-previsions",
      "lecteur-whatsapp", "porte-parole"],
  },
  {
    id: "media", icon: "📰", label: "Médias / Presse",
    description: "Génération de contenus, recherche d'infos, synthèse, planification éditoriale.",
    agents: [...BUREAU.slice(0, 3), ...DOCS, "moteur-de-raisonnement", "graphe-des-connaissances",
      "chasseur-de-tendances", "generateur-d-idees", "detecteur-de-motifs",
      "redacteur-publicitaire", "scenariste-video", "designer-visuel", "planificateur-de-contenu",
      "pilote-des-reseaux-sociaux", "pilote-de-newsletter", "stratege-seo", "porte-parole", "orateur-public",
      ...GESTION.slice(0, 4), "createur-de-glossaire", "generateur-q-r"],
  },
  {
    id: "admin", icon: "🏛️", label: "Administration publique",
    description: "Procédures, archives, FAQ citoyens, transparence, sécurité des données.",
    agents: [...BUREAU, ...DOCS, ...PROCESSUS, "graphe-des-connaissances", "nettoyeur-de-donnees",
      "analyste-de-risques", "porte-parole", "pilote-de-newsletter", "assistant-rh", "pilote-de-paie",
      "suiveur-de-performance", "pilote-de-planning", "gestionnaire-de-projet",
      "tableau-de-bord-pro", "visualiseur-de-kpi", "auditeur-de-procedures", "generateur-de-questions"],
  },
];

// --- Validation + assemblage ---
const out = [];
const seenIds = new Set();
for (const s of SECTORS) {
  if (seenIds.has(s.id)) throw new Error(`Secteur en double : ${s.id}`);
  seenIds.add(s.id);
  const unknown = s.agents.filter((id) => !VALID.has(id));
  if (unknown.length) throw new Error(`Secteur « ${s.id} » : ids inconnus → ${unknown.join(", ")}`);
  const agents = [...new Set([...CORE, ...s.agents])]; // core toujours inclus, dédoublonné
  out.push({ ...s, agents, count: agents.length });
}

// Option « tous les métiers »
out.unshift({
  id: "tous", icon: "🌐", label: "Tous les métiers",
  description: "Accès complet aux 130 agents, sans filtre.",
  agents: AGENTS.map((a) => a.id), count: AGENTS.length,
});

const target = join(__dirname, "..", "data", "sectors.json");
writeFileSync(target, JSON.stringify({ count: out.length, sectors: out }, null, 2), "utf8");
console.log(`✓ ${out.length} secteurs écrits dans ${target}`);
for (const s of out) console.log(`  ${s.icon} ${s.label} — ${s.count} agents`);

// Doc markdown
let md = "# NeuralStark — Packs métiers (domaines d'activité)\n\n";
md += "> Généré par `scripts/generate-sectors.mjs`. Chaque domaine active automatiquement la\n";
md += "> sélection d'agents adaptée au métier (les 7 agents du Cœur IA sont toujours inclus).\n\n";
md += "| Domaine | Agents activés |\n|---------|----------------|\n";
for (const s of out) md += `| ${s.icon} **${s.label}** | ${s.count} |\n`;
md += "\n";
const nameOf = Object.fromEntries(AGENTS.map((a) => [a.id, a.name]));
for (const s of out.filter((x) => x.id !== "tous")) {
  md += `## ${s.icon} ${s.label}\n\n_${s.description}_\n\n`;
  md += s.agents.map((id) => `\`${nameOf[id]}\``).join(" · ") + "\n\n";
}
writeFileSync(join(__dirname, "..", "docs", "SECTEURS.md"), md, "utf8");
console.log("✓ docs/SECTEURS.md écrit");
