import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatDate, serviceFeeCents } from "@/lib/money";
import {
  Avatar,
  EmptyState,
  PageHeader,
  PlatformBadge,
  StatusBadge,
} from "@/components/ui";

const PLATFORMS = ["PS5", "XBOX", "PC", "CROSS"] as const;
const PLATFORM_LABELS: Record<string, string> = {
  PS5: "PlayStation",
  XBOX: "Xbox",
  PC: "PC",
  CROSS: "Cross-plateforme",
};

function filterHref(game?: string, platform?: string): string {
  const params = new URLSearchParams();
  if (game) params.set("game", game);
  if (platform) params.set("platform", platform);
  const qs = params.toString();
  return qs ? `/wagers?${qs}` : "/wagers";
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-edge bg-elevated text-slate-300 hover:border-accent/40 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function WagersLobbyPage({
  searchParams,
}: {
  searchParams: { game?: string; platform?: string };
}) {
  const activeGame = searchParams.game;
  const activePlatform =
    searchParams.platform && PLATFORMS.includes(searchParams.platform as never)
      ? searchParams.platform
      : undefined;

  const [user, games] = await Promise.all([
    getCurrentUser(),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
  ]);

  const [openMatches, myMatches] = await Promise.all([
    prisma.match.findMany({
      where: {
        status: "OPEN",
        ...(activeGame ? { game: { slug: activeGame } } : {}),
        ...(activePlatform ? { platform: activePlatform } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { game: true, creator: true },
    }),
    user
      ? prisma.match.findMany({
          where: {
            status: { not: "CANCELLED" },
            OR: [{ creatorId: user.id }, { opponentId: user.id }],
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { game: true, creator: true, opponent: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader
        title="Matchs à mise"
        subtitle="Défiez un adversaire, misez, gagnez. Le vainqueur remporte le double de la mise, moins 10 % de frais de service."
        action={
          <Link href="/wagers/create" className="btn-primary shrink-0 px-6 py-3">
            Créer un match
          </Link>
        }
      />

      {/* Mes matchs */}
      {user && myMatches.length > 0 ? (
        <section className="mb-12">
          <h2 className="section-title mb-5">
            Mes matchs <span className="text-accent">({myMatches.length})</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {myMatches.map((match) => {
              const opponentOfViewer =
                match.creatorId === user.id ? match.opponent : match.creator;
              return (
                <Link
                  key={match.id}
                  href={`/wagers/${match.id}`}
                  className="card group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50"
                >
                  <span className="text-3xl">{match.game.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white transition-colors group-hover:text-accent">
                      {match.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {match.game.name} ·{" "}
                      {opponentOfViewer
                        ? `contre ${opponentOfViewer.username}`
                        : "en attente d'un adversaire"}{" "}
                      · {formatDate(match.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge status={match.status} />
                    <span className="text-sm font-bold text-accent">
                      {formatMoney(match.entryFeeCents)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Filtres */}
      <section className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">
            Jeu
          </span>
          <Pill href={filterHref(undefined, activePlatform)} active={!activeGame}>
            Tous les jeux
          </Pill>
          {games.map((game) => (
            <Pill
              key={game.id}
              href={filterHref(game.slug, activePlatform)}
              active={activeGame === game.slug}
            >
              <span>{game.icon}</span>
              {game.name}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">
            Plateforme
          </span>
          <Pill href={filterHref(activeGame, undefined)} active={!activePlatform}>
            Toutes
          </Pill>
          {PLATFORMS.map((p) => (
            <Pill
              key={p}
              href={filterHref(activeGame, p)}
              active={activePlatform === p}
            >
              {PLATFORM_LABELS[p]}
            </Pill>
          ))}
        </div>
      </section>

      {/* Matchs ouverts */}
      <section>
        <h2 className="section-title mb-6">
          Défis ouverts <span className="text-accent">({openMatches.length})</span>
        </h2>
        {openMatches.length === 0 ? (
          <EmptyState
            title="Aucun match ouvert avec ces critères"
            subtitle="Élargissez vos filtres ou lancez votre propre défi : la communauté n'attend que vous."
            action={
              <Link href="/wagers/create" className="btn-primary">
                Créer un match
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openMatches.map((match) => {
              const gross = match.entryFeeCents * 2;
              const netGain = gross - serviceFeeCents(gross, false);
              return (
                <Link
                  key={match.id}
                  href={`/wagers/${match.id}`}
                  className="card group flex flex-col gap-4 p-5 transition-all hover:-translate-y-1 hover:border-accent/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span className="text-2xl">{match.game.icon}</span>
                      <span className="font-medium">{match.game.name}</span>
                    </div>
                    <PlatformBadge platform={match.platform} />
                  </div>
                  <p className="font-bold text-white transition-colors group-hover:text-accent">
                    {match.title}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      username={match.creator.username}
                      color={match.creator.avatarColor}
                      size={32}
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {match.creator.username}
                      </p>
                      <p className="text-xs text-muted">
                        {match.creator.wins} V — {match.creator.losses} D
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto border-t border-edge pt-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted">
                          Mise
                        </p>
                        <p className="text-xl font-extrabold text-accent">
                          {formatMoney(match.entryFeeCents)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-muted">
                          Gain potentiel
                        </p>
                        <p className="text-sm font-bold text-gold">
                          {formatMoney(netGain)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      Créé le {formatDate(match.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
