# SwissPaints — Application ouvriers (PWA)

Reproduction de l'application Adalo **SwissPaints** (entreprise de peinture à Genève) sous forme
de **Progressive Web App** React, installable sur téléphone. Toutes les données sont
stockées **localement** (localStorage) — pas de serveur nécessaire pour la démo.

## Fonctionnalités

- **Authentification** avec 3 niveaux d'accès, comme dans l'app d'origine :
  - **Client** : utilisateur externe (accès site web, devis, réservations…)
  - **Ouvrier** : employé avec accès limité (pointage, ses chantiers, documents)
  - **Admin** : gestion complète (utilisateurs, tâches, documents)
- **Pointage / badgeuse** (« Temps de travail ») : début/fin de pointage avec
  **géolocalisation** de l'ouvrier, fiche d'heures et total hebdomadaire.
- **Chantiers / tâches** : liste en cours / terminés, description détaillée,
  statut, priorité, **localisation du chantier** (lien Google Maps), photos
  avant / après travaux.
- **Documents** publics et privés, filtrés selon le type d'utilisateur.
- **Espace administrateur** : CRUD utilisateurs, tâches (avec affectation +
  géolocalisation) et documents.
- **PWA** : installable, thème SwissPaints (rouge / noir), pensée mobile.

## Comptes de démonstration

| Rôle    | Email                    | Mot de passe |
| ------- | ------------------------ | ------------ |
| Admin   | `admin@swisspaints.ch`   | `admin`      |
| Ouvrier | `ouvrier@swisspaints.ch` | `ouvrier`    |
| Client  | `client@example.com`     | `client`     |

## Démarrer

```bash
cd swiss_paint_app
npm install
npm run dev      # serveur de développement
npm run build    # build de production (dossier dist/)
npm run preview  # prévisualiser le build
```

## Stack

- React 18 + TypeScript + Vite
- React Router pour la navigation
- `vite-plugin-pwa` pour le mode application installable
- API Géolocalisation du navigateur

## Note

Cette version utilise un « backend » local (localStorage) pour valider l'UX
rapidement. Pour une mise en production multi-utilisateurs, brancher une vraie
API + base de données (les accès se font via `src/data/db.ts`, faciles à
remplacer par des appels réseau).
