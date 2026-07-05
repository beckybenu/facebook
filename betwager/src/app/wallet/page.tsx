import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatDate } from "@/lib/money";
import { PageHeader, EmptyState } from "@/components/ui";
import DepositForm from "@/components/wallet/DepositForm";
import WithdrawForm from "@/components/wallet/WithdrawForm";

export const metadata = { title: "Portefeuille" };

const TX_LABELS: Record<string, { label: string; className: string }> = {
  DEPOSIT: { label: "Dépôt", className: "bg-accent-soft text-accent" },
  WITHDRAWAL: { label: "Retrait", className: "bg-violet-soft text-violet" },
  WAGER_STAKE: { label: "Mise engagée", className: "bg-gold/15 text-gold" },
  WAGER_PAYOUT: {
    label: "Gains de match",
    className: "bg-accent-soft text-accent",
  },
  WAGER_REFUND: {
    label: "Remboursement",
    className: "bg-muted/15 text-slate-300",
  },
  TOURNAMENT_ENTRY: {
    label: "Inscription tournoi",
    className: "bg-gold/15 text-gold",
  },
  TOURNAMENT_PRIZE: {
    label: "Prix de tournoi",
    className: "bg-accent-soft text-accent",
  },
  BONUS: { label: "Bonus", className: "bg-violet-soft text-violet" },
};

export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Portefeuille"
        subtitle="Gérez vos fonds : dépôts instantanés, retraits sécurisés et historique complet de vos transactions."
      />

      <div className="card bg-hero-grid flex flex-col items-start gap-2 p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Solde disponible
        </p>
        <p className="text-5xl font-black tracking-tight text-accent">
          {formatMoney(user.balanceCents)}
        </p>
        {user.elite ? (
          <span className="badge mt-2 bg-gold/15 text-gold">
            ★ Membre Elite — frais réduits à 5 %
          </span>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Frais de service : 10 % sur les gains (5 % avec le statut Elite).
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white">💳 Déposer des fonds</h2>
          <p className="mt-1 text-sm text-muted">
            De 5 € à 1 000 € par dépôt. Crédité instantanément.
          </p>
          <DepositForm />
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white">
            🏦 Retirer des gains
          </h2>
          <p className="mt-1 text-sm text-muted">
            Minimum 10 €. Virement sous 24 à 48 h ouvrées.
          </p>
          <WithdrawForm maxCents={user.balanceCents} />
        </div>
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="border-b border-edge px-6 py-4">
          <h2 className="font-bold text-white">Historique des transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Aucune transaction"
              subtitle="Effectuez votre premier dépôt pour commencer à jouer."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-6 py-3 text-right">Solde après</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const meta = TX_LABELS[t.type] ?? {
                    label: t.type,
                    className: "bg-muted/15 text-muted",
                  };
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-edge/50 hover:bg-surface"
                    >
                      <td className="whitespace-nowrap px-6 py-3 text-muted">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-300">
                        {t.reference || "—"}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-bold ${
                          t.amountCents >= 0 ? "text-accent" : "text-danger"
                        }`}
                      >
                        {t.amountCents >= 0 ? "+" : "−"}
                        {formatMoney(Math.abs(t.amountCents))}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-right text-slate-300">
                        {formatMoney(t.balanceAfterCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
