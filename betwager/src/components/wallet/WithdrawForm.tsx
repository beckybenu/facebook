"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";

export default function WithdrawForm({ maxCents }: { maxCents: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const euros = Number(amount.replace(",", "."));
    if (!Number.isFinite(euros) || euros < 10) {
      setError("Le montant minimum de retrait est de 10 €.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: Math.round(euros * 100) }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? "Une erreur est survenue");
      } else {
        setSuccess(
          "Demande de retrait enregistrée — virement sous 24 à 48 h ouvrées."
        );
        setAmount("");
        router.refresh();
      }
    } catch {
      setError("Une erreur est survenue");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div>
        <label className="label" htmlFor="withdraw-amount">
          Montant à retirer (€)
        </label>
        <input
          id="withdraw-amount"
          type="number"
          min={10}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="50"
          className="input"
          required
        />
        <p className="mt-1.5 text-xs text-muted">
          Maximum retirable : {formatMoney(maxCents)}
        </p>
      </div>

      <button
        type="submit"
        className="btn-secondary w-full"
        disabled={loading || maxCents < 1000}
      >
        {loading ? "Demande en cours…" : "Demander un retrait"}
      </button>

      {maxCents < 1000 ? (
        <p className="text-xs text-muted">
          Solde insuffisant pour un retrait (minimum 10 €).
        </p>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {success ? <p className="text-sm text-accent">{success}</p> : null}
    </form>
  );
}
