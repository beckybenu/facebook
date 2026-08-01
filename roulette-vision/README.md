# Roulette Vision — comparateur de méthodes 👁️

App jumelle de [`roulette-entrainement`](../roulette-entrainement/). Ici, **deux algorithmes
de vision par ordinateur analysent la même vidéo en même temps**, et l'app compare leurs
mesures — pour voir laquelle est la plus fiable, et pourquoi.

Application autonome (HTML/CSS/JS, sans dépendance, aucune bibliothèque de vision).
La vidéo est lue **en local** : rien n'est envoyé nulle part.

## Les deux méthodes

**A · anneau + luminosité** — on balaie un cercle fixe autour du centre de la roue et on
retient le point le plus brillant (la bille), par centroïde vectoriel pondéré.
→ Rapide et très stable, mais dépend d'un centre/rayon corrects et se fait tromper par les reflets.

**B · mouvement + ajustement de cercle** — on compare chaque image à la précédente pour ne
garder que ce qui **bouge et qui est clair**, puis on ajuste un cercle par **moindres carrés
(méthode de Kåsa)** sur la trajectoire accumulée de la bille.
→ Le **centre et le rayon de la roue sont déduits automatiquement** : aucune calibration
manuelle. En contrepartie, c'est sensible aux mouvements parasites (main du croupier,
caméra qui bouge).

## Ce que l'app affiche

- Le **cercle détecté automatiquement** et le nuage de trajectoire, superposés à la vidéo.
- La **vitesse de la bille** (m/s et tours/s) mesurée par chaque méthode, en direct.
- Les **deux courbes de décélération** superposées (bleu = A, rose = B).
- Un tableau de **comparaison** : vitesse moyenne, **bruit** (à-coups image à image),
  nombre d'images exploitées, calibration requise — et un verdict de concordance.

## Résultats sur banc de test

Validée sur une vidéo synthétique (bille à 8 rad/s sur un rayon de 170 px, centre en 200,200) :

| Mesure | Valeur réelle | Méthode A | Méthode B |
|---|---|---|---|
| Vitesse bille | 2,40 m/s | 2,40 | 2,43 |
| Tours par seconde | 1,273 | 1,28 | 1,28 |
| Centre détecté | (200, 200) | — | (198, 196) auto |
| Rayon détecté | 170 px | — | 170 px auto |

Concordance entre les deux méthodes : **1,2 %**. La méthode A ressort la plus stable
(bruit 0,013 contre 0,119), ce qui est logique : elle est contrainte à un cercle, là où la
détection de mouvement subit la gigue pixel.

## Utilisation

1. **📷 Caméra live** pour analyser ta propre roue en direct, ou charge une vidéo
   (**vue de dessus la plus nette possible**).
2. Lance la **lecture**, puis clique **🔍 Analyser**.
3. Après ~40 points de trajectoire, le cercle s'ajuste tout seul et les deux méthodes
   se mettent à mesurer en parallèle.

### Mode live sur sa propre roulette

Cette app est la plus pratique en direct : elle **n'a besoin d'aucune calibration**, le centre
et le rayon de la roue sont déduits de la trajectoire de la bille. L'écran reste allumé
pendant la mesure (Wake Lock) et aucune image ne quitte l'appareil.

- **HTTPS obligatoire** (adresse GitHub Pages) — la caméra est bloquée en `file://`.
- Téléphone **stable et au-dessus de la roue** : la méthode B ajuste un cercle sur la
  trajectoire, une caméra qui bouge fausse l'ajustement.
- Lumière homogène, peu de reflets ; **60 i/s** si possible.
- Surveille le **résidu moyen** affiché : quelques pixels = bon ajustement, beaucoup =
  détection parasitée (main, reflet, caméra qui bouge).

> Outil d'**analyse et d'apprentissage** : il sert à mesurer la physique d'une roue filmée
> et à comparer des algorithmes de vision — pas à prédire un gain.
