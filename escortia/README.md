# Escortia — Companion Directory Marketplace

A full-stack **companion / escort directory** for Switzerland, built as an educational
marketplace. Browse verified companion profiles, filter by city, service and price,
book appointments, exchange messages, and leave reviews.

**Live demo:** https://beckybenu.github.io/facebook/escortia/

> ⚠️ **Adults only (18+).** This is a non-explicit educational demo: no real transactions,
> no payment processing, and no sexually explicit content. Profile photos are placeholder
> portraits. Sex work / its advertising is regulated differently across jurisdictions — this
> project is for learning full-stack development, not for production deployment.

## Features

**Directory & discovery**
- Public directory of companion profiles with photo, headline, price, services and rating
- Search (name / headline / bio) and filters: city, service, max price, availability, sorting
- Profile detail pages with bio, services, languages, availability and reviews
- Age-verification gate on first visit

**Accounts (JWT auth, two roles)**
- **Clients** — browse, favorite profiles, request bookings, message providers, leave star reviews
- **Providers** — create/edit their own listing, set services & languages, toggle availability, manage incoming booking requests

**Marketplace**
- Booking requests with status flow: `pending → accepted / declined → completed` (client can `cancel`)
- Direct messaging between clients and providers (conversation list + live-polling thread + unread badges)
- Reviews (1–5 stars), restricted to clients who have booked the companion

## Tech stack

| Layer    | Stack                                             |
|----------|---------------------------------------------------|
| Frontend | React 18 + Vite, React Router                     |
| Backend  | Node + Express                                    |
| Database | SQLite (`better-sqlite3`)                          |
| Auth     | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |

## Getting started

```bash
cd escortia

# Install root tooling + server + client deps
npm install

# Seed the database with demo companions + a demo client
npm run seed

# Run API (:4000) and Vite dev server (:5173) together
npm run dev
```

Then open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the backend.

### Demo accounts

Password for all seeded accounts: `password123`

| Email             | Role     |
|-------------------|----------|
| `client@demo.ch`  | client   |
| `elena@demo.ch`   | provider |
| `sofia@demo.ch`   | provider |
| …other companions | provider |

## Project structure

```
escortia/
├── server/                 # Express + SQLite API
│   └── src/
│       ├── index.js        # app entry + route mounting
│       ├── db.js           # SQLite schema & connection
│       ├── auth.js         # JWT signing + auth middleware
│       ├── seed.js         # demo data
│       ├── profileSerializer.js
│       └── routes/         # auth, profiles, favorites, bookings, messages, reviews
└── client/                 # React + Vite SPA
    └── src/
        ├── App.jsx         # router + age gate
        ├── auth.jsx        # auth context
        ├── api.js          # fetch wrapper
        ├── components/     # NavBar, ProfileCard, AgeGate, Stars
        └── pages/          # Home, ProfileDetail, Login, Register,
                            #   Favorites, Bookings, Messages, ProviderDashboard
```

## API overview

| Method | Endpoint                     | Auth     | Description                         |
|--------|------------------------------|----------|-------------------------------------|
| POST   | `/api/auth/register`         | —        | Create account (client/provider)    |
| POST   | `/api/auth/login`            | —        | Log in, returns JWT                 |
| GET    | `/api/auth/me`               | yes      | Current user                        |
| GET    | `/api/profiles`              | —        | Directory (filters via query)       |
| GET    | `/api/profiles/:id`          | —        | Profile detail                      |
| GET    | `/api/profiles/:id/reviews`  | —        | Reviews for a profile               |
| GET/PUT| `/api/profiles/me/profile`   | provider | Read / upsert own listing           |
| GET    | `/api/favorites`             | client   | List favorites                      |
| POST/DELETE | `/api/favorites/:profileId` | client | Add / remove favorite           |
| POST   | `/api/bookings`              | client   | Request a booking                   |
| GET    | `/api/bookings`              | yes      | My bookings (client) / incoming (provider) |
| PATCH  | `/api/bookings/:id`          | yes      | Update status                       |
| GET    | `/api/messages`              | yes      | Conversation list                   |
| GET/POST | `/api/messages/:userId`    | yes      | Thread / send message               |
| POST   | `/api/reviews/:profileId`    | client   | Add / update review                 |

## Configuration

Copy `server/.env.example` to `server/.env` to override defaults (`PORT`, `JWT_SECRET`, `DB_FILE`).
