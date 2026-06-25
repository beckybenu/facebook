// Tipper AI — compose une mission à partir d'une phrase en langage naturel.
// Heuristique locale (zéro dépendance), pensée pour l'instantané et les quêtes.

const CATS = [
  { key: 'epicerie', kind: 'instant', icon: '🛒', base: 8,
    kw: ['coca', 'boisson', 'soda', 'bière', 'biere', 'eau', 'cigarette', 'clope', 'tabac', 'marlboro', 'pain', 'lait', 'courses', 'glace', 'snack', 'sandwich', 'pizza', 'café', 'cafe', 'apéro', 'apero', 'chips'] },
  { key: 'automobile', kind: 'quest', icon: '🚗', base: 1500,
    kw: ['voiture', 'auto', 'véhicule', 'vehicule', 'moto', 'scooter', 'mercedes', 'bmw', 'audi', 'tesla', 'vends ma', 'vendre ma', 'acheteur'] },
  { key: 'immobilier', kind: 'quest', icon: '🏠', base: 300,
    kw: ['appartement', 'appart', 'studio', 'maison', 'louer', 'location', 'immobilier', 'colocation', 'logement', 'local'] },
  { key: 'petit_service', kind: 'standard', icon: '🔧', base: 40,
    kw: ['meuble', 'ikea', 'monter', 'bricolage', 'déménage', 'demenage', 'déménagement', 'demenagement', 'jardin', 'tondre', 'peinture', 'réparer', 'reparer', 'chien', 'promener', 'garde', 'babysitter', 'ménage', 'menage'] },
  { key: 'administratif', kind: 'standard', icon: '📋', base: 70,
    kw: ['impôt', 'impot', 'déclaration', 'declaration', 'papier', 'dossier', 'administratif', 'traduction', 'cv', 'lettre', 'comptable', 'taxes'] },
  { key: 'loisirs', kind: 'standard', icon: '🎉', base: 20,
    kw: ['tennis', 'foot', 'sport', 'jouer', 'concert', 'sortie', 'jeu', 'partenaire', 'padel', 'cours', 'guitare', 'photographe'] },
];

const URGENT = ['urgent', 'vite', 'maintenant', 'tout de suite', 'ce soir', 'rapidement', 'asap', 'là', 'now', 'pressé', 'presse'];
const PLACES = ['lac', 'plage', 'parc', 'bureau', 'maison', 'gare', 'piscine', 'montagne', 'terrasse', 'chalet', 'festival', 'camping'];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function extractAmount(t) {
  const m = t.replace(/'/g, '').match(/(\d[\d\s]{0,9})\s*(chf|fr|francs|balles|€|euros?|\$)?/i);
  if (m && /chf|fr|franc|balle|€|euro|\$/i.test(m[0])) {
    const n = parseInt(m[1].replace(/\s/g, ''), 10);
    if (n > 0) return n;
  }
  return null;
}

export function draftMission(input) {
  const t = (input || '').toLowerCase().trim();
  if (!t) return null;

  // Catégorie par score de mots-clés
  let best = CATS[3], score = 0;
  for (const c of CATS) {
    const s = c.kw.reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0);
    if (s > score) { score = s; best = c; }
  }
  const item = best.kw.find((k) => t.includes(k));
  const place = PLACES.find((p) => t.includes(p));
  const urgent = URGENT.some((u) => t.includes(u)) || best.kind === 'instant';
  const amount = extractAmount(t);

  let kind = best.kind;
  if (/vend|vendre|acheteur|trouver|recherche un|déniche|denich/.test(t) && (best.key === 'automobile' || best.key === 'immobilier')) kind = 'quest';

  // Pourboire / prime suggéré
  let tip = amount ? Math.max(1, Math.round(amount * (kind === 'quest' ? 0.03 : 0.0))) : 0;
  if (kind === 'quest' && amount) tip = Math.max(best.base / 5, Math.round(amount * 0.03)); // prime ~3% de la valeur
  if (!tip) tip = best.base;
  if (kind === 'instant') tip = amount ? amount + 5 : best.base;

  // Titre
  let title;
  if (kind === 'instant') title = `Livraison ${item ? cap(item) : 'express'}${place ? ' au ' + place : ''}`;
  else if (best.key === 'automobile') title = `Trouver un acheteur ${item ? 'pour ma ' + item : 'pour mon véhicule'}`;
  else if (best.key === 'immobilier') title = `Trouver ${item || 'un logement'} à louer`;
  else title = cap(t.slice(0, 48));

  const desc = kind === 'instant'
    ? `J'ai besoin de « ${input} »${place ? ` (je suis au ${place})` : ''}. Qui peut me l'apporter rapidement ? Pourboire à l'arrivée.`
    : kind === 'quest'
      ? `${cap(input)}. J'offre une prime à celui qui trouve la bonne personne / solution. Paiement garanti en séquestre.`
      : `${cap(input)}.`;

  return {
    kind, category: best.key, icon: best.icon, title,
    tip: Math.round(tip), urgent, place: place || null, value: amount || null,
    description: desc,
  };
}

export const KIND_META = {
  instant: { label: 'Tipper Now', emoji: '⚡', tint: '#ff7a45', tagline: 'Tout de suite, près de vous' },
  quest: { label: 'Tipper Quest', emoji: '🎯', tint: '#8b5cff', tagline: 'Prime au résultat · mondial' },
  standard: { label: 'Mission', emoji: '🤝', tint: '#38d6ff', tagline: 'Service entre particuliers' },
};
