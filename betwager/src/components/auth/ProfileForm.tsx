"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initial: {
    bio: string;
    country: string;
    avatarColor: string;
    gamertagPsn: string;
    gamertagXbox: string;
    gamertagActivision: string;
    gamertagEpic: string;
  };
};

export default function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const [bio, setBio] = useState(initial.bio);
  const [country, setCountry] = useState(initial.country);
  const [avatarColor, setAvatarColor] = useState(initial.avatarColor);
  const [gamertagPsn, setGamertagPsn] = useState(initial.gamertagPsn);
  const [gamertagXbox, setGamertagXbox] = useState(initial.gamertagXbox);
  const [gamertagActivision, setGamertagActivision] = useState(
    initial.gamertagActivision
  );
  const [gamertagEpic, setGamertagEpic] = useState(initial.gamertagEpic);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          country,
          avatarColor,
          gamertagPsn,
          gamertagXbox,
          gamertagActivision,
          gamertagEpic,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(body.error ?? "Une erreur est survenue");
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="profile-bio" className="label">
          Bio
        </label>
        <textarea
          id="profile-bio"
          className="input min-h-[96px] resize-y"
          placeholder="Parlez de vous, de vos jeux favoris, de votre style…"
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-country" className="label">
            Pays
          </label>
          <input
            id="profile-country"
            type="text"
            className="input"
            placeholder="FR"
            maxLength={40}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="profile-color" className="label">
            Couleur d&apos;avatar
          </label>
          <div className="flex items-center gap-3">
            <input
              id="profile-color"
              type="color"
              className="h-10 w-14 cursor-pointer rounded-lg border border-edge bg-elevated p-1"
              value={avatarColor}
              onChange={(e) => setAvatarColor(e.target.value)}
            />
            <span className="text-sm text-muted">{avatarColor}</span>
          </div>
        </div>
      </div>

      <div>
        <p className="label">Gamertags</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-psn"
              className="mb-1 block text-xs text-muted"
            >
              🎮 PSN
            </label>
            <input
              id="profile-psn"
              type="text"
              className="input"
              placeholder="Votre ID PlayStation"
              maxLength={40}
              value={gamertagPsn}
              onChange={(e) => setGamertagPsn(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="profile-xbox"
              className="mb-1 block text-xs text-muted"
            >
              🟢 Xbox
            </label>
            <input
              id="profile-xbox"
              type="text"
              className="input"
              placeholder="Votre gamertag Xbox"
              maxLength={40}
              value={gamertagXbox}
              onChange={(e) => setGamertagXbox(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="profile-activision"
              className="mb-1 block text-xs text-muted"
            >
              🎯 Activision
            </label>
            <input
              id="profile-activision"
              type="text"
              className="input"
              placeholder="Votre ID Activision"
              maxLength={40}
              value={gamertagActivision}
              onChange={(e) => setGamertagActivision(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="profile-epic"
              className="mb-1 block text-xs text-muted"
            >
              🚀 Epic Games
            </label>
            <input
              id="profile-epic"
              type="text"
              className="input"
              placeholder="Votre pseudo Epic"
              maxLength={40}
              value={gamertagEpic}
              onChange={(e) => setGamertagEpic(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {success ? (
        <p className="text-sm text-accent">Profil mis à jour avec succès.</p>
      ) : null}

      <div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
