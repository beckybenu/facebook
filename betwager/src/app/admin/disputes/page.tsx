import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatDate } from "@/lib/money";
import {
  PageHeader,
  EmptyState,
  Avatar,
  BackLink,
  StatusBadge,
} from "@/components/ui";
import ResolveDisputeForm from "@/components/admin/ResolveDisputeForm";
import Link from "next/link";

export const metadata = { title: "Litiges — Admin" };

const REPORT_LABEL: Record<string, string> = {
  WIN: "revendique la victoire",
  LOSS: "reconnaît la défaite",
};

export default async function AdminDisputesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [openDisputes, resolvedDisputes] = await Promise.all([
    prisma.dispute.findMany({
      where: { status: "OPEN" },
      include: {
        match: { include: { game: true, creator: true, opponent: true } },
        openedBy: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dispute.findMany({
      where: { status: "RESOLVED" },
      include: { match: { include: { creator: true, opponent: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div>
      <BackLink href="/admin" label="Administration" />
      <PageHeader
        title="Arbitrage des litiges"
        subtitle="Matchs aux déclarations contradictoires : attribuez la victoire ou annulez avec remboursement."
      />

      {openDisputes.length === 0 ? (
        <EmptyState
          title="Aucun litige en cours 🎉"
          subtitle="Tous les matchs se règlent à l'amiable pour le moment."
        />
      ) : (
        <div className="space-y-6">
          {openDisputes.map((d) => {
            const m = d.match;
            return (
              <div key={d.id} className="card border-danger/40 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.game.icon}</span>
                    <div>
                      <Link
                        href={`/wagers/${m.id}`}
                        className="font-bold text-white hover:text-accent"
                      >
                        {m.title}
                      </Link>
                      <p className="text-sm text-muted">
                        {m.game.name} · mise {formatMoney(m.entryFeeCents)} ·
                        ouvert le {formatDate(d.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="DISPUTED" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { player: m.creator, report: m.creatorReport },
                    { player: m.opponent!, report: m.opponentReport },
                  ].map(({ player, report }) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 rounded-lg border border-edge bg-surface px-4 py-3"
                    >
                      <Avatar
                        username={player.username}
                        color={player.avatarColor}
                        size={36}
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {player.username}
                        </p>
                        <p className="text-sm text-muted">
                          {report
                            ? REPORT_LABEL[report] ?? report
                            : "n'a pas encore déclaré"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-slate-300">
                  <span className="font-semibold text-muted">Motif :</span>{" "}
                  {d.reason} — signalé par {d.openedBy.username}
                </p>

                <div className="mt-5">
                  <ResolveDisputeForm
                    disputeId={d.id}
                    creatorId={m.creatorId}
                    creatorName={m.creator.username}
                    opponentId={m.opponentId!}
                    opponentName={m.opponent!.username}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolvedDisputes.length > 0 ? (
        <details className="card mt-10 p-6">
          <summary className="cursor-pointer font-bold text-white">
            Litiges résolus récents ({resolvedDisputes.length})
          </summary>
          <ul className="mt-4 space-y-3">
            {resolvedDisputes.map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-edge bg-surface px-4 py-3 text-sm"
              >
                <p className="font-semibold text-white">
                  {d.match.creator.username} vs{" "}
                  {d.match.opponent?.username ?? "—"} ·{" "}
                  {formatMoney(d.match.entryFeeCents)}
                </p>
                <p className="mt-1 text-muted">
                  Résolution : {d.resolution || "—"}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
