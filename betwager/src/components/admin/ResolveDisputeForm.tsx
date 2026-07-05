"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResolveDisputeForm({
  disputeId,
  creatorId,
  creatorName,
  opponentId,
  opponentName,
}: {
  disputeId: string;
  creatorId: string;
  creatorName: string;
  opponentId: string;
  opponentName: string;
}) {
  const router = useRouter();
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resolve(action: "SETTLE" | "VOID", winnerId?: string) {
    setError(null);
    if (resolution.trim().length < 3) {
      setError("Indiquez un motif de résolution (obligatoire).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, winnerId, resolution }),
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
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor={`resolution-${disputeId}`}>
          Motif de la décision
        </label>
        <input
          id={`resolution-${disputeId}`}
          className="input"
          placeholder="Ex. : preuve vidéo fournie par le créateur"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={() => resolve("SETTLE", creatorId)}
        >
          Victoire de {creatorName}
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={() => resolve("SETTLE", opponentId)}
        >
          Victoire de {opponentName}
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={loading}
          onClick={() => resolve("VOID")}
        >
          Annuler et rembourser les deux joueurs
        </button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
