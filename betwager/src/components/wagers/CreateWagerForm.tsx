"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, serviceFeeCents } from "@/lib/money";

type GameOption = { id: string; name: string; icon: string };

const PLATFORMS = [
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox" },
  { value: "PC", label: "PC" },
  { value: "CROSS", label: "Cross-plateforme" },
];

const REGIONS = [
  { value: "EU", label: "Europe" },
  { value: "NA", label: "Amérique du Nord" },
  { value: "ASIA", label: "Asie" },
];

const TEAM_SIZES = [1, 2, 3, 4];

export default function CreateWagerForm({
  games,
  defaultGameId,
}: {
  games: GameOption[];
  defaultGameId?: string;
}) {
  const router = useRouter();
  const [gameId, setGameId] = useState(defaultGameId ?? games[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("PS5");
  const [region, setRegion] = useState("EU");
  const [teamSize, setTeamSize] = useState(1);
  const [rules, setRules] = useState("");
  const [stakeEuros, setStakeEuros] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parsedStake = Number.parseFloat(stakeEuros.replace(",", "."));
  const stakeCents =
    Number.isFinite(parsedStake) && parsedStake > 0
      ? Math.round(parsedStake * 100)
      : 0;
  const grossCents = stakeCents * 2;
  const netGainCents = grossCents - serviceFeeCents(grossCents, false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (stakeCents < 100 || stakeCents > 50000) {
      setError("La mise doit être comprise entre 1 € et 500 €");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wagers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          title,
          rules,
          platform,
          region,
          teamSize,
          entryFeeCents: stakeCents,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? "Une erreur est survenue");
        setLoading(false);
        return;
      }
      router.push(`/wagers/${body.data.id}`);
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="card flex flex-col gap-5 p-6">
        <h2 className="text-lg font-bold text-white">Détails du match</h2>

        <div>
          <label htmlFor="wager-game" className="label">
            Jeu
          </label>
          <select
            id="wager-game"
            className="input"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            required
          >
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.icon} {game.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="wager-title" className="label">
            Titre du défi
          </label>
          <input
            id="wager-title"
            type="text"
            className="input"
            placeholder="Ex. : Duel au sommet — premier à 5 victoires"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={3}
            maxLength={80}
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="wager-platform" className="label">
              Plateforme
            </label>
            <select
              id="wager-platform"
              className="input"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wager-region" className="label">
              Région
            </label>
            <select
              id="wager-region"
              className="input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="wager-teamsize" className="label">
              Format
            </label>
            <select
              id="wager-teamsize"
              className="input"
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
            >
              {TEAM_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}v{size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="wager-rules" className="label">
            Règles du match
          </label>
          <textarea
            id="wager-rules"
            className="input min-h-[110px] resize-y"
            placeholder="Mode de jeu, nombre de manches, restrictions d'armes ou de personnages…"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div>
          <label htmlFor="wager-stake" className="label">
            Mise (en euros)
          </label>
          <input
            id="wager-stake"
            type="number"
            className="input"
            min={1}
            max={500}
            step="0.01"
            value={stakeEuros}
            onChange={(e) => setStakeEuros(e.target.value)}
            required
          />
          <p className="mt-1.5 text-xs text-muted">
            Entre 1 € et 500 €. Votre adversaire misera le même montant.
          </p>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="card border-accent/30 bg-accent-soft p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
          Récapitulatif
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">
              Votre mise
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {stakeCents > 0 ? formatMoney(stakeCents) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">
              Gain potentiel net (frais de 10 % déduits)
            </p>
            <p className="mt-1 text-2xl font-extrabold text-accent">
              {stakeCents > 0 ? formatMoney(netGainCents) : "—"}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          ⚠️ Votre mise est débitée de votre portefeuille dès la création du
          match. Elle vous est intégralement remboursée si vous annulez le défi
          avant qu'un adversaire ne l'accepte.
        </p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
        {loading
          ? "Création…"
          : stakeCents > 0
            ? `Créer le match et miser ${formatMoney(stakeCents)}`
            : "Créer le match"}
      </button>
    </form>
  );
}
