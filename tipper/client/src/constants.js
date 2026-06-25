export const CATEGORIES = [
  { key: 'administratif', label: 'Administratif', icon: '📋' },
  { key: 'automobile', label: 'Automobile', icon: '🚗' },
  { key: 'epicerie', label: 'Epicerie', icon: '🛒' },
  { key: 'immobilier', label: 'Immobilier', icon: '🏠' },
  { key: 'petit_service', label: 'Petit service', icon: '🔧' },
  { key: 'loisirs', label: 'Loisirs', icon: '🎉' },
];

export const catLabel = (k) => CATEGORIES.find((c) => c.key === k)?.label || k;
export const catIcon = (k) => CATEGORIES.find((c) => c.key === k)?.icon || '📌';

export const STATUS_LABEL = {
  open: 'Ouverte',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
};

export function chf(n) {
  if (n == null) return '—';
  return 'CHF ' + Number(n).toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z'));
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `il y a ${Math.floor(s / 86400)} j`;
  return d.toLocaleDateString('fr-CH');
}

export const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
