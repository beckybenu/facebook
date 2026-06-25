# 💸 Tipper

**Application de pourboires contre des services entre particuliers** — avec géolocalisation, wallet intégré et notifications push en temps réel.

Inspirée des maquettes Adalo / Base44, refaite en application web full-stack **prête à l'emploi** (PWA installable sur mobile).

---

## ✨ Fonctionnalités

- 🔐 **Authentification** (inscription / connexion, JWT) — +50 CHF offerts à l'inscription
- 🎭 **Choix du rôle** : « Je cherche » (SERVICES) / « Je trouve et je gagne » (POURBOIRES)
- 🗂️ **6 catégories** : Administratif, Automobile, Epicerie, Immobilier, Petit service, Loisirs
- 📝 **Poster une annonce** : titre, prix, pourboire offert, photo, description, géolocalisation
- 📍 **Géolocalisation** : tri des annonces par distance (calcul Haversine)
- 🙋 **Postuler** à une annonce — **maximum 3 participants par annonce**
- ✅ **Gestion des candidatures** : accepter / refuser, puis verser le pourboire
- 👛 **Wallet** : solde, rechargement, retrait, historique des transactions. Le pourboire est garanti par le wallet et débité à la fin de la prestation.
- 🔔 **Notifications push** (Web Push / VAPID) **+ centre de notifications** en temps réel :
  nouvelle candidature, candidature acceptée/refusée, pourboire reçu, nouveau message
- 💬 **Messagerie** entre utilisateurs
- 👤 **Profil** : mes annonces, mes candidatures, réglages, profils publics

## 🏗️ Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite (PWA, mobile-first) |
| Backend | Node.js + Express |
| Base de données | SQLite (better-sqlite3) |
| Auth | JWT + bcrypt |
| Push | web-push (VAPID, généré automatiquement) |
| Upload photos | multer |

## 🚀 Démarrage rapide

```bash
cd tipper

# 1. Installer les dépendances (serveur + client)
npm run install:all

# 2. (Optionnel) charger des données de démo
npm run seed

# 3a. Mode développement (serveur :4000 + client :5173 avec hot-reload)
npm run dev
#   → ouvrez http://localhost:5173

# 3b. OU mode production (build du client servi par le serveur)
npm run build
npm start
#   → ouvrez http://localhost:4000
```

### Comptes de démonstration

Mot de passe pour tous : `password`

| Email | Ville |
|-------|-------|
| sophie@tipper.app | Genève |
| lucas@tipper.app | Genève |
| emma@tipper.app | Lausanne |
| noah@tipper.app | Genève |

## 📁 Structure

```
tipper/
├── server/                 # API Express + SQLite
│   ├── src/
│   │   ├── index.js        # serveur + montage des routes
│   │   ├── db.js           # schéma SQLite
│   │   ├── auth.js         # JWT middleware
│   │   ├── push.js         # Web Push (VAPID)
│   │   ├── notify.js       # notif in-app + push
│   │   ├── geo.js          # distance Haversine
│   │   ├── seed.js         # données de démo
│   │   └── routes/         # auth, ads, applications, wallet, notifications, messages, users
│   └── uploads/            # photos des annonces
└── client/                 # PWA React + Vite
    ├── public/             # manifest, service worker (push), icône
    └── src/
        ├── pages/          # Role, Categories, PostAd, Feed, AdDetail, Wallet, Notifications, Messages, Profile
        ├── components/     # Layout, AdCard
        ├── context/        # état global (user, toasts, badges, géoloc)
        ├── api.js          # client HTTP
        └── push.js         # abonnement notifications push
```

## 🔔 À propos des notifications push

Les clés VAPID sont **générées automatiquement** au premier démarrage et stockées dans `server/data/vapid.json`.
L'utilisateur active les notifications depuis l'écran **Alertes** ou **Profil → Réglages**.
> Les notifications push du navigateur nécessitent **HTTPS** (ou `localhost`). En local, `localhost` est autorisé.

## ⚙️ Configuration

Voir `server/.env.example`. Tout fonctionne sans configuration ; copiez-le en `.env` pour personnaliser le port, le secret JWT ou fournir vos propres clés VAPID.
