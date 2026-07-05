# Kickly — clone

Clone de démonstration de [kickly.io/app](https://www.kickly.io/app) : une application web de **pronostics football propulsés par l'IA**. Analyses de match, probabilités calculées (1/N/2, BTTS, Over/Under), scores projetés et combinés générés automatiquement.

> Projet éducatif. Les pronostics sont produits par un modèle statistique et ne garantissent aucun résultat. Jouez responsable — 18+.

## Données réelles + repli démo

Au chargement, l'app interroge **TheSportsDB** (API publique, CORS ouvert) pour chaque ligue :

- `eventsnextleague` — les prochains matchs réels du calendrier
- `eventspastleague` — les derniers résultats, dont sont dérivés les ratings du modèle (attaque = buts marqués/match, défense = buts encaissés/match, forme = 5 derniers résultats)

Comportement (`src/data/api.ts` + `src/lib/DataContext.tsx`) :

- **Données live** : les ligues qui répondent affichent leurs vrais matchs, avec pronostics calculés sur les vraies statistiques.
- **Mode mixte** : les ligues sans matchs (intersaison, API partielle) conservent les données de démonstration — le badge d'en-tête l'indique.
- **Mode démo** : si l'API est totalement injoignable (hors-ligne, rate limit), l'app bascule intégralement sur le générateur déterministe. Aucune page blanche, jamais.
- Les réponses sont mises en cache 15 min dans `localStorage` pour respecter le rate limit.

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
