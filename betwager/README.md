# 🎮 Betwager

**Betwager** est une plateforme e-sport complète de matchs à mise et de
tournois cash (inspirée de checkmategaming.com) : les joueurs s'affrontent en
1v1 (ou en équipe) sur leurs jeux préférés, misent de l'argent, déclarent le
résultat et le vainqueur encaisse la cagnotte.

## ✨ Fonctionnalités

- **Matchs à mise (wagers)** : création de défis avec mise (1 € – 500 €),
  acceptation par un adversaire, double déclaration du résultat, règlement
  automatique des gains (frais de service 10 %, 5 % pour les membres Elite).
- **Litiges & arbitrage** : déclarations contradictoires → litige ouvert,
  tranché par un administrateur (attribution de la victoire ou annulation
  avec remboursement).
- **Tournois** : inscriptions (gratuites ou payantes), cagnotte bonus,
  génération automatique de l'arbre à élimination directe, distribution
  automatique des prix (70 % / 30 %).
- **Portefeuille** : dépôts (simulés, prêts à brancher sur un PSP), retraits,
  historique complet des transactions — tous les mouvements sont atomiques et
  le solde ne peut jamais devenir négatif.
- **Classements** : top victoires et top gains.
- **Profils** : statistiques, gamertags (PSN, Xbox, Activision, Epic), profils
  publics, notifications en temps réel de l'activité.
- **Espace admin** : tableau de bord, arbitrage des litiges, pilotage des
  tournois (démarrage, saisie des vainqueurs), gestion des joueurs (Elite,
  crédits).
- **Pages éditoriales** : comment ça marche, FAQ, support, CGU, confidentialité.

## 🛠️ Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite ·
sessions JWT (jose) · bcryptjs · zod. Interface 100 % en français, thème
sombre gaming.

## 🚀 Démarrage

```bash
npm run setup   # installe, génère le client Prisma, crée et peuple la base
npm run dev     # http://localhost:3000
```

### Comptes de démonstration

| Rôle  | Email               | Mot de passe  |
| ----- | ------------------- | ------------- |
| Admin | admin@betwager.gg   | Betwager123!  |
| Démo  | shadow@demo.gg      | Betwager123!  |
| Démo  | nova@demo.gg        | Betwager123!  |

(4 autres comptes démo : titan@, pixel@, venom@, luna@ — même mot de passe.)

## 📦 Mise en production

```bash
npm run build
npm start
```

1. **Secret** : définissez `AUTH_SECRET` (voir `.env.example`) —
   `openssl rand -hex 32`.
2. **Base de données** : SQLite fonctionne tel quel (pointez `DATABASE_URL`
   vers un volume persistant, ex. `file:/data/betwager.db`). Pour PostgreSQL,
   changez `provider = "postgresql"` dans `prisma/schema.prisma` puis
   `npx prisma db push`.
3. **Hébergement** : tout hébergeur Node.js (VPS, Railway, Render, Fly.io…).
   Sur Vercel, utilisez une base externe (Postgres/Turso), le système de
   fichiers étant éphémère.
4. **Paiements réels** : les dépôts/retraits sont simulés
   (`src/app/api/wallet/*`) — branchez-y Stripe/PayPal ; toute la comptabilité
   interne (centimes, transactions atomiques) est déjà en place.

## ⚖️ Avertissement

Les matchs à mise d'argent réel sont réglementés différemment selon les pays.
Avant toute mise en ligne commerciale, vérifiez le cadre légal applicable
(jeu d'adresse vs jeu de hasard, licences, KYC/âge minimum).
