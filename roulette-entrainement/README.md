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

## Prédiction — secteur de 6 numéros 🔮

Pendant qu'un tirage tourne (mode Simulateur), clique **🔮 Prédire** (ou touche **P**) :
l'app extrapole la physique à partir des vitesses actuelles du plateau et de la bille,
calcule la case d'arrivée idéale, et annonce un **secteur de 6 numéros** — le numéro
prédit et ses **5 voisins sur le cylindre** (adjacence physique, pas l'ordre 1-2-3).
Le secteur est surligné en or sur la roue.

Quand la bille se pose, l'app compare : ✅ dans le secteur / ❌ raté (avec l'écart en
cases), et tient un **score de réussite** cumulé — pour t'entraîner à annoncer de plus
en plus tôt. Un léger **rebond aléatoire (scatter)** est simulé à la chute (comme en
vrai), d'où un *secteur* plutôt qu'un seul numéro garanti : on vise ~70-80 % de réussite.

> Astuce : en jeu réel, prédis sur les **derniers tours de bille**, c'est là que
> l'extrapolation est la plus fiable.

### 🔬 Expérience : l'historique suffit-il à prédire ?

Une idée répandue veut qu'en observant une table pendant quelques tours, on puisse ensuite
prédire les suivants « d'après la rotation ». Le bouton **🔬 Historique seul vs observation**
tranche la question en simulant 300 tirages et en comparant deux prédicteurs, chacun
annonçant un secteur de 6 numéros :

- **A · historique seul** — connaît tous les tours précédents et la position du rotor au
  repère à l'ouverture des paris, mais **ne voit pas le tour en cours**.
- **B · observation du tour en cours** — mesure les vitesses pendant que la bille tourne.

Résultat typique, sur une roue dont la physique est *parfaitement* connue :

| Prédicteur | Réussite | Référence |
|---|---|---|
| A · historique seul | ~14 % | hasard = 16,2 % |
| B · observation du tour | ~79 % | — |

**Conclusion** : l'historique sert à **calibrer** la roue (Δt, décalage), pas à deviner le tour
suivant. Chaque tour a sa propre vitesse de lancer, que les précédents n'annoncent pas — il
faut mesurer *le tour en cours*. C'est justement ce que la fermeture des paris empêche sur
une table commerciale.

### 📷 Caméra live — analyser sa propre roulette

En mode 🎬, le bouton **📷 Caméra live** ouvre la caméra arrière du téléphone et applique le
suivi automatique **en direct** sur ta vraie roue. L'écran est maintenu allumé pendant la
mesure (Wake Lock). Rien n'est envoyé : tout est traité sur l'appareil.

**Conditions pour que ça marche :**

- **HTTPS obligatoire** — utilise l'adresse GitHub Pages, la caméra est bloquée sur un
  fichier ouvert en local (`file://`).
- **Filme de dessus**, téléphone stable (trépied, pile de livres) : le centre de la roue ne
  doit pas bouger, sinon la calibration se décale.
- **Lumière homogène**, éviter les reflets sur le bois : la bille est détectée comme le point
  le plus brillant, un reflet fixe la ferait dérailler.
- Le **zéro vert** doit rester visible : c'est lui qui sert de repère pour la vitesse du plateau.
- La bille est **plus fiable sur ses derniers tours** (elle ralentit) ; à pleine vitesse, une
  caméra 30 i/s échantillonne trop peu. Filme en **60 i/s** si ton téléphone le permet.

Ensuite : **🎯 Calibrer** (3 clics : centre, piste de la bille, anneau des numéros) puis
**🤖 Suivi auto**.

### Mode 🤖 Auto (simulateur, 100 % automatique)

Dans le simulateur, clique **🤖 Démo auto** : l'app enchaîne les tirages toute seule,
**prédit automatiquement** au bon moment (≈ 2 tours de bille avant la chute), vérifie le
résultat et **recommence** — tu ne touches à rien. Choisis un nombre de tirages ou coche
**en boucle**, et regarde la **précision monter en direct** (score cumulé). Idéal pour
voir la méthode tourner et juger le taux de réussite sur beaucoup de coups.

### Auto-calibrage (mode 🎬, automatique)

En mode vidéo, le **délai de chute Δt** et le **décalage** s'apprennent **tout seuls** à
partir de tes tirages réels (coche *auto-calibrage*, activée par défaut) :

- **Δt** est mesuré automatiquement comme le temps entre ton clic **Prédire** (la bille
  décroche) et ton clic **Résultat** (la bille est posée), puis moyenné.
- Le **décalage** est ajusté à chaque tirage selon l'écart entre le secteur prédit et le
  numéro réellement sorti.

Une ligne *Calibrage : Δt≈… · décalage≈… · N tirages* montre la convergence. Après une
dizaine de tirages sur la **même roue/le même croupier**, les constantes se stabilisent
et les prédictions deviennent plus fiables.

### Prédiction sur vraie vidéo (mode 🎬)

Le mode **Vidéo externe** ajoute un prédicteur « visual ballistics » utilisable sur de
vraies roulettes (vidéo ou live à côté) :

1. **Réglages** : type de roue (37 européenne / 38 américaine), sens du rotor,
   **délai de chute Δt** (temps entre le décrochage de la bille et l'immobilisation),
   et **décalage** (constante propre à la roue/au croupier — laissée à l'auto-calibrage).
2. Tu tapes le **plateau (F)** et la **bille (J)** en rythme sur la vidéo.
3. Au **dernier passage de la bille sur ton repère** (juste avant qu'elle décroche), tu
   cliques **🔮 Prédire** et tu choisis le **numéro alors au repère**.
4. L'app projette : pendant Δt, le rotor avance de `ω_rotor·Δt` cases → elle en déduit
   la case d'arrivée et annonce le **secteur de 6 numéros**.
5. À l'arrivée, tu cliques **Résultat** et entres le numéro gagnant : verdict, **score**,
   et le **décalage s'affine automatiquement** (auto-calibrage) au fil des tirages.

> ⚠️ La prédiction de roulette réelle reste **approximative** (roue inclinée, rebonds,
> variations du croupier). Cet outil est fait pour **comprendre et t'entraîner à la
> méthode**, pas pour garantir un gain. À utiliser de façon responsable.

## Deux modes

- **🎡 Simulateur** — une roulette animée (plateau + bille qui décélère réellement
  et tombe dans une case). Idéal pour t'entraîner : lance un tirage et tape en rythme.
- **🎬 Vidéo externe** — masque le simulateur ; ouvre ta propre vidéo de roulette à
  côté, tape en rythme, mesure et **prédis** (voir ci-dessus).

## Comment mesurer

À chaque **tour complet**, tape une fois :

- **Plateau** → bouton bleu ou touche **F**
- **Bille** → bouton vert ou touche **J**

Les deux canaux sont indépendants : tu peux mesurer les deux en même temps (une main
sur F, une sur J). Dans le simulateur, **Espace** lance/arrête le tirage.

## Personnalisation

Séquence des numéros, physique du simulateur (vitesses initiales, décélérations) et
géométrie de la roue se règlent en haut du `<script>` dans `index.html`.
