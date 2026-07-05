import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatDate } from "@/lib/money";
import { PageHeader, BackLink, Avatar } from "@/components/ui";
import UserActions from "@/components/admin/UserActions";

export const metadata = { title: "Joueurs — Admin" };

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <BackLink href="/admin" label="Administration" />
      <PageHeader
        title="Gestion des joueurs"
        subtitle="Statut Elite, crédits bonus et vue d'ensemble des comptes."
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-6 py-3">Joueur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3 text-right">Solde</th>
                <th className="px-4 py-3 text-right">V / D</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-edge/50 hover:bg-surface"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        username={u.username}
                        color={u.avatarColor}
                        size={32}
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {u.username}
                          {u.elite ? (
                            <span className="ml-1.5 text-xs text-gold">
                              ★ ELITE
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        u.role === "ADMIN"
                          ? "bg-gold/15 text-gold"
                          : "bg-elevated text-slate-300"
                      }`}
                    >
                      {u.role === "ADMIN" ? "Admin" : "Joueur"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-accent">
                    {formatMoney(u.balanceCents)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-300">
                    {u.wins} / {u.losses}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <UserActions userId={u.id} elite={u.elite} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
