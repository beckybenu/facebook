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
