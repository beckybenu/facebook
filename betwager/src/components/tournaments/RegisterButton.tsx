"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";

export default function RegisterButton({
  tournamentId,
  entryFeeCents,
  isRegistered,
  isFull,
  isLoggedIn,
}: {
  tournamentId: string;
  entryFeeCents: number;
  isRegistered: boolean;
  isFull: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="btn-primary inline-flex px-6 py-3">
        Connectez-vous pour participer
      </Link>
    );
  }

  async function handleClick(action: "register" | "unregister") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/${action}`, {
        method: "POST",
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? "Une erreur est survenue");
        setLoading(false);
        return;
      }
      router.refresh();
      setLoading(false);
    } catch {
      setError("Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {isRegistered ? (
        <button
          type="button"
          className="btn-danger px-6 py-3"
          disabled={loading}
          onClick={() => handleClick("unregister")}
        >
          {loading ? "Désinscription…" : "Se désinscrire"}
        </button>
      ) : (
        <button
          type="button"
          className="btn-primary px-6 py-3"
          disabled={loading || isFull}
          onClick={() => handleClick("register")}
        >
          {isFull
            ? "Tournoi complet"
            : loading
              ? "Inscription…"
              : entryFeeCents > 0
                ? `S'inscrire (${formatMoney(entryFeeCents)})`
                : "S'inscrire gratuitement"}
        </button>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
