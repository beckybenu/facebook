# Betwager — Spécification technique pour les agents

Betwager est une plateforme e-sport (clone de checkmategaming.com) où les
joueurs s'affrontent en **matchs à mise** (wagers) et **tournois cash**.
Tout le contenu utilisateur est **en français**. Thème sombre gaming.

## Stack

- Next.js 14 App Router + TypeScript strict, dossier `src/`
- Tailwind CSS (couleurs custom : `bg`, `surface`, `card`, `elevated`, `edge`,
  `accent` (vert #00E67F), `violet`, `gold`, `danger`, `muted`)
- Prisma 5 + SQLite — client déjà généré, base déjà peuplée
- Alias d'import : `@/*` → `src/*`
- Argent : **entiers en centimes** partout ; affichage via `formatMoney`

## Classes CSS prêtes (globals.css)

`btn-primary`, `btn-secondary`, `btn-danger`, `card`, `input`, `label`,
`badge`, `section-title`. Utilisez-les au maximum + utilitaires Tailwind.

## Composants partagés (`@/components/ui`)

- `StatusBadge({status})` — pastille traduite pour tous les statuts
- `Avatar({username, color?, size?})`
- `EmptyState({title, subtitle?, action?})`
- `StatCard({label, value, accent?})`
- `PageHeader({title, subtitle?, action?})`
- `PlatformBadge({platform})` — PS5 | XBOX | PC | CROSS
- `BackLink({href, label})`

Le layout global (`src/app/layout.tsx`) inclut déjà Navbar + Footer et un
conteneur `max-w-7xl` avec padding. `dynamic = "force-dynamic"` est déjà posé
au layout racine — les pages peuvent lire les cookies librement.

## Bibliothèques internes

### `@/lib/db` → `prisma` (PrismaClient singleton)

### `@/lib/auth`
- `hashPassword(pw)`, `verifyPassword(pw, hash)`
- `createSession({id, role})` — pose le cookie JWT
- `destroySession()`
- `getSession()` → `{userId, role} | null`
- `getCurrentUser()` → `User | null` (pour les pages server)
- `requireUser()` / `requireAdmin()` → `User`, jettent `AuthError` (pour les API)

### `@/lib/money`
- `formatMoney(cents)` → "12,50 €" ; `formatDate(d)` ; `serviceFeeCents(gross, elite)`

### `@/lib/api`
- `jsonOk(data)`, `jsonError(msg, status)`, `handleApiError(e)`
- Toutes les routes API répondent `{ok: true, data}` ou `{ok: false, error}`.
- Modèle de route :
```ts
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json()); // zod
    // ... logique
    return jsonOk(result);
  } catch (e) {
    return handleApiError(e);
  }
}
```

### `@/lib/wallet`
- `applyTransaction(tx, {userId, type, amountCents, reference?})` — atomique,
  signé (négatif = débit), refuse un solde négatif (`WalletError`).
- `applySingleTransaction(params)` — hors transaction composée.
- Types : DEPOSIT, WITHDRAWAL, WAGER_STAKE, WAGER_PAYOUT, WAGER_REFUND,
  TOURNAMENT_ENTRY, TOURNAMENT_PRIZE, BONUS.

### `@/lib/match-engine` (logique métier des wagers — NE PAS réimplémenter)
- `createMatch({creatorId, gameId, title, rules, platform, region, teamSize, entryFeeCents})`
- `acceptMatch(matchId, opponentId)`
- `cancelMatch(matchId, userId)`
- `reportResult(matchId, userId, "WIN" | "LOSS")` — règle automatiquement le
  match si les déclarations concordent, ouvre un litige sinon.
- `adminSettleMatch(matchId, winnerId, resolution)` / `adminVoidMatch(matchId, resolution)`
- Jettent `MatchError` (à convertir en 400 : `if (e instanceof MatchError) return jsonError(e.message)` avant `handleApiError`).

### `@/lib/tournament-engine` (NE PAS réimplémenter)
- `registerForTournament(id, userId)` / `unregisterFromTournament(id, userId)`
- `startTournament(id)` — génère l'arbre à élimination directe
- `setBracketWinner(tournamentId, round, matchIndex, winnerId)` — paie
  automatiquement les prix après la finale (70/30)
- `parseBracket(json)` → `{rounds: {p1, p2, winner}[][]} | null`
- `prizePoolCents({entryFeeCents, bonusPoolCents, entriesCount})`
- Jettent `TournamentError`.

## Modèle de données (résumé Prisma)

- **User** : email, username, passwordHash, role (USER|ADMIN), avatarColor,
  bio, country, gamertagPsn/Xbox/Activision/Epic, balanceCents, elite, xp,
  wins, losses
- **Transaction** : type, amountCents (signé), balanceAfterCents, reference
- **Game** : slug, name, category, platforms (CSV), color, icon (emoji), description
- **Match** : gameId, creatorId, opponentId?, winnerId?, title, rules,
  platform, region, teamSize, entryFeeCents, status
  (OPEN|ACCEPTED|REPORTED|DISPUTED|COMPLETED|CANCELLED), creatorReport?, opponentReport?
- **Tournament** : gameId, name, description, platform, teamSize,
  entryFeeCents (0 = gratuit), bonusPoolCents, maxPlayers, startsAt, status
  (REGISTRATION|LIVE|COMPLETED|CANCELLED), bracketJson, entries[]
- **TournamentEntry** : tournamentId+userId uniques, seed?, placement?
- **Dispute** : matchId unique, openedById, reason, status (OPEN|RESOLVED), resolution
- **Notification** : userId, title, body, href, read

## Frais & règles métier

- Mise min 1 € (100), max 500 € (50000).
- Le vainqueur d'un wager touche 2× la mise moins 10 % de frais (5 % Elite).
- Cagnotte tournoi = inscriptions × frais + bonusPoolCents ; 70 % / 30 %.
- Dépôt simulé (pas de vrai PSP) : min 5 €, max 1 000 €. Retrait : min 10 €,
  solde suffisant requis.

## Conventions UI

- Pages server components par défaut ; formulaires = client components
  (`"use client"`) qui font `fetch` vers les API puis `router.refresh()` ou
  `router.push(...)`. Afficher les erreurs `body.error` dans un
  `<p className="text-sm text-danger">`.
- Boutons d'action pendant soumission : `disabled` + libellé "…".
- Dates : `formatDate`. Montants : `formatMoney`. Jamais de texte anglais.
- Design sombre premium type e-sport : cartes `card`, accents `text-accent`,
  hover subtils. Emojis autorisés comme icônes.
- Utilisateur non connecté sur une action protégée → rediriger vers `/login`.

## Règle absolue

Chaque agent ne crée QUE les fichiers qui lui sont assignés — aucun fichier
partagé (layout, lib, ui, schema) ne doit être modifié.
