# ☄️ NovaSpin — Casino de démonstration (crédits virtuels)

Plateforme de casino **100 % démo** dans le style des crypto-casinos modernes :
interface sombre, jeux instantanés et système « provably fair » vérifiable.

> ⚠️ **Aucun argent réel.** Les crédits Ⓝ sont fictifs et rechargeables à volonté.
> Ce projet est une démonstration technique et pédagogique — il ne contient aucun
> système de dépôt, de retrait ou de paiement, et n'est affilié à aucun casino en ligne.
> L'exploitation d'un vrai casino en ligne exige une licence de jeu dans chaque juridiction visée.

## 🎮 Jeux inclus

| Jeu | Description |
|---|---|
| 🎰 **Machine à sous** | 3 rouleaux × 3 lignes, 5 lignes de paiement, jackpot ×500, animation de spin |
| 🚀 **Crash** | Courbe de multiplicateur en temps réel, encaissement avant l'explosion, historique des rounds |
| 🎲 **Dice** | Curseur de cible 2–98, mode sous / au-dessus, multiplicateur jusqu'à ×49,5 |
| 💣 **Mines** | Grille 5×5, 1 à 24 mines, encaissement progressif, multiplicateurs combinatoires |
| 🔻 **Plinko** | 12 rangées de picots, 3 niveaux de risque, gains jusqu'à ×110 |

## 🌐 Mode en ligne (multijoueur)

Un serveur temps réel (Node.js pur, zéro dépendance) permet de jouer **connecté** :

- **Rounds Crash partagés** : tous les joueurs connectés parient sur le même round,
  voient les mises et encaissements des autres en direct (phase de paris de 8 s,
  point de crash provably fair calculé côté serveur, hash de graine publié)
- **Chat du salon** en temps réel
- **Classement mondial** des meilleurs gains
- Des bots de démonstration (préfixés 🤖) animent les rounds
- Hors connexion, tous les jeux restent jouables en mode solo

```bash
# Lancer le serveur (port 8902 par défaut)
node casino/server/server.js

# Puis dans le site : Lobby → « Mode en ligne » → URL du serveur → Se connecter
# (en local, http://localhost:8902 est détecté automatiquement)
```

Pour un serveur public, déployez `casino/server/` sur n'importe quel hébergeur Node
(Render, Railway, Fly.io — offres gratuites) et collez l'URL dans le panneau
« Mode en ligne ». GitHub Pages n'héberge que le site statique, pas le serveur.

## ⚖️ Et une « vraie » licence de jeu ?

Une licence n'est pas un fichier à ajouter au code : c'est une autorisation légale
délivrée par un régulateur (ANJ en France, Malta Gaming Authority, Curaçao eGaming…)
à une **société** enregistrée, après audit, certification du RNG par un laboratoire
(GLI, eCOGRA…), mise en place de KYC/AML et paiement de frais importants.
En France, les jeux de casino en ligne sont interdits — seuls paris sportifs,
hippiques et poker sont autorisés sous licence ANJ. Les jeux de fournisseurs réels
(Pragmatic Play, Evolution…) ne sont accessibles qu'aux opérateurs licenciés via des
agrégateurs B2B. Ce dépôt reste donc volontairement 100 % crédits virtuels.

## ⚙️ Fonctionnalités

- **Portefeuille virtuel** persistant (localStorage) avec bouton de recharge « + 1 000 Ⓝ »
- **Provably fair** : `HMAC-SHA256(graine serveur, graine client:nonce)` via Web Crypto —
  hash de la graine serveur publié à l'avance, rotation avec révélation, journal des tirages
- **Historique des paris** global (jeu, mise, multiplicateur, gain)
- **Avantage maison ~1 %** sur Crash, Dice et Mines ; tables de gains équilibrées sur Slots et Plinko
- Interface **responsive** en français, thème néon sombre, aucune dépendance externe

## 🚀 Lancement

Aucune installation, aucun build :

```bash
cd casino
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

(ou simplement ouvrir `index.html` dans un navigateur moderne)

## 🗂️ Structure

```
casino/
├── index.html      # SPA : lobby + 5 jeux + page provably fair + mode en ligne
├── css/style.css   # Thème sombre néon
├── server/
│   ├── server.js   # Serveur multijoueur (SSE, rounds Crash partagés, chat, classement)
│   └── package.json
└── js/
    ├── fair.js     # Tirages provably fair (HMAC-SHA256, graines, nonce)
    ├── wallet.js   # Portefeuille en crédits virtuels
    ├── ui.js       # Navigation, toasts, historique, flux simulé
    ├── net.js      # Connexion au serveur (SSE + fetch), chat, classement
    ├── slots.js    # Machine à sous
    ├── crash.js    # Crash solo + multijoueur (canvas)
    ├── dice.js     # Dice
    ├── mines.js    # Mines
    └── plinko.js   # Plinko (canvas)
```
