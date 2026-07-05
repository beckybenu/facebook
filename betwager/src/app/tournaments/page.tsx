import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/money";
import { prizePoolCents } from "@/lib/tournament-engine";
import {
  PageHeader,
  StatusBadge,
  PlatformBadge,
  EmptyState,
} from "@/components/ui";

export const metadata = { title: "Tournois" };

const FILTERS = [
  { key: "", label: "Tous" },
  { key: "REGISTRATION", label: "Inscriptions ouvertes" },
  { key: "LIVE", label: "En direct" },
  { key: "COMPLETED", label: "Terminés" },
];

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status ?? "";
  const tournaments = await prisma.tournament.findMany({
    where: status ? { status } : { status: { not: "CANCELLED" } },
    include: { game: true, _count: { select: { entries: true } } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Tournois"
        subtitle="Inscrivez-vous, grimpez dans l'arbre et remportez la cagnotte. Élimination directe, prix versés automatiquement."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/tournaments?status=${f.key}` : "/tournaments"}
            className={`badge border px-4 py-1.5 ${
              status === f.key
                ? "border-accent bg-accent-soft text-accent"
                : "border-edge bg-elevated text-slate-300 hover:border-accent/50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {tournaments.length === 0 ? (
        <EmptyState
          title="Aucun tournoi pour ce filtre"
          subtitle="Revenez bientôt : de nouveaux tournois sont organisés chaque semaine."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {tournaments.map((t) => {
            const pool = prizePoolCents({
              entryFeeCents: t.entryFeeCents,
              bonusPoolCents: t.bonusPoolCents,
              entriesCount: t._count.entries,
            });
            const fillPct = Math.min(
              100,
              Math.round((t._count.entries / t.maxPlayers) * 100)
            );
            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="card group p-6 transition-colors hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{t.game.icon}</span>
                    <div>
                      <p className="font-bold text-white group-hover:text-accent">
                        {t.name}
                      </p>
                      <p className="text-sm text-muted">{t.game.name}</p>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <PlatformBadge platform={t.platform} />
                  {t.entryFeeCents === 0 ? (
                    <span className="badge bg-accent-soft text-accent">
                      GRATUIT
                    </span>
                  ) : (
                    <span className="badge border border-edge bg-elevated text-slate-300">
                      Entrée {formatMoney(t.entryFeeCents)}
                    </span>
                  )}
                  <span className="badge border border-edge bg-elevated text-slate-300">
                    {formatDate(t.startsAt)}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <p className="mb-1.5 text-xs text-muted">
                      {t._count.entries}/{t.maxPlayers} inscrits
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-muted">
                      Cagnotte
                    </p>
                    <p className="text-xl font-bold text-gold">
                      {formatMoney(pool)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
