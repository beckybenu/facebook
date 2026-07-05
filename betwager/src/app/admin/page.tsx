import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { PageHeader, StatCard } from "@/components/ui";

export const metadata = { title: "Administration" };

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [
    userCount,
    openMatches,
    openDisputes,
    activeTournaments,
    stakes,
    deposits,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.match.count({ where: { status: "OPEN" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.tournament.count({
      where: { status: { in: ["REGISTRATION", "LIVE"] } },
    }),
    prisma.transaction.aggregate({
      where: { type: "WAGER_STAKE" },
      _sum: { amountCents: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT" },
      _sum: { amountCents: true },
    }),
  ]);

  const sections = [
    {
      href: "/admin/disputes",
      icon: "⚖️",
      title: "Litiges",
      description: "Arbitrer les matchs contestés : trancher ou rembourser.",
      count: `${openDisputes} en attente`,
      urgent: openDisputes > 0,
    },
    {
      href: "/admin/tournaments",
      icon: "🏆",
      title: "Tournois",
      description: "Démarrer les tournois et saisir les vainqueurs des matchs.",
      count: `${activeTournaments} actifs`,
      urgent: false,
    },
    {
      href: "/admin/users",
      icon: "👥",
      title: "Joueurs",
      description: "Gérer les comptes : statut Elite, crédits bonus.",
      count: `${userCount} inscrits`,
      urgent: false,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Pilotage de la plateforme : arbitrage, tournois et gestion des joueurs."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Joueurs" value={String(userCount)} />
        <StatCard label="Matchs ouverts" value={String(openMatches)} />
        <StatCard
          label="Litiges ouverts"
          value={String(openDisputes)}
          accent={openDisputes > 0}
        />
        <StatCard label="Tournois actifs" value={String(activeTournaments)} />
        <StatCard
          label="Volume misé"
          value={formatMoney(Math.abs(stakes._sum.amountCents ?? 0))}
        />
        <StatCard
          label="Dépôts totaux"
          value={formatMoney(deposits._sum.amountCents ?? 0)}
        />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`card group p-6 transition-colors hover:border-accent/50 ${
              s.urgent ? "border-danger/50" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{s.icon}</span>
              <span
                className={`badge ${
                  s.urgent
                    ? "bg-danger/15 text-danger"
                    : "bg-elevated text-slate-300"
                }`}
              >
                {s.count}
              </span>
            </div>
            <p className="mt-4 text-lg font-bold text-white group-hover:text-accent">
              {s.title}
            </p>
            <p className="mt-1 text-sm text-muted">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
