# Kickly — clone

Clone de démonstration de [kickly.io/app](https://www.kickly.io/app) : une application web de **pronostics football propulsés par l'IA**. Analyses de match, probabilités calculées (1/N/2, BTTS, Over/Under), scores projetés et combinés générés automatiquement.

> Projet éducatif. Les pronostics sont produits par un modèle statistique intégré, pas par un vrai flux de données. Ils ne garantissent aucun résultat. Jouez responsable — 18+.

## Fonctionnalités

- **Matchs du jour** — grille des rencontres avec pronostic IA, barre de probabilités et niveau de confiance, filtrable par jour et par ligue.
- **Pronostics IA** — tous les matchs à venir, triables par confiance, *value bet* ou horaire.
- **Détail d'un match** — verdict de l'IA, score projeté, xG, analyse rédigée automatiquement, probabilités par marché (1N2, BTTS, Over/Under 2.5).
- **Combinés** — trois paris combinés (Sécurité / Équilibré / Audacieux) construits à partir des meilleures sélections, avec cote totale et gain potentiel.
- **Ligues** — classement de force des équipes par championnat selon le modèle.
- **Coupe du Monde 2026** — favoris et probabilités de titre.

## Le moteur de prédiction

Le cœur de l'app est un modèle de **Poisson bivarié** (`src/data/predictions.ts`). Pour chaque rencontre :

1. Les buts attendus (xG) de chaque équipe dérivent de sa force d'attaque, de la solidité défensive de l'adverse, de l'avantage du terrain et de la forme récente.
2. La distribution des scores possibles est calculée, puis sommée en probabilités 1/N/2, BTTS et Over 2.5.
3. Le score le plus probable, la confiance et une cote équitable en sont déduits.

Tout est **déterministe** : mêmes équipes → mêmes pronostics à chaque chargement (aucune donnée aléatoire à l'exécution).

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- lucide-react (icônes)

## Démarrer

```bash
cd kickly
npm install
npm run dev      # serveur de dev sur http://localhost:5173
npm run build    # build de production dans dist/
npm run preview  # prévisualiser le build
```

## Structure

```
src/
  data/          # types, ligues, équipes (avec ratings), génération des matchs, moteur IA
  lib/           # helpers de formatage + store (hooks de données)
  components/    # Layout, MatchCard, PredictionBar, TeamBadge, filtres...
  pages/         # Home, Predictions, MatchDetail, Parlays, Leagues, WorldCup
```
