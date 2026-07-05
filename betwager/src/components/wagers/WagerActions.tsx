"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";

type WagerActionsProps = {
  matchId: string;
  status: string;
  entryFeeCents: number;
  isLoggedIn: boolean;
  isCreator: boolean;
  isOpponent: boolean;
  viewerHasReported: boolean;
  disputeReason: string | null;
  winnerUsername: string | null;
  payoutCents: number;
};

export default function WagerActions({
  matchId,
  status,
  entryFeeCents,
  isLoggedIn,
  isCreator,
  isOpponent,
  viewerHasReported,
  disputeReason,
  winnerUsername,
  payoutCents,
}: WagerActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const isParticipant = isCreator || isOpponent;

  async function call(path: string, key: string, body?: unknown) {
    setError(null);
    setLoading(key);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Une erreur est survenue");
        setLoading(null);
        return;
      }
      router.refresh();
      setLoading(null);
    } catch {
      setError("Impossible de contacter le serveur");
      setLoading(null);
    }
  }

  function handleAccept() {
    if (
      !window.confirm(
        `Accepter ce défi ? Votre mise de ${formatMoney(entryFeeCents)} sera immédiatement débitée de votre portefeuille.`
      )
    )
      return;
    void call(`/api/wagers/${matchId}/accept`, "accept");
  }

  function handleCancel() {
    if (
      !window.confirm(
        "Annuler ce match ? Votre mise vous sera intégralement remboursée."
      )
    )
      return;
    void call(`/api/wagers/${matchId}/cancel`, "cancel");
  }

  function handleReport(result: "WIN" | "LOSS") {
    const label =
      result === "WIN"
        ? "Confirmer votre victoire ? Une fausse déclaration entraîne un litige."
        : "Confirmer votre défaite ? Cette déclaration est définitive.";
    if (!window.confirm(label)) return;
    void call(`/api/wagers/${matchId}/report`, `report-${result}`, { result });
  }

  // ── Match terminé ────────────────────────────────────────────────
  if (status === "COMPLETED") {
    return (
      <div className="card border-accent/40 bg-accent-soft p-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden>
            🏆
          </span>
          <div>
            <p className="text-lg font-bold text-accent">Match terminé</p>
            <p className="mt-1 text-sm text-slate-300">
              {winnerUsername ? (
                <>
                  <span className="font-semibold text-white">
                    {winnerUsername}
                  </span>{" "}
                  remporte le match et empoche{" "}
                  <span className="font-bold text-accent">
                    {formatMoney(payoutCents)}
                  </span>{" "}
                  (frais de service déduits).
                </>
              ) : (
                "Le match est clôturé et les gains ont été versés."
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Litige en cours ──────────────────────────────────────────────
  if (status === "DISPUTED") {
    return (
      <div className="card border-danger/50 bg-danger/10 p-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl" aria-hidden>
            ⚖️
          </span>
          <div>
            <p className="text-lg font-bold text-danger">
              Litige en cours — un arbitre Betwager va trancher
            </p>
            {disputeReason ? (
              <p className="mt-2 text-sm text-slate-300">
                <span className="font-semibold text-white">Motif :</span>{" "}
                {disputeReason}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              Les mises restent bloquées jusqu&apos;à la décision de l&apos;arbitre.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Match annulé ─────────────────────────────────────────────────
  if (status === "CANCELLED") {
    return (
      <div className="card p-6">
        <p className="text-sm text-muted">
          Ce match a été annulé. La mise du créateur a été remboursée.
        </p>
      </div>
    );
  }

  // ── Match ouvert ─────────────────────────────────────────────────
  if (status === "OPEN") {
    if (!isLoggedIn) {
      return (
        <div className="card flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-muted">
            Ce défi attend un adversaire. Prêt à relever le gant ?
          </p>
          <Link href="/login" className="btn-primary px-6">
            Connectez-vous pour accepter
          </Link>
        </div>
      );
    }
    if (isCreator) {
      return (
        <div className="card flex flex-col gap-4 p-6">
          <p className="text-sm text-muted">
            Votre défi est en ligne. Vous pouvez l&apos;annuler tant qu&apos;aucun
            adversaire ne l&apos;a accepté.
          </p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            type="button"
            className="btn-danger self-start px-6"
            onClick={handleCancel}
            disabled={loading !== null}
          >
            {loading === "cancel"
              ? "Annulation…"
              : "Annuler et récupérer ma mise"}
          </button>
        </div>
      );
    }
    return (
      <div className="card flex flex-col gap-4 p-6">
        <p className="text-sm text-muted">
          En acceptant, votre mise de{" "}
          <span className="font-semibold text-white">
            {formatMoney(entryFeeCents)}
          </span>{" "}
          est immédiatement débitée et le match démarre.
        </p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="button"
          className="btn-primary self-start px-6 py-3"
          onClick={handleAccept}
          disabled={loading !== null}
        >
          {loading === "accept"
            ? "Acceptation…"
            : `Accepter le défi (${formatMoney(entryFeeCents)})`}
        </button>
      </div>
    );
  }

  // ── En cours / résultat déclaré ──────────────────────────────────
  if (status === "ACCEPTED" || status === "REPORTED") {
    if (!isParticipant) {
      return (
        <div className="card p-6">
          <p className="text-sm text-muted">
            Match en cours entre les deux joueurs. Le résultat sera affiché ici.
          </p>
        </div>
      );
    }
    if (status === "REPORTED" && viewerHasReported) {
      return (
        <div className="card border-gold/40 bg-gold/5 p-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl" aria-hidden>
              ⏳
            </span>
            <div>
              <p className="font-bold text-gold">
                En attente de la déclaration adverse
              </p>
              <p className="mt-1 text-sm text-muted">
                Votre résultat est enregistré. Le match sera réglé
                automatiquement dès que votre adversaire aura déclaré le sien.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="card flex flex-col gap-4 p-6">
        <p className="text-sm text-muted">
          Le match est joué ? Déclarez votre résultat. Si les deux déclarations
          concordent, les gains sont versés immédiatement.
        </p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary px-6"
            onClick={() => handleReport("WIN")}
            disabled={loading !== null}
          >
            {loading === "report-WIN" ? "Envoi…" : "🏆 J'ai gagné"}
          </button>
          <button
            type="button"
            className="btn-secondary px-6"
            onClick={() => handleReport("LOSS")}
            disabled={loading !== null}
          >
            {loading === "report-LOSS" ? "Envoi…" : "J'ai perdu"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
