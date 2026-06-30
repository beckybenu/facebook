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
// Thème neutre : vignettes de catégories en gris (style Uber)
export const catTint = () => '#6b7280';

// Mode de prix selon la catégorie :
// - 'tip'   : POURBOIRE SEUL, aucun prix (loisirs, administratif, petit service).
// - 'offer' : le HELPER propose le prix de l'article (épicerie). Bloqué + remboursé.
// - 'quest' : le DEMANDEUR fixe le prix de vente (auto, immo). Le helper SUGGÈRE
//             un prix (indicatif, non bloqué). Récompense = prime.
export const QUEST_CATS = ['automobile', 'immobilier'];
export const OFFER_CATS = ['epicerie'];
export const priceMode = (cat) =>
  QUEST_CATS.includes(cat) ? 'quest' : OFFER_CATS.includes(cat) ? 'offer' : 'tip';

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
