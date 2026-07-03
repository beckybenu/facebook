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

## Deux modes de fonctionnement

- **Local** (par défaut) : données stockées sur l'appareil (localStorage) — idéal
  pour la démo, aucune installation.
- **Cloud** : données **partagées entre tous les appareils** via le serveur
  `swiss_paint_backend` (pointages en temps réel pour l'admin, etc.). Depuis l'app :
  **Profil → Connexion serveur**, coller l'URL du serveur, se reconnecter.

Le choix se fait à l'exécution : `src/data/db.ts` lit/écrit le cache distant
(`src/data/remote.ts`) en mode cloud, sinon localStorage. Aucune reconstruction
nécessaire pour connecter un serveur.

Voir `swiss_paint_backend/README.md` pour déployer le backend gratuitement (Render).
