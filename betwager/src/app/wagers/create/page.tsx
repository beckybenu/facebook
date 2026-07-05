import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { BackLink, PageHeader } from "@/components/ui";
import CreateWagerForm from "@/components/wagers/CreateWagerForm";

export default async function CreateWagerPage({
  searchParams,
}: {
  searchParams: { game?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });
  const preselected = searchParams.game
    ? games.find((g) => g.slug === searchParams.game)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/wagers" label="Retour au lobby" />
      <PageHeader
        title="Créer un match"
        subtitle="Définissez votre défi : le premier adversaire à l'accepter engage la même mise que vous."
      />
      <div className="mb-6 flex items-center justify-between rounded-xl border border-edge bg-elevated px-5 py-3.5 text-sm">
        <span className="text-muted">Votre solde disponible</span>
        <span className="font-bold text-accent">
          {formatMoney(user.balanceCents)}
        </span>
      </div>
      <CreateWagerForm
        games={games.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
        }))}
        defaultGameId={preselected?.id}
      />
    </div>
  );
}
