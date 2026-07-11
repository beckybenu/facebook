// Cockpit — le mode « pilotage d'entreprise » de NeuralStark.
// L'IA analyse la base de connaissances, produit un briefing du jour et un plan
// d'actions que l'entrepreneur peut déléguer à l'assistant en un clic.

const LS_ACTIONS = "neuralstark:actions:v1";
const LS_COMPANY = "neuralstark:company:v1";

export function getCompanyName() {
  return localStorage.getItem(LS_COMPANY) || "";
}
export function setCompanyName(name) {
  localStorage.setItem(LS_COMPANY, (name || "").slice(0, 80));
}

// ---------- Analyse de la base de connaissances ----------
// Extraction simple : montants, devis/factures repérés dans les documents.
export function extractInsights(rag) {
  const amounts = [];
  let quoteDocs = 0, invoiceDocs = 0;
  for (const doc of rag.documents) {
    const full = doc.chunks.map((c) => c.text).join("\n");
    const isQuote = /devis/i.test(doc.name + " " + full.slice(0, 400));
    const isInvoice = /facture/i.test(doc.name + " " + full.slice(0, 400));
    if (isQuote) quoteDocs += 1;
    if (isInvoice) invoiceDocs += 1;
    const re = /(\d{1,3}(?:[\s'.,]\d{3})*(?:[.,]\d{2})?)\s?(CHF|EUR|€)/gi;
    let m;
    while ((m = re.exec(full))) {
      const val = parseFloat(m[1].replace(/[\s']/g, "").replace(",", "."));
      if (Number.isFinite(val) && val > 10) amounts.push({ value: val, currency: m[2].toUpperCase() === "€" ? "EUR" : m[2].toUpperCase(), source: doc.name });
    }
  }
  const total = amounts.reduce((s, a) => s + a.value, 0);
  const top = amounts.slice().sort((a, b) => b.value - a.value)[0] || null;
  const currency = top?.currency || "CHF";
  const stats = rag.stats();
  return { documents: stats.documents, chunks: stats.chunks, amounts: amounts.length, total, top, currency, quoteDocs, invoiceDocs };
}

// ---------- Briefing du jour ----------
export function buildBriefing({ sector, insights, actionsPending }) {
  const fmt = (n) => n.toLocaleString("fr-CH", { maximumFractionDigits: 0 });
  const today = new Date().toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" });
  const lines = [];
  lines.push(`**Briefing du ${today}**`);
  if (sector && sector.id !== "tous") {
    lines.push(`Espace configuré pour **${sector.icon} ${sector.label}** — ${sector.count} agents actifs en coulisses.`);
  }
  if (insights.documents === 0) {
    lines.push(`⚠️ **Votre base de connaissances est vide.** Ajoutez vos devis, factures et documents internes (panneau de droite) : c'est le carburant qui me permet de gérer votre activité.`);
  } else {
    lines.push(`📂 Je surveille **${insights.documents} document${insights.documents > 1 ? "s" : ""}** (${insights.chunks} extraits indexés)${insights.quoteDocs ? `, dont ${insights.quoteDocs} devis` : ""}${insights.invoiceDocs ? ` et ${insights.invoiceDocs} facture(s)` : ""}.`);
    if (insights.amounts > 0) {
      lines.push(`💰 **${insights.amounts} montants détectés** dans vos documents, pour un volume d'environ **${fmt(insights.total)} ${insights.currency}**${insights.top ? ` (plus gros montant : ${fmt(insights.top.value)} ${insights.top.currency} dans « ${insights.top.source} »)` : ""}.`);
    }
  }
  if (actionsPending > 0) {
    lines.push(`✅ **${actionsPending} action${actionsPending > 1 ? "s" : ""} en attente** dans votre plan du jour — déléguez-les moi d'un clic, je m'en occupe.`);
  } else {
    lines.push(`✨ Plan d'actions à jour. Posez-moi une question ou ajoutez des documents pour aller plus loin.`);
  }
  return lines.join("\n\n");
}

// ---------- Plan d'actions par métier ----------
// Chaque action = { id, title, agentId, prompt } — prompt est envoyé à l'assistant
// quand l'entrepreneur clique « Déléguer à l'IA ».
const GENERIC_ACTIONS = [
  { id: "relance-devis", title: "Relancer les devis sans réponse", agentId: "assistant-email",
    prompt: "Rédige un email de relance courtois pour un devis envoyé il y a une semaine et resté sans réponse." },
  { id: "tresorerie", title: "Faire le point trésorerie", agentId: "gardien-de-tresorerie",
    prompt: "Fais le point sur la trésorerie et les montants en jeu d'après mes documents." },
  { id: "post-social", title: "Publier sur les réseaux sociaux", agentId: "pilote-des-reseaux-sociaux",
    prompt: "Propose un post pour les réseaux sociaux qui met en valeur mon activité cette semaine." },
  { id: "avis-clients", title: "Demander des avis clients", agentId: "boosteur-d-avis",
    prompt: "Rédige un message pour demander un avis Google à un client satisfait." },
  { id: "kpi-semaine", title: "Analyser les chiffres de la semaine", agentId: "suiveur-de-kpi",
    prompt: "Analyse les indicateurs et montants présents dans mes documents et dis-moi ce qui mérite mon attention." },
];

const SECTOR_ACTIONS = {
  peinture: [
    { id: "planning-chantiers", title: "Planifier les chantiers de la semaine", agentId: "pilote-de-planning",
      prompt: "Aide-moi à organiser le planning des chantiers de la semaine d'après mes documents." },
    { id: "calcul-materiaux", title: "Calculer les matériaux du prochain chantier", agentId: "calculateur-de-materiaux",
      prompt: "Calcule la quantité de peinture nécessaire pour le prochain chantier mentionné dans mes documents." },
    { id: "avant-apres", title: "Publier un avant/après de réalisation", agentId: "createur-d-avant-apres",
      prompt: "Prépare la légende d'une publication avant/après pour une réalisation récente." },
  ],
  avocats: [
    { id: "synthese-dossiers", title: "Synthétiser les dossiers en cours", agentId: "moteur-de-synthese",
      prompt: "Fais une synthèse des dossiers et documents présents dans ma base de connaissances." },
    { id: "verif-contrats", title: "Vérifier les contrats en attente", agentId: "redacteur-de-contrats",
      prompt: "Liste les points de vigilance à vérifier dans les contrats de mes documents." },
    { id: "newsletter-juridique", title: "Préparer la newsletter juridique", agentId: "pilote-de-newsletter",
      prompt: "Propose un sommaire de newsletter juridique pour mes clients ce mois-ci." },
  ],
  medecin: [
    { id: "rappels-rdv", title: "Préparer les rappels de rendez-vous", agentId: "pilote-d-agenda",
      prompt: "Rédige un message type de rappel de rendez-vous pour mes patients." },
    { id: "faq-patients", title: "Mettre à jour la FAQ patients", agentId: "assistant-faq",
      prompt: "Propose les questions/réponses les plus utiles pour la FAQ de mes patients d'après mes documents." },
  ],
  commerce: [
    { id: "stock-alerte", title: "Vérifier les stocks à réapprovisionner", agentId: "surveillant-de-stock",
      prompt: "D'après mes documents, quels produits ou matériaux faut-il réapprovisionner ?" },
    { id: "promo-semaine", title: "Créer la promotion de la semaine", agentId: "redacteur-publicitaire",
      prompt: "Rédige une offre promotionnelle attractive pour cette semaine." },
  ],
  restauration: [
    { id: "planning-equipe", title: "Préparer le planning de l'équipe", agentId: "pilote-de-planning",
      prompt: "Aide-moi à préparer le planning de l'équipe pour la semaine." },
    { id: "menu-social", title: "Mettre en avant le menu sur Instagram", agentId: "pilote-des-reseaux-sociaux",
      prompt: "Rédige un post Instagram appétissant pour mettre en avant le plat du jour." },
  ],
};

export function getActionPlan(sectorId, allowed) {
  const spec = SECTOR_ACTIONS[sectorId] || [];
  const merged = [...spec, ...GENERIC_ACTIONS];
  // On ne garde que les actions dont l'agent existe dans le pack métier actif.
  const plan = merged.filter((a) => !allowed || allowed.has(a.agentId)).slice(0, 6);
  return plan;
}

// ---------- Statut des actions (persisté) ----------
function loadStatus() {
  try { return JSON.parse(localStorage.getItem(LS_ACTIONS)) || {}; } catch { return {}; }
}
export function actionStatus(sectorId, actionId) {
  return (loadStatus()[sectorId] || {})[actionId] || "todo"; // todo | delegated | done
}
export function setActionStatus(sectorId, actionId, status) {
  const all = loadStatus();
  all[sectorId] = all[sectorId] || {};
  all[sectorId][actionId] = status;
  localStorage.setItem(LS_ACTIONS, JSON.stringify(all));
}
export function pendingCount(sectorId, plan) {
  return plan.filter((a) => actionStatus(sectorId, a.id) === "todo").length;
}
