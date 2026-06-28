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

// Photo de couverture (Unsplash) — surcouche optionnelle quand il y a internet,
// le dégradé reste visible en repli si l'image ne charge pas.
const CAT_PHOTO = {
  administratif: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
  automobile: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
  epicerie: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
  immobilier: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
  petit_service: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
  loisirs: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d',
};
export const catCover = (k) => (CAT_PHOTO[k] ? `${CAT_PHOTO[k]}?auto=format&fit=crop&w=900&q=70` : null);

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
