// Internationalisation légère FR / Albanais (sq), sans dépendance.
// Store minimal + hook React : la langue est mémorisée par appareil.
import { useEffect, useReducer } from 'react'

export type Lang = 'fr' | 'sq'
const KEY = 'sp_lang'

let current: Lang = (localStorage.getItem(KEY) as Lang) || 'fr'
const listeners = new Set<() => void>()

export function getLang(): Lang {
  return current
}
export function setLang(l: Lang) {
  current = l
  localStorage.setItem(KEY, l)
  listeners.forEach((f) => f())
}
export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
]

// clé -> { fr, sq }
const DICT: Record<string, { fr: string; sq: string }> = {
  // --- Navigation ---
  'nav.home': { fr: 'Accueil', sq: 'Ballina' },
  'nav.notifications': { fr: 'Notifications', sq: 'Njoftimet' },
  'nav.dashboard': { fr: 'Tableau de bord', sq: 'Paneli' },
  'nav.timesheet': { fr: 'Timbrage', sq: 'Orari' },
  'nav.absences': { fr: 'Absences', sq: 'Mungesat' },
  'nav.planning': { fr: 'Planning', sq: 'Planifikimi' },
  'nav.sites': { fr: 'Chantiers', sq: 'Kantieret' },
  'nav.vehicles': { fr: 'Véhicules', sq: 'Automjetet' },
  'nav.expenses': { fr: 'Notes de frais', sq: 'Shpenzimet' },
  'nav.quotes': { fr: 'Devis', sq: 'Ofertat' },
  'nav.board': { fr: 'Tableau blanc', sq: 'Shpalljet' },
  'nav.documents': { fr: 'Documents', sq: 'Dokumentet' },
  'nav.assistant': { fr: 'Assistant IA', sq: 'Asistenti AI' },
  'nav.reminders': { fr: 'Rappels RH', sq: 'Kujtesat' },
  'nav.admin': { fr: 'Administration', sq: 'Administrimi' },
  'nav.profile': { fr: 'Profil', sq: 'Profili' },
  'nav.alerts': { fr: 'Alertes', sq: 'Alarmet' },

  // --- Accueil ---
  'home.hello': { fr: 'Bonjour', sq: 'Përshëndetje' },
  'home.welcome': { fr: 'Bienvenue sur SwissPaints', sq: 'Mirë se vini në SwissPaints' },
  'home.workspace': { fr: 'Espace de travail', sq: 'Hapësira e punës' },
  'home.services': { fr: 'Services', sq: 'Shërbimet' },
  'home.admin': { fr: 'Administration', sq: 'Administrimi' },
  'home.adminSpace': { fr: 'Espace administrateur', sq: 'Hapësira e administratorit' },

  // --- Connexion / accueil public ---
  'auth.tagline': { fr: 'L’application de vos chantiers', sq: 'Aplikacioni i kantiereve tuaja' },
  'auth.welcome': { fr: 'Bienvenue', sq: 'Mirë se vini' },
  'auth.login': { fr: 'Se connecter', sq: 'Hyr' },
  'auth.signup': { fr: 'Inscription', sq: 'Regjistrohu' },
  'auth.email': { fr: 'Email', sq: 'Email' },
  'auth.password': { fr: 'Mot de passe', sq: 'Fjalëkalimi' },
  'auth.demo': { fr: 'Comptes de démonstration', sq: 'Llogari demonstrimi' },
  'auth.forgot': { fr: 'Mot de passe oublié ?', sq: 'Keni harruar fjalëkalimin?' },
  'auth.noAccount': { fr: 'Pas encore de compte ?', sq: 'Nuk keni llogari?' },

  // --- Rôles ---
  'role.admin': { fr: 'Administrateur', sq: 'Administrator' },
  'role.rh': { fr: 'Ressources humaines', sq: 'Burimet njerëzore' },
  'role.ouvrier': { fr: 'Employé', sq: 'Punonjës' },
  'role.sous_traitant': { fr: 'Sous-traitant', sq: 'Nënkontraktor' },
  'role.comptable': { fr: 'Comptable', sq: 'Kontabilist' },
  'role.client': { fr: 'Client', sq: 'Klient' },

  // --- Commun ---
  'common.save': { fr: 'Enregistrer', sq: 'Ruaj' },
  'common.cancel': { fr: 'Annuler', sq: 'Anulo' },
  'common.add': { fr: 'Ajouter', sq: 'Shto' },
  'common.delete': { fr: 'Supprimer', sq: 'Fshi' },
  'common.edit': { fr: 'Modifier', sq: 'Ndrysho' },
  'common.back': { fr: 'Retour', sq: 'Prapa' },
  'common.language': { fr: 'Langue', sq: 'Gjuha' },
}

export function t(key: string, lang: Lang = current): string {
  const e = DICT[key]
  if (!e) return key
  return e[lang] || e.fr
}

// Hook : renvoie { lang, setLang, t } et re-rend le composant au changement de langue.
export function useLang() {
  const [, force] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    const f = () => force()
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  }, [])
  return { lang: current, setLang, t: (key: string) => t(key, current) }
}
