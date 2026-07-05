import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatDate } from "@/lib/money";
import { parseBracket } from "@/lib/tournament-engine";
import { PageHeader, BackLink, EmptyState, StatusBadge } from "@/components/ui";
import StartTournamentButton from "@/components/admin/StartTournamentButton";
import SetWinnerButtons from "@/components/admin/SetWinnerButtons";

export const metadata = { title: "Tournois — Admin" };

export default async function AdminTournamentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ["REGISTRATION", "LIVE", "COMPLETED"] } },
    include: { game: true, entries: { include: { user: true } } },
    orderBy: { startsAt: "asc" },
  });

  const registration = tournaments.filter((t) => t.status === "REGISTRATION");
  const live = tournaments.filter((t) => t.status === "LIVE");
  const completed = tournaments
    .filter((t) => t.status === "COMPLETED")
    .slice(-5)
    .reverse();

  return (
    <div>
      <BackLink href="/admin" label="Administration" />
      <PageHeader
        title="Gestion des tournois"
        subtitle="Démarrez les tournois prêts et saisissez les vainqueurs des matchs en cours."
      />

      <h2 className="mb-4 text-lg font-bold text-white">
        Inscriptions ouvertes ({registration.length})
      </h2>
      {registration.length === 0 ? (
        <p className="mb-8 text-sm text-muted">
          Aucun tournoi en phase d&apos;inscription.
        </p>
      ) : (
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          {registration.map((t) => (
            <div key={t.id} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.game.icon}</span>
                  <div>
                    <Link
                      href={`/tournaments/${t.id}`}
                      className="font-bold text-white hover:text-accent"
                    >
                      {t.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {t.entries.length}/{t.maxPlayers} inscrits · début{" "}
                      {formatDate(t.startsAt)} · entrée{" "}
                      {t.entryFeeCents === 0
                        ? "gratuite"
                        : formatMoney(t.entryFeeCents)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-4">
                <StartTournamentButton
                  tournamentId={t.id}
                  entriesCount={t.entries.length}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold text-white">
        En direct ({live.length})
      </h2>
      {live.length === 0 ? (
        <p className="mb-8 text-sm text-muted">Aucun tournoi en cours.</p>
      ) : (
        <div className="mb-10 space-y-6">
          {live.map((t) => {
            const bracket = parseBracket(t.bracketJson);
            const names: Record<string, string> = {};
            for (const e of t.entries) names[e.userId] = e.user.username;
            return (
              <div key={t.id} className="card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.game.icon}</span>
                    <Link
                      href={`/tournaments/${t.id}`}
                      className="font-bold text-white hover:text-accent"
                    >
                      {t.name}
                    </Link>
                  </div>
                  <StatusBadge status="LIVE" />
                </div>

                {bracket ? (
                  <div className="mt-5 space-y-5">
                    {bracket.rounds.map((round, r) => {
                      const decidable = round
                        .map((m, i) => ({ m, i }))
                        .filter(({ m }) => m.p1 && m.p2 && !m.winner);
                      if (decidable.length === 0) return null;
                      return (
                        <div key={r}>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                            Round {r + 1} — matchs à trancher
                          </p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {decidable.map(({ m, i }) => (
                              <SetWinnerButtons
                                key={i}
                                tournamentId={t.id}
                                round={r}
                                matchIndex={i}
                                p1={{ id: m.p1!, name: names[m.p1!] ?? "?" }}
                                p2={{ id: m.p2!, name: names[m.p2!] ?? "?" }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-danger">
                    Arbre du tournoi illisible.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-4 text-lg font-bold text-white">Terminés récemment</h2>
      {completed.length === 0 ? (
        <EmptyState title="Aucun tournoi terminé pour l'instant" />
      ) : (
        <ul className="space-y-2">
          {completed.map((t) => {
            const champion = t.entries.find((e) => e.placement === 1);
            return (
              <li
                key={t.id}
                className="card flex flex-wrap items-center justify-between gap-2 px-5 py-3"
              >
                <Link
                  href={`/tournaments/${t.id}`}
                  className="font-semibold text-white hover:text-accent"
                >
                  {t.game.icon} {t.name}
                </Link>
                <span className="text-sm text-muted">
                  Champion :{" "}
                  <span className="font-semibold text-gold">
                    🏆 {champion?.user.username ?? "—"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
