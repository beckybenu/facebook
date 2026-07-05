"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK_AMOUNTS = [10, 25, 50, 100];
const METHODS = [
  { key: "card", label: "💳 Carte bancaire" },
  { key: "paypal", label: "🅿️ PayPal" },
  { key: "crypto", label: "₿ Crypto" },
];

export default function DepositForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("25");
  const [method, setMethod] = useState("card");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const euros = Number(amount.replace(",", "."));
    if (!Number.isFinite(euros) || euros < 5 || euros > 1000) {
      setError("Le montant doit être compris entre 5 € et 1 000 €.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(euros * 100) }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? "Une erreur est survenue");
      } else {
        setSuccess(`Dépôt de ${euros.toFixed(2).replace(".", ",")} € crédité !`);
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(String(a))}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              amount === String(a)
                ? "border-accent bg-accent-soft text-accent"
                : "border-edge bg-surface text-slate-300 hover:border-accent/50"
            }`}
          >
            {a} €
          </button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="deposit-amount">
          Montant personnalisé (€)
        </label>
        <input
          id="deposit-amount"
          type="number"
          min={5}
          max={1000}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
          required
        />
      </div>

      <div>
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

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Dépôt en cours…" : "Déposer maintenant"}
      </button>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {success ? <p className="text-sm text-accent">{success}</p> : null}

      <p className="text-xs text-muted">
        Environnement de démonstration : le dépôt est simulé et crédité
        instantanément, sans paiement réel.
      </p>
    </form>
  );
}
