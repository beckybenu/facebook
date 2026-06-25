// Multilingue (i18n) — FR / EN. Couvre la navigation et les écrans principaux.
export const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const STR = {
  fr: {
    'nav.home': 'Accueil', 'nav.explore': 'Explorer', 'nav.inbox': 'Boîte', 'nav.profile': 'Profil',
    'home.hello': 'Bonjour,', 'home.coins': 'Tipper Coins', 'home.escrow': 'en séquestre',
    'home.now.title': '⚡ Tipper Now', 'home.now.desc': "Plus de Coca au lac ? Décrivez votre besoin, un helper proche arrive en minutes.",
    'home.now.cta': "✦ Demander avec l'IA →",
    'home.publish': 'Publier une mission', 'home.publish.desc': 'Demandez un service',
    'home.find': 'Trouver une mission', 'home.find.desc': 'Gagnez des pourboires',
    'home.map': 'Carte', 'home.map.desc': 'Autour de vous',
    'home.rank': 'Classement', 'home.rank.desc': 'Top helpers',
    'home.geo.title': 'Activez la géolocalisation', 'home.geo.desc': 'Pour voir les missions proches',
    'home.activate': 'Activer', 'home.urgent': '⚡ Urgent près de vous',
    'home.quests': '🎯 Quests · primes au résultat 🌍', 'home.recent': 'Missions récentes', 'home.seeall': 'Tout voir →',
    'auth.welcome': 'Bon retour 👋', 'auth.email': 'Email', 'auth.password': 'Mot de passe',
    'auth.signin': 'Se connecter', 'auth.new': 'Nouveau ici ?', 'auth.create': 'Créer un compte',
    'auth.title.signup': 'Créer un compte', 'auth.fullname': 'Nom complet', 'auth.createmy': 'Créer mon compte',
    'auth.already': 'Déjà inscrit ?', 'auth.tagline': 'Un coup de main, un pourboire. Entraide rémunérée entre voisins.',
    'set.title': 'Réglages', 'set.language': 'Langue', 'set.theme.light': '☀️ Thème clair', 'set.theme.dark': '🌙 Thème sombre',
    'set.theme.desc': "Apparence de l'app", 'set.sounds': '🔊 Sons', 'set.sounds.desc': 'Retours sonores au toucher',
    'set.vibration': '📳 Vibrations', 'set.vibration.desc': 'Retour haptique (mobile)', 'set.save': 'Enregistrer',
    'set.signout': 'Se déconnecter', 'set.admin': '🛠️ Back-office admin',
  },
  en: {
    'nav.home': 'Home', 'nav.explore': 'Explore', 'nav.inbox': 'Inbox', 'nav.profile': 'Profile',
    'home.hello': 'Hi,', 'home.coins': 'Tipper Coins', 'home.escrow': 'in escrow',
    'home.now.title': '⚡ Tipper Now', 'home.now.desc': 'Out of soda at the lake? Describe what you need, a nearby helper arrives in minutes.',
    'home.now.cta': '✦ Ask with AI →',
    'home.publish': 'Post a mission', 'home.publish.desc': 'Request a service',
    'home.find': 'Find a mission', 'home.find.desc': 'Earn tips',
    'home.map': 'Map', 'home.map.desc': 'Around you',
    'home.rank': 'Leaderboard', 'home.rank.desc': 'Top helpers',
    'home.geo.title': 'Enable location', 'home.geo.desc': 'To see nearby missions',
    'home.activate': 'Enable', 'home.urgent': '⚡ Urgent near you',
    'home.quests': '🎯 Quests · result-based rewards 🌍', 'home.recent': 'Recent missions', 'home.seeall': 'See all →',
    'auth.welcome': 'Welcome back 👋', 'auth.email': 'Email', 'auth.password': 'Password',
    'auth.signin': 'Sign in', 'auth.new': 'New here?', 'auth.create': 'Create an account',
    'auth.title.signup': 'Create an account', 'auth.fullname': 'Full name', 'auth.createmy': 'Create my account',
    'auth.already': 'Already registered?', 'auth.tagline': 'A helping hand, a tip. Paid mutual help between neighbours.',
    'set.title': 'Settings', 'set.language': 'Language', 'set.theme.light': '☀️ Light theme', 'set.theme.dark': '🌙 Dark theme',
    'set.theme.desc': 'App appearance', 'set.sounds': '🔊 Sounds', 'set.sounds.desc': 'Sound feedback on tap',
    'set.vibration': '📳 Vibration', 'set.vibration.desc': 'Haptic feedback (mobile)', 'set.save': 'Save',
    'set.signout': 'Sign out', 'set.admin': '🛠️ Admin back-office',
  },
};

export function detectLang() {
  const saved = localStorage.getItem('tipper_lang');
  if (saved && STR[saved]) return saved;
  const nav = (navigator.language || 'fr').slice(0, 2);
  return STR[nav] ? nav : 'fr';
}

export function makeT(lang) {
  const table = STR[lang] || STR.fr;
  return (key) => table[key] ?? STR.fr[key] ?? key;
}
