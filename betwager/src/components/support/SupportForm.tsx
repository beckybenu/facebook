"use client";

import { useState, type FormEvent } from "react";

export function SupportForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? "Une erreur est survenue.");
        return;
      }
      setSent(true);
      setSubject("");
      setMessage("");
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="text-4xl">✅</span>
        <p className="text-lg font-bold text-white">Message envoyé !</p>
        <p className="max-w-sm text-sm text-muted">
          Notre équipe support a bien reçu votre demande et vous répondra sous
          24 heures ouvrées.
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setSent(false)}
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="support-subject" className="label">
          Sujet
        </label>
        <input
          id="support-subject"
          className="input"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex. : problème de retrait, litige sur un match…"
          maxLength={120}
          required
        />
      </div>
      <div>
        <label htmlFor="support-message" className="label">
          Message
        </label>
        <textarea
          id="support-message"
          className="input min-h-[160px] resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez votre problème avec un maximum de détails (identifiant du match, montants, captures d'écran disponibles…)."
          maxLength={2000}
          required
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
