"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserActions({
  userId,
  elite,
}: {
  userId: string;
  elite: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function patch(payload: { elite?: boolean; creditCents?: number }) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn-secondary !px-3 !py-1.5 text-xs"
          disabled={loading}
          onClick={() => patch({ elite: !elite })}
        >
          {elite ? "Retirer Elite" : "Passer Elite"}
        </button>
        <button
          type="button"
          className="btn-secondary !px-3 !py-1.5 text-xs"
          disabled={loading}
          onClick={() => patch({ creditCents: 1000 })}
        >
          Créditer 10 €
        </button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
