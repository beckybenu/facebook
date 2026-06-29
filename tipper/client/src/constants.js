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
  [['pizza'], 'pizza'],
  [['sushi'], 'sushi'],
  [['café', 'cafe', 'coffee'], 'coffee'],
  [['marlboro', 'cigarette', 'clope', 'tabac', 'paquet'], 'cigarettes'],
  [['armoire', 'meuble', 'ikea', 'étagère', 'etagere', 'bibliothèque', 'bibliotheque', 'commode'], 'furniture'],
  [['déménage', 'demenage', 'déménagement', 'demenagement', 'carton', 'cartons'], 'moving-boxes'],
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

function stableLock(s) {
  let h = 0; const str = String(s || '');
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) % 100000; }
  return h;
}

export function adKeyword(ad) {
  const text = `${ad.title || ''} ${ad.description || ''}`.toLowerCase();
  for (const [terms, kw] of KW_MAP) {
    if (terms.some((t) => text.includes(t))) return kw;
  }
  return CAT_KW[ad.category] || 'help';
}

// Photo de l'annonce : la vraie photo postée sinon une photo qui colle au sujet.
export function adCover(ad) {
  if (ad.photo) return ad.photo;
  return `https://loremflickr.com/800/520/${adKeyword(ad)}?lock=${stableLock(ad.id || ad.title)}`;
}

// Photo générique d'une catégorie (sélecteur de catégories)
export const catCover = (k) => `https://loremflickr.com/600/600/${CAT_KW[k] || 'help'}?lock=${stableLock(k)}`;

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
