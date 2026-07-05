import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GAMES = [
  {
    slug: "call-of-duty",
    name: "Call of Duty",
    category: "FPS",
    platforms: "PS5,XBOX,PC,CROSS",
    color: "#F5B93D",
    icon: "🔫",
    description:
      "Le roi du wagering compétitif. Recherche & Destruction, Duel, Mêlée générale : prouvez votre skill sur les modes les plus disputés.",
  },
  {
    slug: "fortnite",
    name: "Fortnite",
    category: "Battle Royale",
    platforms: "PS5,XBOX,PC,CROSS",
    color: "#8B5CF6",
    icon: "🏗️",
    description:
      "Box fights, Zone Wars ou Build Battles : affrontez les meilleurs constructeurs et repartez avec la cagnotte.",
  },
  {
    slug: "ea-fc",
    name: "EA Sports FC",
    category: "Sport",
    platforms: "PS5,XBOX,PC",
    color: "#00E67F",
    icon: "⚽",
    description:
      "Le foot compétitif en 1v1. Ultimate Team ou équipes pro, chaque but peut valoir de l'argent réel.",
  },
  {
    slug: "nba-2k",
    name: "NBA 2K",
    category: "Sport",
    platforms: "PS5,XBOX",
    color: "#F4526A",
    icon: "🏀",
    description:
      "Duels sur le parquet : matchs MyTeam ou équipes NBA, montrez qui domine la raquette.",
  },
  {
    slug: "rocket-league",
    name: "Rocket League",
    category: "Sport",
    platforms: "PS5,XBOX,PC,CROSS",
    color: "#38BDF8",
    icon: "🚗",
    description:
      "Football motorisé en 1v1, 2v2 ou 3v3. Aerials, dribbles et arrêts décisifs pour la victoire.",
  },
  {
    slug: "street-fighter-6",
    name: "Street Fighter 6",
    category: "Combat",
    platforms: "PS5,XBOX,PC,CROSS",
    color: "#FB923C",
    icon: "🥊",
    description:
      "Le versus fighting dans sa forme la plus pure : FT5, FT10, prouvez votre niveau manette en main.",
  },
];

async function main() {
  console.log("🌱 Peuplement de la base Betwager…");

  const password = await bcrypt.hash("Betwager123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@betwager.gg" },
    update: {},
    create: {
      email: "admin@betwager.gg",
      username: "BetwagerStaff",
      passwordHash: password,
      role: "ADMIN",
      avatarColor: "#F5B93D",
      balanceCents: 100000,
      bio: "Équipe officielle Betwager — arbitrage et support.",
    },
  });

  const demoUsers = [
    { email: "shadow@demo.gg", username: "ShadowStriker", color: "#8B5CF6", wins: 42, losses: 11, xp: 1200, balance: 25650, elite: true },
    { email: "nova@demo.gg", username: "NovaQueen", color: "#F4526A", wins: 38, losses: 20, xp: 980, balance: 18400, elite: false },
    { email: "titan@demo.gg", username: "TitanFR", color: "#38BDF8", wins: 27, losses: 9, xp: 760, balance: 9925, elite: true },
    { email: "pixel@demo.gg", username: "PixelSniper", color: "#00E67F", wins: 19, losses: 22, xp: 540, balance: 4200, elite: false },
    { email: "venom@demo.gg", username: "VenomZer0", color: "#FB923C", wins: 15, losses: 7, xp: 430, balance: 7800, elite: false },
    { email: "luna@demo.gg", username: "LunaBlast", color: "#F5B93D", wins: 8, losses: 12, xp: 210, balance: 3100, elite: false },
  ];

  const users: { id: string; username: string }[] = [];
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        username: u.username,
        passwordHash: password,
        avatarColor: u.color,
        wins: u.wins,
        losses: u.losses,
        xp: u.xp,
        balanceCents: u.balance,
        elite: u.elite,
        bio: "Compte de démonstration Betwager.",
      },
    });
    users.push(user);
  }

  const games: Record<string, string> = {};
  for (const g of GAMES) {
    const game = await prisma.game.upsert({
      where: { slug: g.slug },
      update: g,
      create: g,
    });
    games[g.slug] = game.id;
  }

  const matchCount = await prisma.match.count();
  if (matchCount === 0) {
    const openMatches = [
      { game: "call-of-duty", creator: 0, title: "R&D — Recherche & Destruction BO5", fee: 1000, platform: "CROSS", teamSize: 1, rules: "Recherche & Destruction, BO5, cartes du mode classé, snipers autorisés." },
      { game: "fortnite", creator: 1, title: "Box Fight FT5", fee: 500, platform: "PC", teamSize: 1, rules: "Box fight classique, first to 5, pas de heal off." },
      { game: "ea-fc", creator: 2, title: "1v1 équipes pro — 2 × 6 min", fee: 2000, platform: "PS5", teamSize: 1, rules: "Équipes pro 5 étoiles max, 2 mi-temps de 6 minutes, pas de rage quit." },
      { game: "rocket-league", creator: 3, title: "Duel 1v1 — BO7", fee: 750, platform: "CROSS", teamSize: 1, rules: "BO7, stade DFH classique." },
      { game: "nba-2k", creator: 4, title: "Match complet équipes NBA", fee: 1500, platform: "XBOX", teamSize: 1, rules: "Équipes NBA actuelles, 4 × 5 minutes, difficulté Hall of Fame." },
      { game: "street-fighter-6", creator: 5, title: "FT10 — tous personnages", fee: 1200, platform: "CROSS", teamSize: 1, rules: "First to 10, tous personnages autorisés, pas de macro." },
    ];
    for (const m of openMatches) {
      await prisma.match.create({
        data: {
          gameId: games[m.game],
          creatorId: users[m.creator].id,
          title: m.title,
          rules: m.rules,
          platform: m.platform,
          teamSize: m.teamSize,
          entryFeeCents: m.fee,
          status: "OPEN",
        },
      });
    }

    // Un match terminé pour alimenter l'historique (avec ses gains versés).
    const shadow = await prisma.user.findUniqueOrThrow({
      where: { email: "shadow@demo.gg" },
    });
    await prisma.transaction.create({
      data: {
        userId: shadow.id,
        type: "WAGER_PAYOUT",
        amountCents: 4750,
        balanceAfterCents: shadow.balanceCents,
        reference: "Gains — Duel sniper BO3 (frais de service 2,50 €)",
      },
    });
    await prisma.match.create({
      data: {
        gameId: games["call-of-duty"],
        creatorId: users[0].id,
        opponentId: users[1].id,
        winnerId: users[0].id,
        title: "Duel sniper — BO3",
        rules: "Snipers uniquement, BO3.",
        platform: "CROSS",
        entryFeeCents: 2500,
        status: "COMPLETED",
        creatorReport: "WIN",
        opponentReport: "LOSS",
        completedAt: new Date(),
      },
    });
  }

  const tournamentCount = await prisma.tournament.count();
  if (tournamentCount === 0) {
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const cup = await prisma.tournament.create({
      data: {
        gameId: games["call-of-duty"],
        name: "Betwager Sunday Cup — Call of Duty",
        description:
          "Le rendez-vous hebdomadaire des snipers. Élimination directe, BO3 jusqu'en finale (BO5). Cagnotte bonus offerte par Betwager.",
        platform: "CROSS",
        entryFeeCents: 1000,
        bonusPoolCents: 5000,
        maxPlayers: 16,
        startsAt: inThreeDays,
      },
    });
    for (const u of users.slice(0, 4)) {
      await prisma.tournamentEntry.create({
        data: { tournamentId: cup.id, userId: u.id },
      });
    }

    await prisma.tournament.create({
      data: {
        gameId: games["fortnite"],
        name: "Zone Wars Arena — entrée gratuite",
        description:
          "Tournoi gratuit hebdomadaire sponsorisé par Betwager : 50 € de cagnotte à partager entre les finalistes.",
        platform: "CROSS",
        entryFeeCents: 0,
        bonusPoolCents: 5000,
        maxPlayers: 32,
        startsAt: inFiveDays,
      },
    });

    await prisma.tournament.create({
      data: {
        gameId: games["ea-fc"],
        name: "Ligue des Champions Betwager — EA FC",
        description:
          "Le tournoi football du mois. 16 joueurs, élimination directe, finale en deux manches.",
        platform: "PS5",
        entryFeeCents: 2500,
        bonusPoolCents: 10000,
        maxPlayers: 16,
        startsAt: inSevenDays,
      },
    });
  }

  console.log("✅ Base prête.");
  console.log("   Admin : admin@betwager.gg / Betwager123!");
  console.log("   Démo  : shadow@demo.gg / Betwager123! (et 5 autres comptes)");
  console.log(`   Admin id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
