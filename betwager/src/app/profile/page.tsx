import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { Avatar, StatCard } from "@/components/ui";
import ProfileForm from "@/components/auth/ProfileForm";

export const metadata = { title: "Mon profil — Betwager" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const total = user.wins + user.losses;
  const ratio = total > 0 ? Math.round((user.wins / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="card flex flex-col gap-6 px-8 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Avatar username={user.username} color={user.avatarColor} size={72} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {user.username}
              </h1>
              {user.elite ? (
                <span className="badge bg-gold/15 text-gold">⭐ Elite</span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted">
              {user.email} · {user.country}
            </p>
          </div>
        </div>
        <Link
          href={`/players/${user.username}`}
          className="btn-secondary shrink-0"
        >
          Voir mon profil public →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Victoires" value={String(user.wins)} accent />
        <StatCard label="Défaites" value={String(user.losses)} />
        <StatCard label="Ratio" value={`${ratio} %`} />
        <StatCard label="XP" value={String(user.xp)} />
        <StatCard label="Solde" value={formatMoney(user.balanceCents)} accent />
      </div>

      <div className="card px-8 py-8">
        <h2 className="text-xl font-bold text-white">Modifier mon profil</h2>
        <p className="mb-6 mt-1 text-sm text-muted">
          Ces informations sont visibles sur votre profil public et aident vos
          adversaires à vous retrouver en jeu.
        </p>
        <ProfileForm
          initial={{
            bio: user.bio,
            country: user.country,
            avatarColor: user.avatarColor,
            gamertagPsn: user.gamertagPsn,
            gamertagXbox: user.gamertagXbox,
            gamertagActivision: user.gamertagActivision,
            gamertagEpic: user.gamertagEpic,
          }}
        />
      </div>
    </div>
  );
}
