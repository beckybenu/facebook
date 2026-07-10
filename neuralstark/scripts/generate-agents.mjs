// Génère public/data/agents.json à partir du catalogue des 130 modules NeuralStark.
// Source : liste des 130 modules validée dans la conversation (français, préfixe « Neural »).
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CATEGORIES = {
  core:         { label: "Cœur IA",                   icon: "🧠", color: "#7c3aed" },
  finance:      { label: "Finance & Gestion",         icon: "💰", color: "#22c55e" },
  rh:           { label: "RH & Équipes",              icon: "👥", color: "#f59e0b" },
  marketing:    { label: "Communication & Marketing", icon: "📢", color: "#ec4899" },
  operations:   { label: "Opérations & Production",   icon: "🛠️", color: "#3b82f6" },
  sales:        { label: "Vente & CRM",               icon: "📈", color: "#14b8a6" },
  strategy:     { label: "Stratégie & Innovation",    icon: "🧭", color: "#a855f7" },
  ai:           { label: "IA Avancée",                icon: "⚡", color: "#06b6d4" },
  productivity: { label: "Direction & Productivité",  icon: "🎯", color: "#ef4444" },
  vision:       { label: "Intelligence Visuelle",     icon: "🧬", color: "#8b5cf6" },
  knowledge:    { label: "Connaissance",              icon: "🗂️", color: "#0ea5e9" },
  dashboard:    { label: "Tableaux de Bord",          icon: "📊", color: "#10b981" },
};

// [nom (sans le préfixe « Neural »), description]
const CATALOG = {
  core: [
    ["Cerveau Central", "Moteur IA principal qui pilote toutes les décisions et orchestre les autres agents."],
    ["Écouteur Vocal", "Reconnaît la parole et la transforme en texte (transcription)."],
    ["Haut-parleur Vocal", "Génère une voix humaine pour répondre à voix haute (synthèse vocale)."],
    ["Synchronisation des Connaissances", "Met à jour automatiquement la base de connaissances avec les nouveaux documents."],
    ["Auto-ingestion", "Lit et intègre seul les fichiers déposés dans les dossiers surveillés."],
    ["Moteur de Contexte", "Garde en mémoire le contexte de la conversation pour des réponses cohérentes."],
    ["Gestionnaire de Mémoire", "Sauvegarde les discussions passées et apprend de chaque interaction."],
  ],
  finance: [
    ["Directeur Financier", "Pilote l'ensemble de la direction financière de l'entreprise."],
    ["Gardien de Trésorerie", "Surveille la trésorerie en temps réel et alerte en cas de danger."],
    ["Planificateur Budgétaire", "Crée et suit le budget annuel ou par projet."],
    ["Réducteur de Coûts", "Identifie les dépenses cachées et propose des économies."],
    ["Assistant Comptable", "Simplifie la gestion comptable quotidienne (écritures, rapprochements)."],
    ["Suiveur de KPI", "Affiche et analyse les indicateurs clés de performance."],
    ["Générateur de Devis/Factures", "Crée un devis ou une facture en 1 clic à partir d'un modèle."],
    ["Pilote de Paie", "Gère les bulletins de paie et les déclarations sociales."],
    ["Narrateur Financier", "Rédige des rapports financiers clairs et compréhensibles."],
    ["Analyste de Risques", "Détecte les risques financiers (retard de paiement, trésorerie faible…)."],
    ["Optimisateur Fiscal", "Calcule les meilleures options fiscales selon la situation locale."],
    ["Navigateur de Financement", "Trouve et propose des aides, subventions ou financements."],
    ["Moteur de Prévisions", "Prédit le chiffre d'affaires à 3, 6 ou 12 mois."],
  ],
  rh: [
    ["Chercheur de Talents", "Aide à recruter les bons profils selon les besoins."],
    ["Architecte d'Équipe", "Propose la structure idéale d'équipe (taille, rôles, hiérarchie)."],
    ["Suiveur de Performance", "Mesure la performance individuelle et collective de l'équipe."],
    ["Guide d'Apprentissage", "Crée des parcours de formation personnalisés pour les employés."],
    ["Pilote d'Intégration", "Automatise l'intégration d'un nouveau collaborateur (onboarding)."],
    ["Pilote de Désintégration", "Gère la sortie d'un employé (documents, accès, entretien)."],
    ["Architecte de Culture", "Aide à construire une culture d'entreprise forte et cohérente."],
    ["Assistant RH", "Gère les tâches quotidiennes des ressources humaines."],
    ["Moteur de Motivation", "Propose des actions pour booster l'engagement de l'équipe."],
    ["Conseiller en Carrière", "Guide chaque employé dans son évolution professionnelle."],
    ["Résolveur de Conflits", "Analyse les tensions internes et propose des solutions."],
    ["Planificateur de Succession", "Prépare la relève dans l'entreprise."],
  ],
  marketing: [
    ["Porte-parole", "Communique au nom de l'entreprise dans les échanges externes."],
    ["Pilote des Réseaux Sociaux", "Publie automatiquement sur LinkedIn, Instagram, Facebook, etc."],
    ["Pilote de Newsletter", "Crée et envoie des newsletters automatisées."],
    ["Assistant Email", "Rédige ou répond aux emails en votre nom."],
    ["Orateur Public", "Rédige et prépare des discours pour conférences ou événements."],
    ["Concepteur de Pitch", "Crée des présentations percutantes pour les investisseurs."],
    ["Rédacteur Publicitaire", "Écrit des textes de pub accrocheurs (annonces, bannières…)."],
    ["Stratège SEO", "Optimise le site et les contenus pour les moteurs de recherche."],
    ["Scénariste Vidéo", "Rédige des scénarios pour les vidéos marketing."],
    ["Designer Visuel", "Crée des visuels simples (carrousels, stories, posts)."],
    ["Boosteur d'Avis", "Relance automatiquement les clients pour demander un avis."],
    ["Générateur de Leviers de Prospection", "Crée des guides gratuits pour attirer de nouveaux clients."],
    ["Planificateur de Contenu", "Organise le calendrier éditorial sur les réseaux sociaux."],
  ],
  operations: [
    ["Traitement de Commande", "Gère automatiquement les commandes clients entrantes."],
    ["Gestionnaire de Stock", "Suit les stocks de matériaux ou produits en temps réel."],
    ["Pilote de Planning", "Organise le planning hebdomadaire ou mensuel."],
    ["Assistant Logistique", "Suit les livraisons et les retards éventuels."],
    ["Contrôleur Qualité", "Vérifie que les travaux respectent les normes."],
    ["Planificateur de Maintenance", "Programme l'entretien du matériel."],
    ["Optimisateur de Processus", "Trouve des moyens d'améliorer les méthodes de travail."],
    ["Réducteur de Gaspillage", "Identifie et réduit les pertes (matériaux, temps, énergie)."],
    ["Observateur de Sécurité", "Surveille les risques sur le chantier et alerte."],
    ["Rapporteur sur le Terrain", "Génère des comptes rendus automatiques après chaque intervention."],
    ["Gestionnaire de Projet", "Suit chaque projet de A à Z (délais, budget, tâches)."],
    ["Enregistreur de Temps", "Note automatiquement le temps passé sur chaque chantier."],
    ["Calculateur de Matériaux", "Calcule la quantité de peinture, bois, carrelage… nécessaire."],
  ],
  sales: [
    ["Coach Commercial", "Donne des conseils pour améliorer les techniques de vente."],
    ["Résumeur d'Appels", "Résume automatiquement les appels clients ou commerciaux."],
    ["Qualificateur de Prospects", "Analyse un prospect et détermine s'il est sérieux."],
    ["Génie des Prix", "Propose un prix optimal selon le coût, la concurrence et la marge."],
    ["Analyseur de Devis", "Vérifie si un devis est rentable avant envoi."],
    ["Chuchoteur Client", "Crée un profil détaillé de chaque client (préférences, historique)."],
    ["Rédacteur de Contrats", "Rédige des contrats professionnels en quelques secondes."],
    ["Moteur d'Upsell", "Propose des services complémentaires au client."],
    ["Gestionnaire d'Objections", "Prépare des réponses aux objections classiques des clients."],
    ["Historien Client", "Garde une mémoire complète de tous les échanges avec un client."],
    ["Optimisateur de Funnel de Vente", "Analyse et améliore la conversion prospect → devis → client."],
  ],
  strategy: [
    ["Conseiller", "Agit comme un coach stratégique pour le dirigeant."],
    ["Moteur Stratégique", "Propose des stratégies basées sur les données internes."],
    ["Moteur de Croissance", "Pilote activement la croissance de l'entreprise."],
    ["Concepteur d'Entreprise", "Redéfinit le modèle économique si besoin."],
    ["Explorateur de Marché", "Identifie de nouveaux marchés ou niches."],
    ["Visionnaire", "Anticipe les grandes tendances du secteur."],
    ["Routeur Stratégique", "Crée un plan stratégique annuel détaillé."],
    ["Surveillant de Concurrents", "Suit les actions des concurrents (prix, offres, communication)."],
    ["Analyste M&A", "Analyse les opportunités de fusion ou d'acquisition."],
    ["Planificateur de Cession", "Prépare la vente ou la transmission de l'entreprise."],
    ["Moteur de Décision", "Aide à prendre des décisions complexes avec analyse des options."],
    ["Détecteur de Motifs", "Trouve des schémas cachés dans les données (ex: clients qui partent)."],
    ["Simulateur de Scénarios", "Simule l'avenir selon différents choix (embauche, investissement…)."],
  ],
  ai: [
    ["Analyste de Documents", "Extrait des informations clés de PDF, devis, contrats."],
    ["Moteur de Synthèse", "Résume un long document en quelques lignes."],
    ["Générateur d'Idées", "Propose de nouvelles idées business ou services."],
    ["Moteur de Raisonnement", "Réfléchit étape par étape pour résoudre un problème."],
    ["Graphe des Connaissances", "Cartographie les liens entre clients, projets, processus."],
    ["Nettoyeur de Données", "Corrige et organise les bases de données (erreurs, doublons)."],
    ["Chasseur de Tendances", "Détecte les nouvelles tendances dans le secteur."],
    ["Assistant Juridique", "Donne des conseils juridiques rapides (droit du travail, contrats)."],
    ["Support Technique", "Résout les problèmes techniques internes (logiciels, matériel)."],
    ["Analyseur de Retours", "Analyse les retours clients, avis, réclamations."],
    ["Auto-apprenant", "Apprend seul à partir des nouveaux documents et retours."],
    ["Auto-améliorateur", "S'ajuste automatiquement pour de meilleurs résultats."],
    ["Moteur d'Optimisation", "Améliore continuellement les processus métiers."],
    ["Moteur de Recommandations", "Fait des suggestions concrètes pour améliorer l'activité."],
    ["Arbre de Décision", "Montre les différentes options possibles avec leurs conséquences."],
  ],
  productivity: [
    ["Coach", "Coache le dirigeant sur sa gestion, son stress, ses objectifs."],
    ["Assistant de Direction", "Gère les tâches du dirigeant (réunions, priorités, suivi)."],
    ["Gestionnaire de Temps", "Optimise l'emploi du temps pour gagner en productivité."],
    ["Pilote d'Agenda", "Gère le calendrier, planifie les rendez-vous."],
    ["Pilote Vocal", "Permet de dicter des commandes ou des textes à l'IA."],
    ["Générateur de Questions", "Pose des questions utiles au dirigeant pour stimuler la réflexion."],
  ],
  vision: [
    ["Analyste d'Images", "Analyse une photo de chantier et décrit ce qu'elle voit."],
    ["Créateur d'Avant/Après", "Génère automatiquement une comparaison avant/après."],
    ["Reconnaisseur de Style", "Identifie le style décoratif d'une pièce (scandinave, industriel…)."],
    ["Estimateur de Surface", "Estime la surface à peindre ou carreler à partir d'une photo."],
    ["Conseiller en Couleurs", "Propose des combinaisons de couleurs adaptées à chaque pièce."],
    ["Analyseur de Luminosité", "Analyse la lumière naturelle pour recommander des teintes."],
    ["Inspecteur de Surface", "Détecte fissures, humidité ou murs poreux sur une photo."],
    ["Éditeur de Photos de Stock", "Retouche légèrement les photos pour les rendre plus pro."],
    ["Galerie de Chantier", "Crée une galerie visuelle de toutes les réalisations."],
    ["Lecteur WhatsApp", "Lit les messages WhatsApp et en extrait les demandes clients."],
  ],
  knowledge: [
    ["Ingesteur de Connaissances", "Récolte automatiquement les documents internes pour les intégrer."],
    ["Assistant FAQ", "Répond aux questions fréquentes des employés ou clients."],
    ["Organisateur de Processus", "Centralise tous les guides et procédures internes."],
    ["Moteur de Recherche", "Recherche dans tous les documents avec compréhension sémantique."],
    ["Créateur de Glossaire", "Génère un glossaire métier à partir des documents."],
    ["Bibliothèque des Bonnes Pratiques", "Stocke les meilleures méthodes de travail de l'entreprise."],
    ["Moteur de Tutoriels", "Crée des tutoriels internes pour former l'équipe."],
    ["Générateur Q/R", "Transforme un document en questions/réponses pour l'apprentissage."],
    ["Guide de Formation", "Conçoit des parcours de formation personnalisés."],
    ["Auditeur de Procédures", "Vérifie que les procédures sont bien respectées."],
  ],
  dashboard: [
    ["Tableau de Bord Pro", "Interface visuelle qui résume l'état de l'entreprise."],
    ["Visualiseur de KPI", "Affiche les indicateurs clés sous forme de graphiques."],
    ["Surveillant de Chiffre d'Affaires", "Suit le CA en temps réel et alerte en cas de baisse."],
    ["Visualiseur de Rentabilité", "Montre la rentabilité de chaque projet ou client."],
    ["Surveillant de Stock", "Avertit quand un matériau est en rupture ou bientôt épuisé."],
    ["Suiveur de Projet", "Affiche l'avancement de chaque chantier ou projet."],
    ["Analyseur de Clients", "Classe les clients (actifs, dormants, premium) et donne des insights."],
  ],
};

function slugify(str) {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[''/]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const agents = [];
let index = 0;
for (const [catKey, items] of Object.entries(CATALOG)) {
  for (const [name, description] of items) {
    index += 1;
    const display = `Neural ${name}`;
    agents.push({
      id: slugify(name),
      number: index,
      name: display,
      shortName: name,
      category: catKey,
      categoryLabel: CATEGORIES[catKey].label,
      icon: CATEGORIES[catKey].icon,
      color: CATEGORIES[catKey].color,
      description,
      systemPrompt:
        `Tu es « ${display} », un agent IA spécialisé de la plateforme NeuralStark. ` +
        `Ta mission : ${description} ` +
        `Réponds toujours en français, de façon professionnelle, concrète et actionnable. ` +
        `Quand des extraits de documents internes te sont fournis dans le contexte, appuie-toi dessus en priorité et cite les sources. ` +
        `Si l'information n'est pas dans le contexte, dis-le clairement au lieu d'inventer.`,
    });
  }
}

if (agents.length !== 130) {
  throw new Error(`Catalogue incohérent : ${agents.length} agents au lieu de 130.`);
}

const out = {
  generatedFrom: "Conversation WhatsApp — liste des 130 modules NeuralStark",
  count: agents.length,
  categories: CATEGORIES,
  agents,
};

const target = join(__dirname, "..", "data", "agents.json");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(out, null, 2), "utf8");
console.log(`✓ ${agents.length} agents écrits dans ${target}`);
