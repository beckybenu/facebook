import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import { applyTx, BizError } from "../engine";
import { EmptyState, PageHeader, formatDate, formatMoney } from "../ui";

const TX_LABELS: Record<string, { label: string; className: string }> = {
  DEPOSIT: { label: "Dépôt", className: "bg-accent-soft text-accent" },
  WITHDRAWAL: { label: "Retrait", className: "bg-violet-soft text-violet" },
  WAGER_STAKE: { label: "Mise engagée", className: "bg-gold/15 text-gold" },
  WAGER_PAYOUT: { label: "Gains de match", className: "bg-accent-soft text-accent" },
  WAGER_REFUND: { label: "Remboursement", className: "bg-muted/15 text-slate-300" },
  TOURNAMENT_ENTRY: { label: "Inscription tournoi", className: "bg-gold/15 text-gold" },
  TOURNAMENT_PRIZE: { label: "Prix de tournoi", className: "bg-accent-soft text-accent" },
  BONUS: { label: "Bonus", className: "bg-violet-soft text-violet" },
};

const QUICK = [10, 25, 50, 100];
const METHODS = [
  { key: "card", label: "💳 Carte bancaire" },
  { key: "paypal", label: "🅿️ PayPal" },
  { key: "crypto", label: "₿ Crypto" },
];

export function Wallet() {
  const { state, me, mutate } = useStore();
  const [depositAmount, setDepositAmount] = useState("25");
  const [method, setMethod] = useState("card");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  if (!me)
    return (
      <EmptyState
        title="Connectez-vous pour accéder à votre portefeuille"
        action={<Link to="/login" className="btn-primary">Connexion</Link>}
      />
    );

  const transactions = state.transactions
    .filter((t) => t.userId === me.id)
    .slice(0, 50);

  function deposit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const euros = Number(depositAmount.replace(",", "."));
    if (!Number.isFinite(euros) || euros < 5 || euros > 1000) {
      setMessage({ kind: "err", text: "Le montant doit être compris entre 5 € et 1 000 €." });
      return;
    }
    const res = mutate((s) => {
      applyTx(s, me!.id, "DEPOSIT", Math.round(euros * 100), "Dépôt par carte (démo)");
    });
    setMessage(
      res.ok
        ? { kind: "ok", text: `Dépôt de ${euros.toFixed(2).replace(".", ",")} € crédité !` }
        : { kind: "err", text: res.error }
    );
  }

  function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const euros = Number(withdrawAmount.replace(",", "."));
    if (!Number.isFinite(euros) || euros < 10) {
      setMessage({ kind: "err", text: "Le montant minimum de retrait est de 10 €." });
      return;
    }
    const res = mutate((s) => {
      const cents = Math.round(euros * 100);
      const user = s.users.find((u) => u.id === me!.id)!;
      if (cents > user.balanceCents) throw new BizError("Solde insuffisant");
      applyTx(s, me!.id, "WITHDRAWAL", -cents, "Demande de retrait");
    });
    setMessage(
      res.ok
        ? { kind: "ok", text: "Demande de retrait enregistrée — virement sous 24 à 48 h ouvrées." }
        : { kind: "err", text: res.error }
    );
    if (res.ok) setWithdrawAmount("");
  }

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
          {formatMoney(me.balanceCents)}
        </p>
        {me.elite ? (
          <span className="badge mt-2 bg-gold/15 text-gold">
            ★ Membre Elite — frais réduits à 5 %
          </span>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Frais de service : 10 % sur les gains (5 % avec le statut Elite).
          </p>
        )}
      </div>

      {message ? (
        <p
          className={`mt-4 text-sm ${
            message.kind === "ok" ? "text-accent" : "text-danger"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={deposit} className="card p-6">
          <h2 className="text-lg font-bold text-white">💳 Déposer des fonds</h2>
          <p className="mt-1 text-sm text-muted">
            De 5 € à 1 000 € par dépôt. Crédité instantanément.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setDepositAmount(String(a))}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  depositAmount === String(a)
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-edge bg-surface text-slate-300 hover:border-accent/50"
                }`}
              >
                {a} €
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="label">Montant personnalisé (€)</label>
            <input
              type="number"
              min={5}
              max={1000}
              step="0.01"
              className="input"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
          </div>
          <div className="mt-4">
            <p className="label">Moyen de paiement</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                    method === m.key
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-edge bg-surface text-slate-300 hover:border-accent/50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary mt-5 w-full">
            Déposer maintenant
          </button>
          <p className="mt-3 text-xs text-muted">
            Démo : le dépôt est simulé et crédité instantanément, sans paiement réel.
          </p>
        </form>

        <form onSubmit={withdraw} className="card p-6">
          <h2 className="text-lg font-bold text-white">🏦 Retirer des gains</h2>
          <p className="mt-1 text-sm text-muted">
            Minimum 10 €. Virement sous 24 à 48 h ouvrées.
          </p>
          <div className="mt-5">
            <label className="label">Montant à retirer (€)</label>
            <input
              type="number"
              min={10}
              step="0.01"
              className="input"
              placeholder="50"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
            />
            <p className="mt-1.5 text-xs text-muted">
              Maximum retirable : {formatMoney(me.balanceCents)}
            </p>
          </div>
          <button
            type="submit"
            className="btn-secondary mt-5 w-full"
            disabled={me.balanceCents < 1000}
          >
            Demander un retrait
          </button>
          {me.balanceCents < 1000 ? (
            <p className="mt-3 text-xs text-muted">
              Solde insuffisant pour un retrait (minimum 10 €).
            </p>
          ) : null}
        </form>
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
                    <tr key={t.id} className="border-b border-edge/50 hover:bg-surface">
                      <td className="whitespace-nowrap px-6 py-3 text-muted">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${meta.className}`}>{meta.label}</span>
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

export function Notifications() {
  const { state, me, mutate } = useStore();
  if (!me)
    return (
      <EmptyState
        title="Connectez-vous pour voir vos notifications"
        action={<Link to="/login" className="btn-primary">Connexion</Link>}
      />
    );

  const notifs = state.notifications
    .filter((n) => n.userId === me.id)
    .slice(0, 50);
  const hasUnread = notifs.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        action={
          hasUnread ? (
            <button
              className="btn-secondary"
              onClick={() =>
                mutate((s) => {
                  s.notifications.forEach((n) => {
                    if (n.userId === me.id) n.read = true;
                  });
                })
              }
            >
              Tout marquer comme lu
            </button>
          ) : undefined
        }
      />
      {notifs.length === 0 ? (
        <EmptyState
          title="Aucune notification"
          subtitle="L'activité de vos matchs et tournois apparaîtra ici."
        />
      ) : (
        <ul className="space-y-3">
          {notifs.map((n) => (
            <li key={n.id}>
              <Link
                to={n.href || "#"}
                className={`card block p-5 transition-colors hover:border-accent/50 ${
                  !n.read ? "border-accent/50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{n.title}</p>
                  <span className="whitespace-nowrap text-xs text-muted">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
                {n.body ? <p className="mt-1 text-sm text-muted">{n.body}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
