# Roulette d'entraînement 🎯

Une roulette (roue de la fortune) pour s'entraîner : on fait tourner la roue et le
hasard choisit l'exercice à faire. Idéal pour la muscu, le cardio, les langues, la
musique… ou n'importe quelle liste d'exercices que tu définis.

## Utilisation

Ouvre simplement `index.html` dans un navigateur — aucune installation, aucun serveur.
Le fichier est 100 % autonome (HTML + CSS + JavaScript, sans dépendance), donc il
marche aussi tel quel sur GitHub Pages.

## Fonctionnalités

- **Roue animée** dessinée sur `<canvas>`, avec rotation réaliste (décélération douce)
  et pointeur qui désigne l'exercice tiré.
- **Personnalisable** : ajoute, supprime, mélange tes propres exercices (jusqu'à 24).
- **Listes prédéfinies** : Musculation, Cardio, Étirements, Langues, Musique.
- **Options** :
  - *Retirer après tirage* — pour enchaîner sans répétition.
  - *Son* — tic-tic pendant la rotation + jingle à l'arrivée (Web Audio, sans fichier).
  - *Minuteur* — lance un compte à rebours (20 s → 2 min) pour chronométrer l'exercice.
- **Historique** des derniers tirages.
- **Sauvegarde locale** (localStorage) : ta liste et ton historique sont conservés.

## Personnalisation

Les couleurs, les listes prédéfinies et les durées de minuteur se modifient en haut
du `<script>` dans `index.html` (constantes `COLORS`, `PRESETS`, et les `<option>` du
sélecteur de minuteur).
