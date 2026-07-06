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
├── index.html      # SPA : lobby + 5 jeux + page provably fair
├── css/style.css   # Thème sombre néon
└── js/
    ├── fair.js     # Tirages provably fair (HMAC-SHA256, graines, nonce)
    ├── wallet.js   # Portefeuille en crédits virtuels
    ├── ui.js       # Navigation, toasts, historique, flux simulé
    ├── slots.js    # Machine à sous
    ├── crash.js    # Crash (canvas)
    ├── dice.js     # Dice
    ├── mines.js    # Mines
    └── plinko.js   # Plinko (canvas)
```
