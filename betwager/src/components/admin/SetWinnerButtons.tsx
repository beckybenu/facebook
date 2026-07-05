"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Player = { id: string; name: string };

export default function SetWinnerButtons({
  tournamentId,
  round,
  matchIndex,
  p1,
  p2,
}: {
  tournamentId: string;
  round: number;
  matchIndex: number;
  p1: Player;
  p2: Player;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function setWinner(winnerId: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/tournaments/${tournamentId}/winner`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ round, matchIndex, winnerId }),
        }
      );
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
    <div className="rounded-lg border border-edge bg-surface p-4">
      <p className="mb-3 text-sm font-semibold text-white">
        {p1.name} <span className="text-muted">vs</span> {p2.name}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary !py-1.5 text-xs"
          disabled={loading}
          onClick={() => setWinner(p1.id)}
        >
          Victoire de {p1.name}
        </button>
        <button
          type="button"
          className="btn-secondary !py-1.5 text-xs"
          disabled={loading}
          onClick={() => setWinner(p2.id)}
        >
          Victoire de {p2.name}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
