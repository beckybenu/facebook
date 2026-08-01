# Roulette — analyse de vitesse 🎡📈

Outil pour **s'entraîner à mesurer la physique d'une roulette** :

- **estimer la vitesse angulaire du plateau** (tours/min) ;
- **mesurer le temps que met le plateau pour faire un tour** ;
- **mesurer la vitesse de la bille** tant qu'elle est visible ;
- **tracer l'évolution de la vitesse au cours du temps** (courbe de décélération).

Application autonome (HTML/CSS/JS, sans dépendance). Ouvre `index.html` dans un
navigateur, ou visite la version publiée sur GitHub Pages.

## Méthode de mesure

On chronomètre l'intervalle **T** entre deux passages du même repère (le haut de la
roue) :

- **Plateau** : `vitesse = 60 / T` tours/min · `vitesse angulaire = 360 / T` °/s
- **Bille** : `vitesse = 2π·R / T` m/s, où **R** est le rayon de la piste de bille
  (réglable, défaut 0,30 m)

Chaque tour mesuré est ajouté au tableau et aux graphiques ; comme le plateau et la
bille ralentissent, la suite des points dessine la **courbe de décélération**, dont
la pente moyenne (régression linéaire) est affichée.

## Deux modes

- **🎡 Simulateur** — une roulette animée (plateau + bille qui décélère réellement
  et tombe dans une case). Idéal pour t'entraîner : lance un tirage et tape en rythme.
- **🎬 Vidéo externe** — masque le simulateur ; ouvre ta propre vidéo de roulette à
  côté et tape en rythme dessus pour l'analyser.

## Comment mesurer

À chaque **tour complet**, tape une fois :

- **Plateau** → bouton bleu ou touche **F**
- **Bille** → bouton vert ou touche **J**

Les deux canaux sont indépendants : tu peux mesurer les deux en même temps (une main
sur F, une sur J). Dans le simulateur, **Espace** lance/arrête le tirage.

## Personnalisation

Séquence des numéros, physique du simulateur (vitesses initiales, décélérations) et
géométrie de la roue se règlent en haut du `<script>` dans `index.html`.
