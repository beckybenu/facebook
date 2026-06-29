export const CATEGORIES = [
  { key: 'administratif', label: 'Administratif', icon: '📋', tint: '#6C8CFF' },
  { key: 'automobile', label: 'Automobile', icon: '🚗', tint: '#FF6B4A' },
  { key: 'epicerie', label: 'Épicerie', icon: '🛒', tint: '#1FB6A6' },
  { key: 'immobilier', label: 'Immobilier', icon: '🏠', tint: '#B36BFF' },
  { key: 'petit_service', label: 'Petit service', icon: '🔧', tint: '#FFB020' },
  { key: 'loisirs', label: 'Loisirs', icon: '🎉', tint: '#FF5C8A' },
];

export const catLabel = (k) => CATEGORIES.find((c) => c.key === k)?.label || k;
export const catIcon = (k) => CATEGORIES.find((c) => c.key === k)?.icon || '📌';
export const catTint = (k) => CATEGORIES.find((c) => c.key === k)?.tint || '#6C5CE7';

// Dégradés de couverture (générés localement → toujours nets, fonctionnent hors-ligne)
const CAT_GRAD = {
  administratif: 'linear-gradient(135deg,#6C8CFF 0%,#4B5BE8 100%)',
  automobile: 'linear-gradient(135deg,#FF7A50 0%,#FF4D6D 100%)',
  epicerie: 'linear-gradient(135deg,#2BD4B5 0%,#16B88A 100%)',
  immobilier: 'linear-gradient(135deg,#B98BFF 0%,#6C5CE7 100%)',
  petit_service: 'linear-gradient(135deg,#FFC24B 0%,#FF8A3D 100%)',
  loisirs: 'linear-gradient(135deg,#FF7AA8 0%,#B36BFF 100%)',
};
export const catGradient = (k) => CAT_GRAD[k] || 'linear-gradient(135deg,#7C6CF0 0%,#5A4FE0 100%)';

// ── Photo qui reflète la demande précise ──
// On déduit un mot-clé du titre/description de l'annonce, puis on charge
// une photo correspondante (LoremFlickr, par mot-clé). Le dégradé de
// catégorie reste visible en repli si la photo ne charge pas.

// Mot-clé par catégorie (repli quand rien de plus précis n'est trouvé)
const CAT_KW = {
  administratif: 'documents', automobile: 'car', epicerie: 'groceries',
  immobilier: 'apartment', petit_service: 'tools', loisirs: 'party',
};

// Termes (FR) repérés dans le texte → mot-clé photo (EN, compris par Flickr).
// Du plus spécifique au plus général ; le premier trouvé gagne.
const KW_MAP = [
  [['coca', 'cola', 'soda', 'canette', 'boisson', 'limonade'], 'cola'],
  [['biere', 'bière', 'apéro', 'apero'], 'beer'],
  [['pizza', 'sushi', 'burger', 'repas', 'manger'], 'pizza'],
  [['café', 'cafe', 'coffee'], 'coffee'],
  [['marlboro', 'cigarette', 'clope', 'tabac', 'paquet'], 'cigarettes'],
  [['armoire', 'meuble', 'ikea', 'étagère', 'etagere', 'bibliothèque', 'bibliotheque', 'commode'], 'furniture'],
  [['déménage', 'demenage', 'déménagement', 'demenagement', 'carton', 'cartons'], 'moving'],
  [['perceuse', 'bricol', 'monter', 'réparer', 'reparer', 'plomberie', 'fuite', 'robinet', 'visser'], 'tools'],
  [['ménage', 'menage', 'nettoyage', 'nettoyer', 'repassage'], 'cleaning'],
  [['jardin', 'tonte', 'pelouse', 'jardinage', 'tondre', 'haie'], 'gardening'],
  [['peinture', 'peindre', 'repeindre'], 'painting'],
  [['courses', 'migros', 'coop', 'épicerie', 'epicerie', 'supermarché', 'supermarche', 'aldi', 'lidl'], 'groceries'],
  [['chien', 'promener', 'toutou', 'chiot'], 'dog'],
  [['chat', 'chaton'], 'cat'],
  [['mercedes', 'bmw', 'audi', 'voiture', 'auto', 'véhicule', 'vehicule', 'lavage', 'pneu'], 'car'],
  [['vélo', 'velo', 'bike', 'cycliste'], 'bicycle'],
  [['scooter', 'moto'], 'motorcycle'],
  [['impôt', 'impot', 'déclaration', 'declaration', 'papier', 'paperasse', 'dossier', 'cv', 'lettre'], 'documents'],
  [['studio', 'appartement', 'appart', 'logement', 'louer', 'location', 'maison', 'colocation'], 'apartment'],
  [['tennis'], 'tennis'],
  [['foot', 'football'], 'football'],
  [['guitare', 'piano', 'musique', 'batterie'], 'guitar'],
  [['photo', 'photographe', 'shooting'], 'camera'],
  [['ordinateur', 'informatique', 'wifi', 'internet', 'imprimante'], 'laptop'],
  [['garde', 'enfant', 'babysitting', 'baby'], 'babysitting'],
  [['cours', 'math', 'devoir', 'révision', 'revision', 'soutien'], 'study'],
  [['fête', 'fete', 'anniversaire', 'soirée', 'soiree', 'dj', 'mariage'], 'party'],
  [['gâteau', 'gateau', 'pâtisserie', 'patisserie', 'cuisine'], 'cake'],
];

// Détecte le sujet d'une annonce depuis son titre/description.
export function adKeyword(ad) {
  const text = `${ad.title || ''} ${ad.description || ''}`.toLowerCase();
  for (const [terms, kw] of KW_MAP) {
    if (terms.some((t) => text.includes(t))) return kw;
  }
  return CAT_KW[ad.category] || 'help';
}

// ── Notre base de visuels : 1 sujet = 1 couverture fixe et reconnaissable ──
// Toujours identique pour un même sujet (un Coca montre toujours le même visuel),
// générée localement → instantanée, hors-ligne, jamais cassée.
export const COVERS = {
  cola:        { e: '🥤', label: 'Boisson', g: 'linear-gradient(135deg,#FF5B6E 0%,#C1121F 100%)' },
  beer:        { e: '🍺', label: 'Bière', g: 'linear-gradient(135deg,#F7B733 0%,#C77B19 100%)' },
  coffee:      { e: '☕', label: 'Café', g: 'linear-gradient(135deg,#B07A53 0%,#5E3D27 100%)' },
  pizza:       { e: '🍕', label: 'Repas', g: 'linear-gradient(135deg,#FF8A50 0%,#E2342B 100%)' },
  cake:        { e: '🎂', label: 'Pâtisserie', g: 'linear-gradient(135deg,#FF9DC4 0%,#E1568E 100%)' },
  cigarettes:  { e: '🚬', label: 'Tabac', g: 'linear-gradient(135deg,#9AA3AD 0%,#545B63 100%)' },
  groceries:   { e: '🛒', label: 'Courses', g: 'linear-gradient(135deg,#2BD4B5 0%,#149174 100%)' },
  furniture:   { e: '🪑', label: 'Meuble', g: 'linear-gradient(135deg,#CDA06B 0%,#7E5126 100%)' },
  tools:       { e: '🔧', label: 'Bricolage', g: 'linear-gradient(135deg,#FFC24B 0%,#FF8A3D 100%)' },
  cleaning:    { e: '🧽', label: 'Ménage', g: 'linear-gradient(135deg,#4FC3F7 0%,#1E78D2 100%)' },
  gardening:   { e: '🌿', label: 'Jardin', g: 'linear-gradient(135deg,#7BD389 0%,#2E9E5B 100%)' },
  painting:    { e: '🎨', label: 'Peinture', g: 'linear-gradient(135deg,#A78BFA 0%,#6C5CE7 100%)' },
  moving:      { e: '📦', label: 'Déménagement', g: 'linear-gradient(135deg,#DDAE72 0%,#9A6428 100%)' },
  dog:         { e: '🐕', label: 'Animal', g: 'linear-gradient(135deg,#FFB661 0%,#E2872B 100%)' },
  cat:         { e: '🐈', label: 'Animal', g: 'linear-gradient(135deg,#C9A0DC 0%,#8E5BA6 100%)' },
  car:         { e: '🚗', label: 'Voiture', g: 'linear-gradient(135deg,#7C8AA0 0%,#374050 100%)' },
  motorcycle:  { e: '🏍️', label: 'Moto', g: 'linear-gradient(135deg,#8A93A0 0%,#3F454F 100%)' },
  bicycle:     { e: '🚲', label: 'Vélo', g: 'linear-gradient(135deg,#5FD0C5 0%,#1FA199 100%)' },
  documents:   { e: '📄', label: 'Administratif', g: 'linear-gradient(135deg,#6C8CFF 0%,#4351D8 100%)' },
  laptop:      { e: '💻', label: 'Informatique', g: 'linear-gradient(135deg,#6E7BF2 0%,#4A4FE0 100%)' },
  study:       { e: '📚', label: 'Cours', g: 'linear-gradient(135deg,#6FB1FC 0%,#3A6FD8 100%)' },
  apartment:   { e: '🏠', label: 'Logement', g: 'linear-gradient(135deg,#B98BFF 0%,#6C5CE7 100%)' },
  tennis:      { e: '🎾', label: 'Sport', g: 'linear-gradient(135deg,#B6E84B 0%,#6BB019 100%)' },
  football:    { e: '⚽', label: 'Sport', g: 'linear-gradient(135deg,#7BD389 0%,#2E9E5B 100%)' },
  guitar:      { e: '🎸', label: 'Musique', g: 'linear-gradient(135deg,#F0A35E 0%,#C8602B 100%)' },
  camera:      { e: '📷', label: 'Photo', g: 'linear-gradient(135deg,#8A93A0 0%,#3F454F 100%)' },
  babysitting: { e: '🍼', label: 'Garde', g: 'linear-gradient(135deg,#FFB6C1 0%,#E76F9E 100%)' },
  party:       { e: '🎉', label: 'Événement', g: 'linear-gradient(135deg,#FF7AA8 0%,#B36BFF 100%)' },
  help:        { e: '🤝', label: 'Coup de main', g: 'linear-gradient(135deg,#7C6CF0 0%,#5A4FE0 100%)' },
};
export const coverFor = (key) => COVERS[key] || COVERS.help;

// Sujet final d'une annonce : choix manuel prioritaire, sinon détection auto.
export const adSubject = (ad) => (ad && ad.cover && COVERS[ad.cover] ? ad.cover : adKeyword(ad));

// Couvertures proposées au choix manuel, par catégorie (publication).
export const CATEGORY_SUBJECTS = {
  epicerie: ['cola', 'beer', 'coffee', 'pizza', 'cake', 'groceries', 'cigarettes'],
  petit_service: ['tools', 'furniture', 'cleaning', 'gardening', 'painting', 'moving'],
  automobile: ['car', 'motorcycle', 'bicycle', 'cleaning'],
  immobilier: ['apartment', 'moving', 'cleaning', 'painting'],
  administratif: ['documents', 'laptop', 'study'],
  loisirs: ['party', 'tennis', 'football', 'guitar', 'camera', 'dog', 'cat', 'babysitting'],
};

export const STATUS_LABEL = {
  open: 'Ouverte',
  in_progress: 'En cours',
  delivered: 'Livrée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
};

// Suggestion de pourboire équitable par catégorie (heuristique locale)
export const TIP_SUGGESTION = {
  administratif: 60, automobile: 150, epicerie: 10,
  immobilier: 250, petit_service: 40, loisirs: 20,
};

export function chf(n) {
  if (n == null) return '—';
  return 'CHF ' + Number(n).toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Monnaie interne : Tipper Coins
export function coin(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('fr-CH', { maximumFractionDigits: 2 }) + ' 🪙';
}
export const pts = (n) => `${Number(n || 0).toLocaleString('fr-CH')} pts`;

export function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') || iso.includes('+') ? '' : 'Z'));
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 0) return 'à venir';
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `il y a ${Math.floor(s / 86400)} j`;
  return d.toLocaleDateString('fr-CH');
}

export function dateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

// Avatar déterministe — nuances de gris neutres (style Uber)
export function avatarColor(name = '') {
  const palette = ['#2b2e37', '#3a3d46', '#4a4e59', '#5b6072', '#22242b'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % palette.length;
  return palette[h];
}
