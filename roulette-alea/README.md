# Roulette — test d'aléa 🎲

Avant de chercher à prédire une roulette, il faut savoir **s'il y a quelque chose à prédire**.
Cet outil répond à cette question avec des chiffres : tu lui donnes la liste des numéros
sortis, il te dit si le tirage est **prévisible** ou **purement aléatoire**.

C'est l'outil de diagnostic à lancer en premier — en particulier sur une **roulette
logicielle** (une app Android, par exemple) : si elle tire ses résultats avec un générateur
aléatoire, l'animation de la roue n'est qu'un décor et **aucune analyse d'image ne pourra
jamais prédire quoi que ce soit**.

Application autonome (HTML/CSS/JS, sans dépendance). Tout est calculé dans le navigateur.

## Les quatre tests

| Test | Ce qu'il détecte |
|---|---|
| **Uniformité (χ²)** | Des numéros qui sortent trop (ou pas assez) — roue biaisée ou RNG mal réparti. |
| **Regroupement par secteur** | Deux tirages consécutifs qui tombent près l'un de l'autre **sur le cylindre**. C'est LE test qui distingue une physique exploitable d'un pur hasard. |
| **Corrélation de rang (lag-1)** | Un générateur à mémoire : chaque résultat dépend du précédent. |
| **Taux de répétition** | Une fréquence anormale de doublés immédiats. |

Chaque test donne une **p-value** : en dessous de 0,01, l'écart est trop marqué pour être
attribué au hasard. Le χ² est converti en p-value par l'approximation de Wilson–Hilferty.

## Le modèle « numéro précédent + décalage constant »

Un panneau dédié teste l'hypothèse la plus courante : *si les vitesses de rotor et de bille
sont constantes, chaque tirage tombe à un nombre fixe de cases du précédent — il suffit donc
de miser les 6 voisins du dernier numéro sorti, décalés de ce nombre.*

Ce modèle se teste **sans vidéo ni calibration** : les numéros sortis suffisent. L'app calcule
le décalage (en cases sur le cylindre) entre chaque tirage et le précédent, puis :

- affiche l'**histogramme des décalages** — un pic net trahirait un décalage constant ;
- teste l'ensemble par un **χ²** ;
- corrige le meilleur décalage du fait qu'on en a essayé 37 (**Bonferroni**) ;
- et surtout, effectue une **validation en deux moitiés** : le décalage est appris sur la
  première moitié des tirages, puis vérifié sur la seconde, qui n'a servi à rien d'autre.

### Pourquoi la validation en deux moitiés est indispensable

Sur **600 tirages purement aléatoires**, l'outil trouve un décalage sorti 25 fois au lieu des
16,2 attendues. À première vue, un signal. Après correction : p = 0,98, et la validation sur
la seconde moitié donne 18,0 % contre 16,2 % attendus (p = 0,40) — **c'était du bruit**.
En essayant 37 décalages, il s'en trouve toujours un qui semble bon.

Sur une séquence réellement construite avec un décalage fixe de 11 cases, le même test donne
p < 0,0001 et **300/300 = 100 %** en validation. Le test distingue donc bien les deux cas.

Le bouton **Exemple à décalage constant** génère cette seconde séquence pour comparaison.

## Utilisation

1. Colle tes résultats (espaces, virgules ou retours à la ligne — le `00` américain est reconnu).
2. Choisis le type de roue (37 ou 38).
3. **📊 Analyser**.

Deux boutons de démonstration permettent de voir à quoi ressemblent les deux cas :
**Exemple aléatoire** (un RNG propre) et **Exemple biaisé** (une roue à secteurs, exploitable).

> Il faut **au moins 300 tirages** pour un diagnostic fiable, 1000 c'est confortable.
> En dessous de 100, un biais modéré passe facilement inaperçu.

## Validation

Testé sur des jeux de données dont la nature est connue à l'avance :

| Jeu de données | Uniformité | Secteurs | Corrélation | Répétitions | Verdict rendu |
|---|---|---|---|---|---|
| 600 tirages RNG uniformes | p = 0,43 | p = 0,43 | p = 0,91 | p = 0,34 | ✅ purement aléatoire |
| 600 tirages à dérive locale | p < 0,0001 | 1,61 case (attendu 9,24) | ρ = 0,77 | p < 0,0001 | 🎯 prévisible |

## Lire le résultat

- **✅ Compatible avec un tirage purement aléatoire** → il n'y a pas de physique à mesurer.
  Sur une app, cela signifie un RNG : le numéro est choisi *avant* l'animation.
- **🎯 Tirages regroupés en secteurs** → il y a une physique (ou un biais) exploitable ;
  les apps [analyse de vitesse](../roulette-entrainement/) et
  [comparateur de vision](../roulette-vision/) ont du sens sur cette roue.
- **⚠️ Distribution non uniforme / structure dans la suite** → biais ou générateur défaillant,
  exploitable en connaissant l'algorithme mais pas par l'image.

> Cet outil **mesure** si un tirage est prévisible. Il ne prédit rien et ne recommande aucun pari.
