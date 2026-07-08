// Tipper AI — compose une demande à partir d'une phrase en langage naturel.
// Heuristique locale (zéro dépendance), multilingue FR/EN/ES/DE/IT.

const CATS = [
  { key: 'epicerie', kind: 'instant', icon: '🛒', base: 8,
    kw: ['coca', 'cola', 'boisson', 'soda', 'bière', 'biere', 'eau', 'cigarette', 'clope', 'tabac', 'marlboro', 'pain', 'lait', 'courses', 'glace', 'snack', 'sandwich', 'pizza', 'café', 'cafe', 'apéro', 'apero', 'chips',
      'drink', 'beer', 'water', 'cigarettes', 'bread', 'milk', 'grocery', 'groceries', 'coffee', 'coke', 'snack',
      'bebida', 'cerveza', 'agua', 'cigarrillos', 'pan', 'leche', 'compra', 'refresco',
      'getränk', 'getrank', 'bier', 'wasser', 'zigaretten', 'brot', 'milch', 'einkauf', 'kaffee',
      'bevanda', 'birra', 'acqua', 'sigarette', 'pane', 'latte', 'spesa'] },
  { key: 'automobile', kind: 'quest', icon: '🚗', base: 1500,
    kw: ['voiture', 'auto', 'véhicule', 'vehicule', 'moto', 'scooter', 'mercedes', 'bmw', 'audi', 'tesla', 'vends ma', 'vendre ma', 'acheteur',
      'car', 'vehicle', 'motorbike', 'sell my', 'buyer',
      'coche', 'carro', 'vehículo', 'vender mi', 'comprador',
      'wagen', 'fahrzeug', 'motorrad', 'verkaufen',
      'macchina', 'veicolo', 'vendere'] },
  { key: 'immobilier', kind: 'quest', icon: '🏠', base: 300,
    kw: ['appartement', 'appart', 'studio', 'maison', 'louer', 'location', 'immobilier', 'colocation', 'logement', 'local',
      'apartment', 'flat', 'house', 'rent', 'rental', 'lease', 'roommate',
      'apartamento', 'piso', 'casa', 'alquilar', 'alquiler',
      'wohnung', 'haus', 'mieten', 'miete',
      'appartamento', 'monolocale', 'affittare', 'affitto'] },
  { key: 'petit_service', kind: 'standard', icon: '🔧', base: 40,
    kw: ['meuble', 'ikea', 'monter', 'bricolage', 'déménage', 'demenage', 'déménagement', 'demenagement', 'jardin', 'tondre', 'peinture', 'réparer', 'reparer', 'chien', 'promener', 'garde', 'babysitter', 'ménage', 'menage',
      'furniture', 'assemble', 'move', 'moving', 'garden', 'paint', 'dog', 'walk', 'babysit', 'cleaning', 'repair', 'handyman',
      'mueble', 'montar', 'mudanza', 'jardín', 'pintura', 'perro', 'pasear', 'limpieza', 'reparar',
      'möbel', 'mobel', 'aufbauen', 'umzug', 'garten', 'malen', 'hund', 'reinigung', 'reparieren',
      'mobile', 'montare', 'trasloco', 'giardino', 'pittura', 'cane', 'pulizia', 'riparare'] },
  { key: 'administratif', kind: 'standard', icon: '📋', base: 70,
    kw: ['impôt', 'impot', 'déclaration', 'declaration', 'papier', 'dossier', 'administratif', 'traduction', 'cv', 'lettre', 'comptable', 'taxes',
      'tax', 'paperwork', 'document', 'translation', 'resume', 'letter', 'accountant', 'admin',
      'impuesto', 'papeleo', 'documento', 'traducción', 'currículum', 'carta',
      'steuer', 'unterlagen', 'dokument', 'übersetzung', 'lebenslauf', 'brief',
      'tasse', 'documenti', 'traduzione', 'curriculum'] },
  { key: 'loisirs', kind: 'standard', icon: '🎉', base: 20,
    kw: ['tennis', 'foot', 'sport', 'jouer', 'concert', 'sortie', 'jeu', 'partenaire', 'padel', 'cours', 'guitare', 'photographe',
      'football', 'soccer', 'play', 'game', 'partner', 'lesson', 'guitar', 'photographer',
      'fútbol', 'futbol', 'deporte', 'jugar', 'concierto', 'juego', 'compañero', 'clase', 'guitarra', 'fotógrafo',
      'fußball', 'fussball', 'sport', 'spielen', 'konzert', 'spiel', 'unterricht', 'gitarre', 'fotograf',
      'calcio', 'giocare', 'concerto', 'gioco', 'lezione', 'chitarra', 'fotografo'] },
];

const URGENT = ['urgent', 'vite', 'maintenant', 'tout de suite', 'ce soir', 'rapidement', 'asap', 'là', 'now', 'pressé', 'presse',
  'fast', 'tonight', 'quickly', 'right now', 'rápido', 'rapido', 'ahora', 'esta noche', 'dringend', 'schnell', 'jetzt', 'heute abend', 'veloce', 'adesso', 'stasera'];
const PLACES = ['lac', 'plage', 'parc', 'bureau', 'maison', 'gare', 'piscine', 'montagne', 'terrasse', 'chalet', 'festival', 'camping',
  'lake', 'beach', 'park', 'office', 'home', 'station', 'pool', 'mountain',
  'lago', 'playa', 'parque', 'oficina', 'piscina', 'see', 'strand', 'büro', 'spiaggia'];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function extractAmount(t) {
  const m = t.replace(/'/g, '').match(/(\d[\d\s]{0,9})\s*(chf|fr|francs|balles|€|euros?|\$|usd|£|pounds?)?/i);
  if (m && /chf|fr|franc|balle|€|euro|\$|usd|£|pound|🪙|coins?/i.test(m[0])) {
    const n = parseInt(m[1].replace(/\s/g, ''), 10);
    if (n > 0) return n;
  }
  return null;
}

export function draftMission(input) {
  const raw = (input || '').trim();
  const t = raw.toLowerCase();
  if (!t) return null;

  // Catégorie par score de mots-clés (toutes langues)
  let best = CATS[3], score = 0;
  for (const c of CATS) {
    const s = c.kw.reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0);
    if (s > score) { score = s; best = c; }
  }
  const place = PLACES.find((p) => t.includes(p));
  const urgent = URGENT.some((u) => t.includes(u)) || best.kind === 'instant';
  const amount = extractAmount(t);

  let kind = best.kind;
  if (/vend|vendre|acheteur|sell|vender|verkauf|vendere|trouver|recherche|déniche|denich|find|buscar|finde|trova/.test(t)
    && (best.key === 'automobile' || best.key === 'immobilier')) kind = 'quest';

  // Pourboire / prime suggéré
  let tip = best.base;
  if (kind === 'quest' && amount) tip = Math.max(Math.round(best.base / 5), Math.round(amount * 0.03)); // prime ~3% de la valeur
  if (kind === 'instant') tip = amount ? amount + 5 : best.base;

  // Titre = les mots de l'utilisateur (neutre, dans sa langue)
  const title = cap(raw.length > 60 ? raw.slice(0, 57) + '…' : raw);

  return {
    kind, category: best.key, icon: best.icon, title,
    tip: Math.round(tip), urgent, place: place || null,
    value: amount || null, description: cap(raw),
  };
}

export const KIND_META = {
  instant: { label: 'Tipper Now', emoji: '⚡', tint: '#ff7a45', tagline: 'Tout de suite, près de vous' },
  quest: { label: 'Tipper Quest', emoji: '🎯', tint: '#8b5cff', tagline: 'Prime au résultat · mondial' },
  standard: { label: 'Demande', emoji: '🤝', tint: '#38d6ff', tagline: 'Service entre particuliers' },
};

// Locale navigateur pour la dictée vocale, selon la langue de l'app
export const voiceLocale = (lang) => ({ fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE', it: 'it-IT' }[lang] || 'fr-FR');
