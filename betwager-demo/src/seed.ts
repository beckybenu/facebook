import type { State, User } from "./types";
import { uid } from "./engine";

const day = 24 * 60 * 60 * 1000;
const ago = (d: number) => new Date(Date.now() - d * day).toISOString();
const inDays = (d: number) => new Date(Date.now() + d * day).toISOString();

function mkUser(p: Partial<User> & { email: string; username: string }): User {
  return {
    id: uid(),
    password: "Betwager123!",
    role: "USER",
    avatarColor: "#00E67F",
    bio: "Compte de démonstration Betwager.",
    country: "FR",
    gamertagPsn: "",
    gamertagXbox: "",
    gamertagActivision: "",
    gamertagEpic: "",
    balanceCents: 0,
    elite: false,
    xp: 0,
    wins: 0,
    losses: 0,
    createdAt: ago(30),
    ...p,
  };
}

export function buildSeed(): State {
  const admin = mkUser({
    email: "admin@betwager.gg",
    username: "BetwagerStaff",
    role: "ADMIN",
    avatarColor: "#F5B93D",
    balanceCents: 100000,
    bio: "Équipe officielle Betwager — arbitrage et support.",
  });
  const shadow = mkUser({
    email: "shadow@demo.gg",
    username: "ShadowStriker",
    avatarColor: "#8B5CF6",
    wins: 42,
    losses: 11,
    xp: 1200,
    balanceCents: 25650,
    elite: true,
    gamertagActivision: "Shadow#2211",
    gamertagPsn: "ShadowStriker_FR",
  });
  const nova = mkUser({
    email: "nova@demo.gg",
    username: "NovaQueen",
    avatarColor: "#F4526A",
    wins: 38,
    losses: 20,
    xp: 980,
    balanceCents: 18400,
  });
  const titan = mkUser({
    email: "titan@demo.gg",
    username: "TitanFR",
    avatarColor: "#38BDF8",
    wins: 27,
    losses: 9,
    xp: 760,
    balanceCents: 9925,
    elite: true,
  });
  const pixel = mkUser({
    email: "pixel@demo.gg",
    username: "PixelSniper",
    avatarColor: "#00E67F",
    wins: 19,
    losses: 22,
    xp: 540,
    balanceCents: 4200,
  });
  const venom = mkUser({
    email: "venom@demo.gg",
    username: "VenomZer0",
    avatarColor: "#FB923C",
    wins: 15,
    losses: 7,
    xp: 430,
    balanceCents: 7800,
  });
  const luna = mkUser({
    email: "luna@demo.gg",
    username: "LunaBlast",
    avatarColor: "#F5B93D",
    wins: 8,
    losses: 12,
    xp: 210,
    balanceCents: 3100,
  });
  const users = [admin, shadow, nova, titan, pixel, venom, luna];

  const games = [
    {
      slug: "call-of-duty",
      name: "Call of Duty",
      category: "FPS",
      platforms: ["PS5", "XBOX", "PC", "CROSS"],
      color: "#F5B93D",
      icon: "🔫",
      description:
        "Le roi du wagering compétitif. Recherche & Destruction, Duel, Mêlée générale : prouvez votre skill sur les modes les plus disputés.",
    },
    {
      slug: "fortnite",
      name: "Fortnite",
      category: "Battle Royale",
      platforms: ["PS5", "XBOX", "PC", "CROSS"],
      color: "#8B5CF6",
      icon: "🏗️",
      description:
        "Box fights, Zone Wars ou Build Battles : affrontez les meilleurs constructeurs et repartez avec la cagnotte.",
    },
    {
      slug: "ea-fc",
      name: "EA Sports FC",
      category: "Sport",
      platforms: ["PS5", "XBOX", "PC"],
      color: "#00E67F",
      icon: "⚽",
      description:
        "Le foot compétitif en 1v1. Ultimate Team ou équipes pro, chaque but peut valoir de l'argent réel.",
    },
    {
      slug: "nba-2k",
      name: "NBA 2K",
      category: "Sport",
      platforms: ["PS5", "XBOX"],
      color: "#F4526A",
      icon: "🏀",
      description:
        "Duels sur le parquet : matchs MyTeam ou équipes NBA, montrez qui domine la raquette.",
    },
    {
      slug: "rocket-league",
      name: "Rocket League",
      category: "Sport",
      platforms: ["PS5", "XBOX", "PC", "CROSS"],
      color: "#38BDF8",
      icon: "🚗",
      description:
        "Football motorisé en 1v1, 2v2 ou 3v3. Aerials, dribbles et arrêts décisifs pour la victoire.",
    },
    {
      slug: "street-fighter-6",
      name: "Street Fighter 6",
      category: "Combat",
      platforms: ["PS5", "XBOX", "PC", "CROSS"],
      color: "#FB923C",
      icon: "🥊",
      description:
        "Le versus fighting dans sa forme la plus pure : FT5, FT10, prouvez votre niveau manette en main.",
    },
  ];

  const openMatch = (
    gameSlug: string,
    creator: User,
    title: string,
    fee: number,
    platform: string,
    rules: string,
    daysAgo: number
  ) => ({
    id: uid(),
    gameSlug,
    creatorId: creator.id,
    opponentId: null,
    winnerId: null,
    title,
    rules,
    platform,
    region: "EU",
    teamSize: 1,
    entryFeeCents: fee,
    status: "OPEN" as const,
    creatorReport: null,
    opponentReport: null,
    createdAt: ago(daysAgo),
    completedAt: null,
  });

  const matches = [
    openMatch("call-of-duty", shadow, "R&D — Recherche & Destruction BO5", 1000, "CROSS", "Recherche & Destruction, BO5, cartes du mode classé, snipers autorisés.", 0.2),
    openMatch("fortnite", nova, "Box Fight FT5", 500, "PC", "Box fight classique, first to 5, pas de heal off.", 0.4),
    openMatch("ea-fc", titan, "1v1 équipes pro — 2 × 6 min", 2000, "PS5", "Équipes pro 5 étoiles max, 2 mi-temps de 6 minutes, pas de rage quit.", 0.6),
    openMatch("rocket-league", pixel, "Duel 1v1 — BO7", 750, "CROSS", "BO7, stade DFH classique.", 0.8),
    openMatch("nba-2k", venom, "Match complet équipes NBA", 1500, "XBOX", "Équipes NBA actuelles, 4 × 5 minutes, difficulté Hall of Fame.", 1),
    openMatch("street-fighter-6", luna, "FT10 — tous personnages", 1200, "CROSS", "First to 10, tous personnages autorisés, pas de macro.", 1.2),
    {
      id: uid(),
      gameSlug: "call-of-duty",
      creatorId: shadow.id,
      opponentId: nova.id,
      winnerId: shadow.id,
      title: "Duel sniper — BO3",
      rules: "Snipers uniquement, BO3.",
      platform: "CROSS",
      region: "EU",
      teamSize: 1,
      entryFeeCents: 2500,
      status: "COMPLETED" as const,
      creatorReport: "WIN" as const,
      opponentReport: "LOSS" as const,
      createdAt: ago(2),
      completedAt: ago(1.9),
    },
  ];

  const tournaments = [
    {
      id: uid(),
      gameSlug: "call-of-duty",
      name: "Betwager Sunday Cup — Call of Duty",
      description:
        "Le rendez-vous hebdomadaire des snipers. Élimination directe, BO3 jusqu'en finale (BO5). Cagnotte bonus offerte par Betwager.",
      platform: "CROSS",
      teamSize: 1,
      entryFeeCents: 1000,
      bonusPoolCents: 5000,
      maxPlayers: 16,
      startsAt: inDays(3),
      status: "REGISTRATION" as const,
      bracket: null,
      entries: [shadow, nova, titan, pixel].map((u) => ({
        userId: u.id,
        placement: null,
      })),
    },
    {
      id: uid(),
      gameSlug: "fortnite",
      name: "Zone Wars Arena — entrée gratuite",
      description:
        "Tournoi gratuit hebdomadaire sponsorisé par Betwager : 50 € de cagnotte à partager entre les finalistes.",
      platform: "CROSS",
      teamSize: 1,
      entryFeeCents: 0,
      bonusPoolCents: 5000,
      maxPlayers: 32,
      startsAt: inDays(5),
      status: "REGISTRATION" as const,
      bracket: null,
      entries: [venom, luna].map((u) => ({ userId: u.id, placement: null })),
    },
    {
      id: uid(),
      gameSlug: "ea-fc",
      name: "Ligue des Champions Betwager — EA FC",
      description:
        "Le tournoi football du mois. 16 joueurs, élimination directe, finale en deux manches.",
      platform: "PS5",
      teamSize: 1,
      entryFeeCents: 2500,
      bonusPoolCents: 10000,
      maxPlayers: 16,
      startsAt: inDays(7),
      status: "REGISTRATION" as const,
      bracket: null,
      entries: [],
    },
  ];

  const transactions = [
    {
      id: uid(),
      userId: shadow.id,
      type: "WAGER_PAYOUT" as const,
      amountCents: 4750,
      balanceAfterCents: shadow.balanceCents,
      reference: "Gains — Duel sniper BO3 (frais de service 2,50 €)",
      createdAt: ago(1.9),
    },
    {
      id: uid(),
      userId: shadow.id,
      type: "DEPOSIT" as const,
      amountCents: 10000,
      balanceAfterCents: shadow.balanceCents - 4750 + 10000,
      reference: "Dépôt par carte (démo)",
      createdAt: ago(3),
    },
  ];

  return {
    version: 1,
    sessionUserId: null,
    users,
    games,
    matches,
    tournaments,
    disputes: [],
    notifications: [],
    transactions,
  };
}
