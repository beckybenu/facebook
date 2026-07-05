"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StartTournamentButton({
  tournamentId,
  entriesCount,
}: {
  tournamentId: string;
  entriesCount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canStart = entriesCount >= 2;

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/start`, {
        method: "POST",
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? "Une erreur est survenue");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="btn-primary"
        disabled={!canStart || loading}
        onClick={start}
      >
        {loading ? "Démarrage…" : "Démarrer le tournoi"}
      </button>
      {!canStart ? (
        <p className="text-xs text-muted">
          Il faut au moins 2 inscrits pour démarrer.
        </p>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
